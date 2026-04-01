import prisma from "../config/prisma";
import { TaskStatus, Prisma } from "@prisma/client";

export const TASK_SELECT_FIELDS = {
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
    },
  },
  assignedBy: {
    select: { name: true, id: true },
  },
};

export const TASK_INCLUDE_FULL = {
  priority: {
    select: { code: true, name: true, color: true },
  },
  logs: {
    orderBy: { createdAt: "asc" as Prisma.SortOrder },
    include: {
      user: { select: { name: true, role: true } },
    },
  },
  assignedBy: true,
  assignees: {
    include: { department: true },
  },
};

export const getTasksFromDB = async (where: Prisma.TaskWhereInput, skip: number, take: number, orderBy: any = { createdAt: "desc" }) => {
  return await prisma.task.findMany({
    where,
    skip,
    take,
    select: TASK_SELECT_FIELDS,
    orderBy,
  });
};

export const getTaskCount = async (where: Prisma.TaskWhereInput) => {
  return await prisma.task.count({ where });
};

export const getTaskByIdFromDB = async (id: string) => {
  return await prisma.task.findUnique({
    where: { id },
    include: TASK_INCLUDE_FULL,
  });
};

export const createTaskInDB = async (data: {
  title: string;
  description: string;
  deadline: Date;
  assignedById: string;
  priorityId: number;
  assigneeIds: string[];
}) => {
  const lastTask = await prisma.task.findFirst({
    orderBy: { readableId: "desc" },
    select: { readableId: true },
  });
  const nextReadableId = (lastTask?.readableId || 0) + 1;

  return await prisma.task.create({
    data: {
      readableId: nextReadableId,
      title: data.title,
      description: data.description,
      deadline: data.deadline,
      assignedById: data.assignedById,
      priorityId: data.priorityId,
      status: TaskStatus.ACTIVE,
      assignees: {
        connect: data.assigneeIds.map((id) => ({ id })),
      },
    },
    include: TASK_SELECT_FIELDS,
  });
};

export const updateTaskStatusInDB = async (taskId: string, status: TaskStatus, deadline?: Date) => {
  return await prisma.task.update({
    where: { id: taskId },
    data: {
      status,
      ...(deadline && { deadline }),
    },
    include: TASK_INCLUDE_FULL,
  });
};

export const updateTaskAssigneesInDB = async (taskId: string, assigneeIds: string[]) => {
  return await prisma.task.update({
    where: { id: taskId },
    data: {
      assignees: {
        set: assigneeIds.map((id) => ({ id })),
      },
    },
    include: TASK_SELECT_FIELDS,
  });
};

export const getPreviousTasksByUser = async (userId: string) => {
  return await prisma.task.findMany({
    where: {
      assignees: { some: { id: userId } },
      OR: [{ status: TaskStatus.COMPLETED }, { status: TaskStatus.DELAYED }],
    },
    orderBy: { deadline: "desc" },
    include: {
      assignedBy: { select: { id: true, name: true } },
      priority: { select: { id: true, code: true, name: true, color: true } },
    },
  });
};

export const getAggregates = async (where: Prisma.TaskWhereInput) => {
  const now = new Date();
  const [total, active, delayed, completed] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.count({ where: { ...where, status: TaskStatus.ACTIVE } }),
    prisma.task.count({
      where: {
        ...where,
        deadline: { lt: now },
        status: { in: [TaskStatus.ACTIVE, TaskStatus.DELAYED] },
      },
    }),
    prisma.task.count({ where: { ...where, status: TaskStatus.COMPLETED } }),
  ]);
  return { total, active, delayed, completed };
};

export const getNextReadableId = async () => {
  const lastTask = await prisma.task.findFirst({
    orderBy: { readableId: "desc" },
    select: { readableId: true },
  });
  return (lastTask?.readableId || 0) + 1;
};
