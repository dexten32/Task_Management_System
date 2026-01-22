export type TaskStatus = "ACTIVE" | "PENDING" | "COMPLETED" | "DELAYED";

export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  {
    label: string;
    colorClass: string;
  }
> = {
  ACTIVE: {
    label: "ACTIVE",
    colorClass: "text-blue-600",
  },
  PENDING: {
    label: "PENDING",
    colorClass: "text-amber-600",
  },
  COMPLETED: {
    label: "COMPLETED",
    colorClass: "text-emerald-600",
  },
  DELAYED: {
    label: "DELAYED",
    colorClass: "text-rose-600",
  },
};
