import prisma from "../config/prisma";
import { TaskStatus } from "@prisma/client";

export interface CreateTaskData {
  title: string;
  description: string;
  deadline: Date;
  status: TaskStatus;
  assignees: string[]; // Updated name
  assignedBy: string;
  priorityId: number;
}

// No longer used,  The logic is moved to the controller.
export const getRecentTasksByAdmin = async (
  adminId: string,
  limit: number,
  departmentId: string,
) => {
  return await prisma.task.findMany({
    where: {
      assignedById: adminId,
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

export const createTask = async (data: CreateTaskData) => {
  // Safe-guard: if assignees is passed as string, wrap in array (though TS should prevent)
  const assigneeIds = Array.isArray(data.assignees) ? data.assignees : [data.assignees];

  // We will pick the first one as the "primary" assignee for the legacy column.
  const primaryAssigneeId = assigneeIds.length > 0 ? assigneeIds[0] : "";

  // Calculate next readableId
  const lastTask = await prisma.task.findFirst({
    orderBy: { readableId: "desc" },
    select: { readableId: true },
  });
  const nextReadableId = (lastTask?.readableId || 0) + 1;

  return prisma.task.create({
    data: {
      readableId: nextReadableId,
      title: data.title,
      description: data.description,
      deadline: data.deadline,
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
  newDeadline?: Date,
) => {
  return prisma.task.update({
    where: { id: taskId },
    data: {
      status: newStatus,
      ...(newDeadline && { deadline: newDeadline }),
    },
    include: {
      priority: {
        select: { code: true, name: true, color: true },
      },
      logs: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: { select: { name: true, role: true } },
        },
      },
      assignedBy: {
        select: { id: true, name: true },
      },
      assignees: {
        include: {
          department: true,
        },
      },
    },
  });
};

export const getPreviousTasksByUser = async (userId: string) => {
  return prisma.task.findMany({
    where: {
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
