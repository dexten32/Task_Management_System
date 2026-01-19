import prisma from "../config/prisma";

export interface TaskInput {
  title: string;
  description: string;
  deadline: Date; // Changed to Date type
  assignedTo: string;
  assignedBy: string;
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
      assignedToId: data.assignedTo, // Use assignedToId
      assignedById: data.assignedBy, // Use assignedById
      status: "active",
    },
  });
};

export const updateTaskStatusInDB = async (
  taskId: string,
  newStatus: "complete" | "delayed" | "active"
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
      OR: [{ status: "complete" }, { status: "delayed" }],
    },
    orderBy: {
      deadline: "desc",
    },
  });
};
