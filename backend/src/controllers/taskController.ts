import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";
import {
  getRecentTasksByAdmin,
  updateTaskStatusInDB,
} from "../services/taskService";
import dotenv from "dotenv";
import { getPreviousTasksByUser } from "../services/taskService";
import { Prisma, TaskStatus } from "@prisma/client";

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
    const tasks = await prisma.task.findMany({
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
            name: true,
            id: true,
            department: { select: { name: true, id: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ tasks });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to fetch tasks", error: error.message });
  }
};

export const getRecentTasks = async (req: Request, res: Response) => {
  const adminId = req.user?.id;

  try {
    const tasks = await prisma.task.findMany({
      where: { assignedById: adminId },
      orderBy: { createdAt: "desc" },
      include: {
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

    return res.json({ tasks });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to fetch recent tasks", error: error.message });
  }
};

export const getMyTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const tasks = await prisma.task.findMany({
      where: {
        assignees: {
          some: {
            id: userId
          }
        },
        OR: [{ status: TaskStatus.ACTIVE }, { status: TaskStatus.DELAYED }, { status: TaskStatus.COMPLETED }]
      },
      include: {
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
    });

    res.json(tasks);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching tasks", error: error.message });
  }
};

export const getDelayedTasks = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(400).json({ error: "Missing adminId" });
    }
    const limit = Math.min(
      req.query.limit ? parseInt(req.query.limit as string, 10) : 3,
      3,
    );
    const assigneeId = req.query.userId as string | undefined;
    const departmentId = req.query.departmentId as string | undefined;
    const tasks = await prisma.task.findMany({
      where: {
        assignedById: adminId,
        deadline: { lt: new Date() },
        status: {
          in: [TaskStatus.ACTIVE, TaskStatus.DELAYED],
        },
        ...(assigneeId && { assignees: { some: { id: assigneeId } } }), // Updated to check assignees
        ...(departmentId &&
          !assigneeId && {
          assignees: {
            some: {
              departmentId,
            }
          },
        }),
      },
      take: limit,
      orderBy: {
        deadline: "asc",
      },
      include: {
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
    res.status(200).json({ tasks });
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
    const updatedTask = await updateTaskStatusInDB(taskId, status);
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
  const adminId = req.user?.id;
  const limit = Math.min(
    req.query.limit ? parseInt(req.query.limit as string, 10) : 3,
    3,
  );
  const assigneeId = req.query.userId as string | undefined;
  const departmentId = req.query.departmentId as string | undefined;

  if (!adminId) {
    return res.status(400).json({ error: "Missing adminId" });
  }
  const tasks = await prisma.task.findMany({
    where: {
      assignedById: adminId,
      ...(assigneeId && { assignees: { some: { id: assigneeId } } }), // Updated
      ...(departmentId &&
        !assigneeId && {
        assignees: {
          some: {
            departmentId,
          }
        },
      }),
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
        select: { id: true },
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
            user: {
              select: { name: true }
            }
          }
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

    res.json(task);
  } catch (error) {
    console.error("Failed to get task:", error);
    res.status(500).json({ message: "Error fetching task" });
  }
};

export const getDashboardAggregates = async (req: Request, res: Response) => {
  const adminId = req.user?.id;
  if (!adminId) {
    return res.status(400).json({ error: "Missing adminId" });
  }

  try {
    const assigneeId = req.query.userId as string | undefined;
    const departmentId = req.query.departmentId as string | undefined;

    const baseWhere: Prisma.TaskWhereInput = {
      assignedById: adminId,
      ...(assigneeId && { assignees: { some: { id: assigneeId } } }),
      ...(departmentId &&
        !assigneeId && { assignees: { some: { department: { id: departmentId } } } }),
    };
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
