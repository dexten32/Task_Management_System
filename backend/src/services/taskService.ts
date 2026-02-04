import prisma from "../config/prisma";
import { TaskStatus } from "@prisma/client";

export interface TaskInput {
  title: string;
  description: string;
  deadline: Date;
  status: TaskStatus;
  assignedTo: string[]; // Changed to array
  assignedBy: string;
  priorityId: number;
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
      ...(assignedToId && { assignees: { some: { id: assignedToId } } }), // Updated to check assignees
      ...(departmentId &&
        !departmentId && {
        assignees: {
          some: {
            departmentId,
          },
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
      assignees: { // Include assignees instead of assignedTo
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
  // Safe-guard: if assignedTo is passed as string, wrap in array (though TS should prevent)
  const assigneeIds = Array.isArray(data.assignedTo) ? data.assignedTo : [data.assignedTo];

  // For legacy support, we can pick the first one as assignedToId or leave it null/empty if the schema allows.
  // Current schema: assignedToId is String. So we must provide one.
  // We will pick the first one as the "primary" assignee for the legacy column.
  const primaryAssigneeId = assigneeIds.length > 0 ? assigneeIds[0] : "";

  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      deadline: data.deadline,
      assignedToId: primaryAssigneeId, // Populate legacy field
      assignedById: data.assignedBy,
      priorityId: data.priorityId,
      status: TaskStatus.ACTIVE,
      assignees: {
        connect: assigneeIds.map((id) => ({ id })),
      },
    },
  });
};

export const updateTaskStatusInDB = async (
  taskId: string,
  newStatus: TaskStatus,
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
      // assignedToId: userId, // Legacy
      assignees: {
        some: {
          id: userId
        }
      },
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
