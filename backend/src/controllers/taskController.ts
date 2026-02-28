import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";
import {
  getRecentTasksByAdmin,
  updateTaskStatusInDB,
} from "../services/taskService";
import dotenv from "dotenv";
import { getPreviousTasksByUser } from "../services/taskService";
import { Prisma, TaskStatus } from "@prisma/client";
import redis from "../config/redis";
import { addJobToQueue } from "../queues/taskQueue";

const CACHE_TTL = 600; // 10 minutes (in seconds)

declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string; email: string; role: string };
  }
}
dotenv.config();

interface AssignTaskRequestBody {
  title: string;
  description: string;
  deadline: string;
  assignees: string[]; // Updated for multiple assignees
  priority: { code: string; name: string; color: string };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  approved: boolean;
  departmentId?: string | null;
}

export const assignTask = async (req: Request, res: Response) => {
  try {
    const { title, description, deadline, assignees, priorityId } = req.body;

    if (!priorityId) {
      return res
        .status(401)
        .json({ message: "Priority is necessary to create a task." });
    }

    const priority = await prisma.priority.findFirst({
      where: { id: priorityId, isActive: true },
    });

    if (!priority) {
      return res.status(400).json({ message: "Invalid priority." });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!title || !description || !deadline || !assignees) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Ensure assignees is an array
    const assigneeIds = Array.isArray(assignees) ? assignees : [assignees];

    if (assigneeIds.length === 0) {
      return res.status(400).json({ message: "At least one assignee is required" });
    }

    const reqUser = req.user as any;
    if (reqUser.role === "MANAGER") {
      const managerDeptId = reqUser.departmentId;
      if (!managerDeptId) {
        return res.status(403).json({ message: "Manager does not have a department." });
      }
      // Fetch assignees to check their department
      const usersToAssign = await prisma.user.findMany({
        where: { id: { in: assigneeIds } }
      });
      const invalidUsers = usersToAssign.filter(u => u.departmentId !== managerDeptId);
      if (invalidUsers.length > 0) {
        return res.status(403).json({ message: "Managers can only assign tasks to users in their department." });
      }
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ message: "Invalid deadline format" });
    }

    // Calculate next readableId
    const lastTask = await prisma.task.findFirst({
      orderBy: { readableId: "desc" },
      select: { readableId: true },
    });
    const nextReadableId = (lastTask?.readableId || 0) + 1;

    const newTask = await prisma.task.create({
      data: {
        readableId: nextReadableId,
        title,
        description,
        deadline: deadlineDate,
        assignedById: req.user.id,
        priorityId,
        status: TaskStatus.ACTIVE,
        createdAt: new Date(),
        assignees: {
          connect: assigneeIds.map((id: string) => ({ id })),
        },
      },
      include: {
        priority: {
          select: {
            code: true,
            name: true,
            color: true,
          },
        },
        assignees: { // Include assignees
          select: {
            name: true,
            id: true,
            department: { select: { name: true, id: true } },
          },
        },
        assignedBy: {
          select: { name: true, id: true },
        },
      },
    });

    // Invalidate caches
    await redis.del("recent_tasks:ADMIN");
    assigneeIds.forEach((id: string) => redis.del(`my_tasks:${id}`));

    // Dispatch background job for email notifications
    assigneeIds.forEach((id: string) => {
      addJobToQueue("send-email", {
        taskId: newTask.id,
        to: id,
        subject: `New Task Assigned: ${newTask.title}`,
      });
    });

    res.status(201).json({
      message: "Task assigned successfully",
      task: newTask,
    });
  } catch (error: any) {
    console.error("Error assigning task:", error);
    res
      .status(500)
      .json({ message: "Error creating task", error: error.message });
  }
};

export const getTasksController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const skip = (page - 1) * limit;

    const tasks = await prisma.task.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        readableId: true,
        title: true,
        status: true,
        deadline: true,
        priorityId: true,
        createdAt: true,
        priority: {
          select: {
            code: true,
            name: true,
            color: true,
          },
        },
        assignees: {
          select: {
            name: true,
            id: true,
            department: { select: { name: true, id: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ tasks, page, limit });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to fetch tasks", error: error.message });
  }
};

