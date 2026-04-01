import { Request, Response } from "express";
import prisma from "../config/prisma";
import {
  getTasksFromDB,
  getTaskCount,
  getTaskByIdFromDB,
  createTaskInDB,
  updateTaskStatusInDB,
  updateTaskAssigneesInDB,
  getPreviousTasksByUser,
  getAggregates,
  getNextReadableId,
} from "../services/taskService";
import { TaskStatus, Prisma } from "@prisma/client";
import redis from "../config/redis";
import { addJobToQueue } from "../queues/taskQueue";
import dotenv from "dotenv";

dotenv.config();

const CACHE_TTL = 600;

const invalidateTaskCaches = async (assigneeIds: string[]) => {
  await redis.del("recent_tasks:ADMIN");
  for (const id of assigneeIds) {
    await redis.del(`my_tasks:${id}`);
  }
};

export const assignTask = async (req: Request, res: Response) => {
  try {
    const { title, description, deadline, assignees, priorityId } = req.body;
    if (!priorityId) return res.status(401).json({ message: "Priority is necessary to create a task." });

    const priority = await prisma.priority.findFirst({ where: { id: priorityId, isActive: true } });
    if (!priority) return res.status(400).json({ message: "Invalid priority." });

    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });

    if (!title || !description || !deadline || !assignees) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const assigneeIds = Array.isArray(assignees) ? assignees : [assignees];
    if (assigneeIds.length === 0) return res.status(400).json({ message: "At least one assignee is required" });

    const reqUser = req.user as any;
    if (reqUser.role === "MANAGER") {
      const managerDeptId = reqUser.departmentId;
      if (!managerDeptId) return res.status(403).json({ message: "Manager does not have a department." });

      const usersToAssign = await prisma.user.findMany({ where: { id: { in: assigneeIds } } });
      if (usersToAssign.some((u) => u.departmentId !== managerDeptId)) {
        return res.status(403).json({ message: "Managers can only assign tasks to users in their department." });
      }
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) return res.status(400).json({ message: "Invalid deadline format" });

    const newTask = await createTaskInDB({
      title,
      description,
      deadline: deadlineDate,
      assignedById: reqUser.id,
      priorityId,
      assigneeIds,
    });

    await invalidateTaskCaches(assigneeIds);

    assigneeIds.forEach((id) => {
      addJobToQueue("send-email", { taskId: newTask.id, to: id, subject: `New Task Assigned: ${newTask.title}` });
    });

    res.status(201).json({ message: "Task assigned successfully", task: newTask });
  } catch (error: any) {
    console.error("Error assigning task:", error);
    res.status(500).json({ message: "Error creating task", error: error.message });
  }
};

export const getTasksController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const skip = (page - 1) * limit;

    const tasks = await getTasksFromDB({}, skip, limit);
    res.json({ tasks, page, limit });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch tasks", error: error.message });
  }
};

export const getRecentTasks = async (req: Request, res: Response) => {
  const reqUser = req.user as any;
  const userId = reqUser?.id;

  try {
    let where: Prisma.TaskWhereInput = {};
    let cacheKey = "recent_tasks:";

    if (reqUser?.role === "MANAGER" && reqUser?.departmentId) {
      where = { OR: [{ assignedById: userId }, { assignees: { some: { departmentId: reqUser.departmentId } } }] };
      cacheKey += `MANAGER:${reqUser.departmentId}`;
    } else if (reqUser?.role === "ADMIN") {
      cacheKey += "ADMIN";
    } else {
      where = { assignedById: userId };
      cacheKey += `USER:${userId}`;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const skip = (page - 1) * limit;

    const shouldCache = page === 1 && limit === 10;
    if (shouldCache) {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    }

    const tasks = await getTasksFromDB(where, skip, limit);
    const response = { tasks, page, limit };

    if (shouldCache) await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));

    return res.json(response);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch recent tasks", error: error.message });
  }
};

export const getMyTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const skip = (page - 1) * limit;
    const cacheKey = `my_tasks:${userId}`;

    if (page === 1 && limit === 10) {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    }

    const where = {
      assignees: { some: { id: userId } },
      OR: [{ status: TaskStatus.ACTIVE }, { status: TaskStatus.DELAYED }, { status: TaskStatus.COMPLETED }],
    };

    const tasks = await getTasksFromDB(where, skip, limit);
    const response = { tasks, page, limit };

    if (page === 1 && limit === 10) await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));

    res.json(response);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching tasks", error: error.message });
  }
};

