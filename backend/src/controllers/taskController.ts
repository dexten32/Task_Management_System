import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";
import {
  getRecentTasksByAdmin,
  TaskInput,
  updateTaskStatusInDB,
} from "../services/taskService"; // Import the TaskInput interface
import { $Enums, Prisma } from "@prisma/client";
import dotenv from "dotenv";
import { getPreviousTasksByUser } from "../services/taskService";

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
  assignedToId: string;
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
    const { title, description, deadline, assignedTo } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!title || !description || !deadline || !assignedTo) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ message: "Invalid deadline format" });
    }

    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        deadline: deadlineDate,
        assignedToId: assignedTo,
        assignedById: req.user.id,
        status: "active",
        createdAt: new Date(),
      },
      include: {
        assignedTo: {
          select: {
            name: true,
            id: true,
            department: { select: { name: true, id: true } }, // <-- ADD THIS LINE!
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
        assignedTo: {
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
        assignedTo: {
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
      where: { assignedToId: userId },
      include: {
        assignedTo: {
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
    const now = new Date();
    const tasks = await prisma.task.findMany({
      where: {
        status: "delayed",
        deadline: {
          lt: now,
        },
      },
      include: {
        assignedTo: {
          select: { name: true, id: true },
        },
        assignedBy: {
          select: { name: true, id: true },
        },
      },
      orderBy: {
        deadline: "asc",
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

  if (!["active", "complete", "delayed"].includes(status)) {
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
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 3;
  if (!adminId) {
    return res.status(400).json({ error: "Missing adminId" });
  }
  const tasks = await getRecentTasksByAdmin(adminId, limit);
  res.json(tasks);
};

export const getTaskById = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const taskId = req.params.id;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        logs: {
          orderBy: {
            createdAt: "asc",
          },
        },
        assignedBy: true,
        assignedTo: {
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