export const getRecentTasks = async (req: Request, res: Response) => {
  const reqUser = req.user as any;
  const adminId = reqUser?.id;

  try {
    let whereClause: any = {};
    let cacheKey = "recent_tasks:";

    if (reqUser?.role === "MANAGER" && reqUser?.departmentId) {
      whereClause = {
        OR: [
          { assignedById: adminId },
          { assignees: { some: { departmentId: reqUser.departmentId } } }
        ]
      };
      cacheKey += `MANAGER:${reqUser.departmentId}`;
    } else if (reqUser?.role === "ADMIN") {
      cacheKey += "ADMIN";
    } else {
      whereClause = { assignedById: adminId };
      cacheKey += `USER:${adminId}`;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const skip = (page - 1) * limit;

    // Cache ONLY first default page to keep invalidation keys predictable
    const shouldCache = page === 1 && limit === 10;

    if (shouldCache) {
      const startTime = performance.now();
      const cachedTasks = await redis.get(cacheKey);
      if (cachedTasks) {
        const redisLatency = performance.now() - startTime;
        console.log(`[Cache HIT] Redis Latency: ${redisLatency.toFixed(2)}ms | Key: ${cacheKey}`);
        return res.json(JSON.parse(cachedTasks));
      }
    }

    const dbStartTime = performance.now();
    const tasks = await prisma.task.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        readableId: true,
        title: true,
        status: true,
        deadline: true,
        priorityId: true,
        createdAt: true,
        priority: {
          select: { code: true, name: true, color: true },
        },
        assignees: {
          select: {
            name: true,
            id: true,
            department: { select: { name: true, id: true } },
          }
        },
        assignedBy: {
          select: { name: true, id: true },
        },
      },
    });

    const dbLatency = performance.now() - dbStartTime;
    const response = { tasks, page, limit };

    if (shouldCache) {
      console.log(`[Cache MISS] DB Latency: ${dbLatency.toFixed(2)}ms | Key: ${cacheKey}`);
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));
    } else {
      console.log(`[DB Query] Page ${page} (Limit ${limit}) | DB Latency: ${dbLatency.toFixed(2)}ms`);
    }

    return res.json(response);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to fetch recent tasks", error: error.message });
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
    const shouldCache = page === 1 && limit === 10;

    if (shouldCache) {
      const startTime = performance.now();
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        const redisLatency = performance.now() - startTime;
        console.log(`[Cache HIT] Redis Latency: ${redisLatency.toFixed(2)}ms | Key: ${cacheKey}`);
        return res.json(JSON.parse(cachedData));
      }
    }

    const dbStartTime = performance.now();
    const tasks = await prisma.task.findMany({
      where: {
        assignees: {
          some: {
            id: userId
          }
        },
        OR: [{ status: TaskStatus.ACTIVE }, { status: TaskStatus.DELAYED }, { status: TaskStatus.COMPLETED }]
      },
      skip,
      take: limit,
      select: {
        id: true,
        readableId: true,
        title: true,
        status: true,
        deadline: true,
        priorityId: true,
        createdAt: true,
        priority: {
          select: { code: true, name: true, color: true },
        },
        assignees: {
          select: { name: true, id: true },
        },
        assignedBy: {
          select: { name: true, id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const dbLatency = performance.now() - dbStartTime;
    const response = { tasks, page, limit };

    if (shouldCache) {
      console.log(`[Cache MISS] DB Latency: ${dbLatency.toFixed(2)}ms | Key: ${cacheKey}`);
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));
    } else {
      console.log(`[DB Query] Page ${page} (Limit ${limit}) | DB Latency: ${dbLatency.toFixed(2)}ms`);
    }

    res.json(response);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching tasks", error: error.message });
  }
};

export const getDelayedTasks = async (req: Request, res: Response) => {
  try {
    const reqUser = req.user as any;
    const adminId = reqUser?.id;
    if (!adminId) {
      return res.status(400).json({ error: "Missing adminId" });
    }
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(
      req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      100,
    );
    const skip = (page - 1) * limit;

    const assigneeId = req.query.userId as string | undefined;
    const departmentId = req.query.departmentId as string | undefined;
    const assignedByUserId = req.query.assignedByUserId as string | undefined;

    let baseWhere: any = {};
    if (reqUser?.role === "MANAGER" && reqUser?.departmentId) {
      baseWhere = {
        OR: [
          { assignedById: adminId },
          { assignees: { some: { departmentId: reqUser.departmentId } } }
        ]
      };
    } else if (reqUser?.role !== "ADMIN") {
      baseWhere = { assignedById: adminId };
    }

    const tasks = await prisma.task.findMany({
      where: {
        AND: [
          baseWhere,
          {
            deadline: { lt: new Date() },
            status: { in: [TaskStatus.ACTIVE, TaskStatus.DELAYED] },
            ...(assigneeId && { assignees: { some: { id: assigneeId } } }),
            ...(departmentId && !assigneeId && { assignees: { some: { departmentId } } }),
            ...(assignedByUserId && { assignedById: assignedByUserId }),
          }
        ]
      },
      skip,
      take: limit,
      orderBy: {
        deadline: "asc",
      },
      select: {
        id: true,
        readableId: true,
        title: true,
        status: true,
        deadline: true,
        priorityId: true,
        createdAt: true,
        priority: {
          select: { code: true, name: true, color: true },
        },
        assignees: {
          select: {
            name: true,
            id: true,
          },
        },
        assignedBy: {
          select: { name: true, id: true },
        },
      },
    });
    res.status(200).json({ tasks, page, limit });
  } catch (error: any) {
    console.error("Error fetching delayed tasks:", error);
    res.status(500).json({
      message: "Failed to fetch delayed tasks",
      error: error.message,
    });
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { status } = req.body;

  if (
    ![TaskStatus.ACTIVE, TaskStatus.COMPLETED, TaskStatus.DELAYED].includes(
      status,
    )
  ) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const { deadline } = req.body;
    let deadlineDate: Date | undefined;

    if (deadline) {
      deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) {
        return res.status(400).json({ error: "Invalid deadline format" });
      }
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignees: true },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isAssignee = task.assignees.some((a) => a.id === user.id);
    const isAdminOrManager =
      user.role === "ADMIN" || user.role === "MANAGER";

    if (!isAssignee && !isAdminOrManager) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this task." });
    }

    // Role-based restriction: Only Admin and Manager can reactivate tasks (set status to ACTIVE)
    if (status === TaskStatus.ACTIVE && !isAdminOrManager) {
      return res
        .status(403)
        .json({ message: "Only Admin or Manager can reactivate a task." });
    }

    const updatedTask = await updateTaskStatusInDB(taskId, status, deadlineDate);

    // Invalidate caches
    await redis.del("recent_tasks:ADMIN");
    task.assignees.forEach(a => redis.del(`my_tasks:${a.id}`));

    return res
      .status(200)
      .json({ message: "Task status updated", task: updatedTask });
  } catch (error) {
    console.error("Failed to update task status:", error);
    return res.status(500).json({ error: "Failed to update task status" });
  }
};

