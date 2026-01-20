export type TaskStatus = "ACTIVE" | "PENDING" | "COMPLETE" | "DELAYED";

export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  {
    label: string;
    colorClass: string;
  }
> = {
  ACTIVE: {
    label: "Active",
    colorClass: "text-blue-600",
  },
  PENDING: {
    label: "Pending",
    colorClass: "text-amber-600",
  },
  COMPLETE: {
    label: "Completed",
    colorClass: "text-emerald-600",
  },
  DELAYED: {
    label: "Delayed",
    colorClass: "text-rose-600",
  },
};
