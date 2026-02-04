"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import API_BASE_URL from "@/lib/api";
import { Loader2, CheckCircle, Clock } from "lucide-react";
import { TaskStatus, TASK_STATUS_CONFIG } from "@/lib/taskStatus";
import ClientTaskDetail from "@/components/ClientTaskDetail";
import { format } from "date-fns";

interface Task {
  id: string;
  readableId?: number;
  title: string;
  description: string;
  deadline: string;
  status: TaskStatus;
  priority: { code: string; name: string; color: string };
  assignedBy?: { id: string; name: string };
  assignedTo?: { id: string; name: string };
  createdAt: string;
}

export default function EmployeeDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/tasks/my-tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const data = await response.json();
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleComplete = async (taskId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const task = tasks.find((t) => t.id === taskId);
      if (!task) throw new Error("Task not found.");

      const now = new Date();
      const deadline = new Date(task.deadline);
      const newStatus = now < deadline ? "COMPLETED" : "DELAYED";

      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update task status.");
      }

      await fetchTasks();
    } catch (err: unknown) {
      console.error("Error updating task status:", err);
      // Ideally show a toast here
    }
  };

  // Calculate KPIs
  const totalTasks = tasks.length;
  // Active tasks for display
  const activeTasks = tasks
    .filter(
      (t) =>
        t.status === TASK_STATUS_CONFIG.PENDING.label ||
        t.status === TASK_STATUS_CONFIG.ACTIVE.label,
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const delayedTasks = tasks
    .filter((t) => t.status === TASK_STATUS_CONFIG.DELAYED.label)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const completedTasks = tasks.filter(
    (t) => t.status === TASK_STATUS_CONFIG.COMPLETED.label,
  );

  const completionRate =
    totalTasks > 0
      ? Math.round(
        ((completedTasks.length + delayedTasks.length) / totalTasks) * 100,
      )
      : 0;

  if (loading && tasks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
      {/* Left Column: KPI Cards */}
      <div className="lg:col-span-1 space-y-4">
        <KPICard
          title="Total Tasks"
          value={totalTasks}
          color="bg-indigo-50 text-indigo-700 border-indigo-200"
        />
        <KPICard
          title="Active Tasks"
          value={activeTasks.length}
          color="bg-blue-50 text-blue-700 border-blue-200"
        />
        <KPICard
          title="Delayed Tasks"
          value={delayedTasks.length}
          color="bg-red-50 text-red-700 border-red-200"
        />

        {/* Completion Rate with Donut Chart */}
        <Card className="border border-gray-200 shadow-sm relative overflow-hidden bg-white">
          <div className="p-4 flex flex-col items-center">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Completion Rate
            </h3>
            <div className="relative w-32 h-32">
              <DonutChart percentage={completionRate} />
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold text-gray-900">
                  {completionRate}%
                </span>
              </div>
            </div>
            <p className="text-xs text-center text-gray-500 mt-2">
              {completedTasks.length + delayedTasks.length} of {totalTasks}{" "}
              tasks completed
            </p>
          </div>
        </Card>
      </div>

      {/* Right Column: Task Lists */}
      <div className="lg:col-span-3 space-y-6">
        <Card className="h-full border border-gray-200 shadow-sm overflow-hidden bg-white">
          <div className="bg-white border-b border-gray-100 pb-4 p-6">
            <h2 className="text-xl font-bold text-gray-800">My Tasks</h2>
          </div>
          <div className="p-0">
            <div className="flex flex-col h-full">
              {/* Active Tasks Section - Limited to 3 */}
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Recent Active Tasks
                </h2>
                {activeTasks.length > 0 ? (
                  <div className="space-y-4">
                    {activeTasks.slice(0, 3).map((task) => (
                      <DetailedTaskCard
                        key={task.id}
                        task={task}
                        onClick={() => setSelectedTaskId(task.id)}
                        onComplete={() => handleComplete(task.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No active tasks currently.
                  </p>
                )}
              </div>

              <div className="border-t border-gray-100 mx-6"></div>

              {/* Delayed Tasks Section - Limited to 3 */}
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Delayed Tasks
                </h2>
                {delayedTasks.length > 0 ? (
                  <div className="space-y-4">
                    {delayedTasks.slice(0, 3).map((task) => (
                      <DetailedTaskCard
                        key={task.id}
                        task={task}
                        isDelayed
                        onClick={() => setSelectedTaskId(task.id)}
                        onComplete={() => handleComplete(task.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic indent-4">
                    No delayed tasks.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedTaskId(null)}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-200 w-[95%] max-w-2xl h-[90vh] overflow-y-auto relative animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTaskId(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600 text-lg font-semibold"
            >
              ✕
            </button>
            <ClientTaskDetail taskId={selectedTaskId} />
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({
  title,
  value,
  color,
}: {
  title: string;
  value: number | string;
  color: string;
}) {
  return (
    <Card
      className={`border shadow-sm transform transition-all hover:scale-[1.02] ${color}`}
    >
      <div className="p-4">
        <p className="text-sm font-medium opacity-80">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
    </Card>
  );
}

function DetailedTaskCard({
  task,
  isDelayed = false,
  onClick,
  onComplete,
}: {
  task: Task;
  isDelayed?: boolean;
  onClick: () => void;
  onComplete: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative bg-white shadow-sm rounded-lg border ${isDelayed
        ? "border-red-200 bg-red-50/30"
        : "border-indigo-100 hover:border-indigo-300"
        } hover:shadow-md transition-all duration-200 cursor-pointer p-4`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded mb-1 inline-block">
              {task.readableId ? `CYN-0${task.readableId}` : "N/A"}
            </span>
            <h4
              className={`text-base font-semibold ${isDelayed ? "text-red-700" : "text-indigo-700"} line-clamp-1`}
            >
              {task.title}
            </h4>
          </div>
          {task.priority && (
            <div className="flex items-center gap-1.5 shrink-0 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: task.priority.color }}
              />
              <span className="text-[10px] uppercase font-bold text-gray-600">
                {task.priority.name}
              </span>
            </div>
          )}
        </div>

        <p className="text-gray-600 text-sm line-clamp-2">{task.description}</p>

        <div className="flex items-center justify-between mt-1">
          <div className="flex flex-col gap-1">
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5 mr-1 text-indigo-500" />
              <span className={isDelayed ? "text-red-600 font-medium" : ""}>
                {format(new Date(task.deadline), "dd MMM, hh:mm a")}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              By:{" "}
              <span className="font-medium text-indigo-600">
                {task.assignedBy?.name || "N/A"}
              </span>
            </div>
          </div>

          {!isDelayed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-200"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DonutChart({ percentage }: { percentage: number }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center justify-center transform -rotate-90">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 120 120"
        className="w-full h-full"
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="transparent"
          stroke="#E5E7EB"
          strokeWidth="12"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="transparent"
          stroke="#4F46E5"
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
    </div>
  );
}