export const getPreviousTasks = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const tasks = await getPreviousTasksByUser(userId);
    return res.status(200).json(tasks);
  } catch (error) {
    console.error("Failed to fetch previous tasks:", error);
    return res.status(500).json({ error: "Failed to fetch previous tasks" });
  }
};

export const getTaskLimit = async (req: Request, res: Response) => {
  const reqUser = req.user as any;
  const adminId = reqUser?.id;
  const limit = Math.min(
    req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
    100,
  );
  const assigneeId = req.query.userId as string | undefined;
  const departmentId = req.query.departmentId as string | undefined;
  const assignedByUserId = req.query.assignedByUserId as string | undefined;

  if (!adminId) {
    return res.status(400).json({ error: "Missing adminId" });
  }

  let baseWhere: any = {};
  if (reqUser?.role === "MANAGER" && reqUser?.departmentId) {
    baseWhere = {
      OR: [
        { assignedById: adminId },
        { assignees: { some: { departmentId: reqUser.departmentId } } }
      ]
    };
  } else if (reqUser?.role !== "ADMIN") {
    baseWhere = { assignedById: adminId };
  }

  const tasks = await prisma.task.findMany({
    where: {
      AND: [
        baseWhere,
        {
          ...(assigneeId && { assignees: { some: { id: assigneeId } } }),
          ...(departmentId && !assigneeId && { assignees: { some: { departmentId } } }),
          ...(assignedByUserId && { assignedById: assignedByUserId }),
        }
      ]
    },
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      priority: {
        select: {
          code: true,
          name: true,
          color: true,
        },
      },
      assignees: {
        select: {
          id: true,
          name: true,
          department: {
            select: { id: true, name: true },
          },
        },
      },
      assignedBy: {
        select: { id: true, name: true },
      },
    },
  });
  res.json({ tasks });
};