export const getDelayedTasks = async (req: Request, res: Response) => {
  try {
    const reqUser = req.user as any;
    if (!reqUser?.id) return res.status(400).json({ error: "Missing userId" });

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const skip = (page - 1) * limit;

    const { userId: assigneeId, departmentId, assignedByUserId } = req.query as any;

    let baseWhere: Prisma.TaskWhereInput = {};
    if (reqUser.role === "MANAGER" && reqUser.departmentId) {
      baseWhere = { OR: [{ assignedById: reqUser.id }, { assignees: { some: { departmentId: reqUser.departmentId } } }] };
    } else if (reqUser.role !== "ADMIN") {
      baseWhere = { assignedById: reqUser.id };
    }

    const where: Prisma.TaskWhereInput = {
      AND: [
        baseWhere,
        {
          deadline: { lt: new Date() },
          status: { in: [TaskStatus.ACTIVE, TaskStatus.DELAYED] },
          ...(assigneeId && { assignees: { some: { id: assigneeId } } }),
          ...(departmentId && !assigneeId && { assignees: { some: { departmentId } } }),
          ...(assignedByUserId && { assignedById: assignedByUserId }),
        },
      ],
    };

    const tasks = await getTasksFromDB(where, skip, limit, { deadline: "asc" });
    res.status(200).json({ tasks, page, limit });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch delayed tasks", error: error.message });
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { status, deadline } = req.body;

  if (![TaskStatus.ACTIVE, TaskStatus.COMPLETED, TaskStatus.DELAYED].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const task = await getTaskByIdFromDB(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const user = req.user as any;
    const isAssignee = task.assignees.some((a) => a.id === user.id);
    const isAdminOrManager = user.role === "ADMIN" || user.role === "MANAGER";

    if (!isAssignee && !isAdminOrManager) return res.status(403).json({ message: "Access denied." });
    if (status === TaskStatus.ACTIVE && !isAdminOrManager) return res.status(403).json({ message: "Only Admin or Manager can reactivate." });

    let deadlineDate: Date | undefined;
    if (deadline) {
      deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) return res.status(400).json({ error: "Invalid deadline" });
    }

    const updatedTask = await updateTaskStatusInDB(taskId, status, deadlineDate);
    await invalidateTaskCaches(task.assignees.map((a) => a.id));

    return res.status(200).json({ message: "Task status updated", task: updatedTask });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update status" });
  }
};

export const getPreviousTasks = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const tasks = await getPreviousTasksByUser(userId);
    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch previous tasks" });
  }
};

export const getTaskLimit = async (req: Request, res: Response) => {
  try {
    const reqUser = req.user as any;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const { userId: assigneeId, departmentId, assignedByUserId } = req.query as any;

    let baseWhere: Prisma.TaskWhereInput = {};
    if (reqUser.role === "MANAGER" && reqUser.departmentId) {
      baseWhere = { OR: [{ assignedById: reqUser.id }, { assignees: { some: { departmentId: reqUser.departmentId } } }] };
    } else if (reqUser.role !== "ADMIN") {
      baseWhere = { assignedById: reqUser.id };
    }

    const where = {
      AND: [
        baseWhere,
        {
          ...(assigneeId && { assignees: { some: { id: assigneeId } } }),
          ...(departmentId && !assigneeId && { assignees: { some: { departmentId } } }),
          ...(assignedByUserId && { assignedById: assignedByUserId }),
        },
      ],
    };

    const tasks = await getTasksFromDB(where, 0, limit);
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: "Error fetching task limit" });
  }
};

export const getNextTaskId = async (req: Request, res: Response) => {
  try {
    const nextId = await getNextReadableId();
    res.json({ nextId });
  } catch (error) {
    res.status(500).json({ message: "Failed to get next ID" });
  }
};

export const getTaskById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const task = await getTaskByIdFromDB(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const user = req.user as any;
    const isAuthorized = task.assignees.some((a) => a.id === user.id) || task.assignedById === user.id || user.role === "ADMIN" || user.role === "MANAGER";

    if (!isAuthorized) return res.status(403).json({ message: "Access denied" });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Error fetching task" });
  }
};

export const getDashboardAggregates = async (req: Request, res: Response) => {
  try {
    const reqUser = req.user as any;
    const { userId: assigneeId, departmentId, assignedByUserId } = req.query as any;

    let baseWhere: Prisma.TaskWhereInput = {};
    if (reqUser.role === "MANAGER" && reqUser.departmentId) {
      baseWhere = { OR: [{ assignedById: reqUser.id }, { assignees: { some: { departmentId: reqUser.departmentId } } }] };
    } else if (reqUser.role !== "ADMIN") {
      baseWhere = { assignedById: reqUser.id };
    }

    const where = {
      AND: [
        baseWhere,
        {
          ...(assigneeId && { assignees: { some: { id: assigneeId } } }),
          ...(departmentId && !assigneeId && { assignees: { some: { departmentId } } }),
          ...(assignedByUserId && { assignedById: assignedByUserId }),
        },
      ],
    } as any;

    const aggregates = await getAggregates(where);
    res.json(aggregates);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch aggregates" });
  }
};

export const updateTaskAssignees = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { assignees } = req.body;
    if (!Array.isArray(assignees)) return res.status(400).json({ error: "assignees must be an array" });

    const task = await getTaskByIdFromDB(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const reqUser = req.user as any;
    if (reqUser.role === "MANAGER") {
      const usersToAssign = await prisma.user.findMany({ where: { id: { in: assignees } } });
      if (usersToAssign.some((u) => u.departmentId !== reqUser.departmentId)) {
        return res.status(403).json({ message: "Managers can only assign users in their department." });
      }
    }

    const updatedTask = await updateTaskAssigneesInDB(taskId, assignees);
    await invalidateTaskCaches([...task.assignees.map((a) => a.id), ...assignees]);

    return res.status(200).json({ message: "Assignees updated", task: updatedTask });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update assignees" });
  }
};
