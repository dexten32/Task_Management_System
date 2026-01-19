import prisma from "../config/prisma";
import { TaskStatus } from "@prisma/client";

export interface TaskInput {
  title: string;
  description: string;
  deadline: Date; // Changed to Date type
  assignedTo: string;
  assignedBy: string;
  priorityId: number;
}

// No longer used,  The logic is moved to the controller.
export const getRecentTasksByAdmin = async (adminId: string, limit: number) => {
  return prisma.task.findMany({
    where: {
      assignedById: adminId,
    },
    take: 3,
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
      assignedTo: {
        select: {
          name: true,
        },
      },
      assignedBy: {
        select: { name: true },
      },
    },
  });
};

export const createTask = async (data: TaskInput) => {
  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      deadline: data.deadline,
      assignedToId: data.assignedTo,
      assignedById: data.assignedBy,
      priorityId: data.priorityId,
      status: TaskStatus.ACTIVE,
    },
  });
};

export const updateTaskStatusInDB = async (
  taskId: string,
  newStatus: TaskStatus.COMPLETED | TaskStatus.DELAYED | TaskStatus.ACTIVE,
) => {
  return prisma.task.update({
    where: { id: taskId },
    data: {
      status: newStatus,
    },
  });
};

export const getPreviousTasksByUser = async (userId: string) => {
  return prisma.task.findMany({
    where: {
      assignedToId: userId,
      OR: [{ status: TaskStatus.COMPLETED }, { status: TaskStatus.DELAYED }],
    },
    orderBy: {
      deadline: "desc",
    },
  });
};
