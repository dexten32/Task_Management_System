import prisma from "../config/prisma";
import { TaskStatus } from "@prisma/client";

export interface TaskInput {
  title: string;
  description: string;
  deadline: Date;
  assignedTo: string;
  assignedBy: string;
  priorityId: number;
  departmentId: string;
}

// No longer used,  The logic is moved to the controller.
export const getRecentTasksByAdmin = async (
  adminId: string,
  limit: number,
  departmentId: string,
  assignedToId?: string,
) => {
  return await prisma.task.findMany({
    where: {
      assignedById: adminId,
      ...(assignedToId && { assignedToId }),
      ...(departmentId &&
        !departmentId && {
          assignedTo: {
            departmentId,
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
      assignedTo: {
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
    include: {
      assignedBy: {
        select: {
          id: true,
          name: true,
        },
      },
      priority: {
        select: {
          id: true,
          code: true,
          name: true,
          color: true,
        },
      },
    },
  });
};