// Start of Selection
export const getNextTaskId = async (req: Request, res: Response) => {
  try {
    const lastTask = await prisma.task.findFirst({
      orderBy: { readableId: "desc" },
      select: { readableId: true },
    });
    const nextId = (lastTask?.readableId || 0) + 1;
    res.json({ nextId });
  } catch (error) {
    console.error("Failed to get next task ID:", error);
    res.status(500).json({ message: "Failed to get next task ID" });
  }
};
// End of Selection

export const getTaskById = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const taskId = req.params.id;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        priority: {
          select: { code: true, name: true, color: true },
        },
        logs: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            user: { select: { name: true, role: true } },
          },
        },
        assignedBy: true,
        assignees: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!task) return res.status(404).json({ message: "Task not found" });

    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isAssignee = task.assignees.some((a) => a.id === user.id);
    const isCreator = task.assignedById === user.id;
    const isAdminOrManager =
      user.role === "ADMIN" || user.role === "MANAGER";

    if (!isAssignee && !isCreator && !isAdminOrManager) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(task);
  } catch (error) {
    console.error("Failed to get task:", error);
    res.status(500).json({ message: "Error fetching task" });
  }
};

export const getDashboardAggregates = async (req: Request, res: Response) => {
  const reqUser = req.user as any;
  const adminId = reqUser?.id;
  if (!adminId) {
    return res.status(400).json({ error: "Missing adminId" });
  }

  try {
    const assigneeId = req.query.userId as string | undefined;
    const departmentId = req.query.departmentId as string | undefined;
    const assignedByUserId = req.query.assignedByUserId as string | undefined;

    let baseManagerWhere: any = {};
    if (reqUser?.role === "MANAGER" && reqUser?.departmentId) {
      baseManagerWhere = {
        OR: [
          { assignedById: adminId },
          { assignees: { some: { departmentId: reqUser.departmentId } } }
        ]
      };
    } else if (reqUser?.role !== "ADMIN") {
      baseManagerWhere = { assignedById: adminId };
    }

    const baseWhere: Prisma.TaskWhereInput = {
      AND: [
        baseManagerWhere,
        {
          ...(assigneeId && { assignees: { some: { id: assigneeId } } }),
          ...(departmentId && !assigneeId && { assignees: { some: { departmentId } } }),
          ...(assignedByUserId && { assignedById: assignedByUserId }),
        }
      ]
    } as any;
    const now = new Date();
    const [total, active, delayed, completed] = await Promise.all([
      prisma.task.count({ where: baseWhere }),
      prisma.task.count({
        where: {
          ...baseWhere,
          status: TaskStatus.ACTIVE,
        },
      }),
      prisma.task.count({
        where: {
          ...baseWhere,
          deadline: { lt: now },
          status: {
            in: [TaskStatus.ACTIVE, TaskStatus.DELAYED],
          },
        },
      }),
      prisma.task.count({
        where: {
          ...baseWhere,
          status: TaskStatus.COMPLETED,
        },
      }),
    ]);
    res.json({
      total,
      active,
      delayed,
      completed,
    });
  } catch (error: any) {
    console.error("Error in getDashboardAggregates:", error);
    res.status(500).json({ message: "Failed to fetch aggregates", error: error.message });
  }
};
export const updateTaskAssignees = async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { assignees } = req.body;
  if (!Array.isArray(assignees)) return res.status(400).json({ error: 'assignees must be an array of IDs' });

  try {
    const task = await prisma.task.findUnique({ where: { id: taskId }, include: { assignees: true } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const reqUser = req.user as any;
    if (!reqUser || (reqUser.role !== 'MANAGER' && reqUser.role !== 'ADMIN')) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (reqUser.role === 'MANAGER') {
      const usersToAssign = await prisma.user.findMany({ where: { id: { in: assignees } } });
      const invalidUsers = usersToAssign.filter((u: any) => u.departmentId !== reqUser.departmentId);
      if (invalidUsers.length > 0) {
        return res.status(403).json({ message: 'Managers can only assign users in their department.' });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { assignees: { set: assignees.map((id: string) => ({ id })) } },
      include: {
        assignees: { select: { id: true, name: true, department: { select: { name: true, id: true } } } },
        priority: { select: { code: true, name: true, color: true } },
        assignedBy: { select: { name: true, id: true } }
      }
    });

    return res.status(200).json({ message: 'Assignees updated', task: updatedTask });
  } catch (error) {
    console.error('Failed to update task assignees:', error);
    return res.status(500).json({ error: 'Failed to update task assignees' });
  }
};
