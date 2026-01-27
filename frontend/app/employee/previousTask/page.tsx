"use client";

import React, { useEffect, useState } from "react";
import API_BASE_URL from "@/lib/api";
import ClientTaskDetail from "@/components/ClientTaskDetail";
import { TaskStatus, TASK_STATUS_CONFIG } from "@/lib/taskStatus";

interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: TaskStatus;
  assignedBy: { id: string; name: string };
  priority: { id: string; name: string; color: string; code: string };
  createdAt: string;
}

export default function PreviousTasksSection() {
  const [groupedTasks, setGroupedTasks] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreviousTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const res = await fetch(`${API_BASE_URL}/api/tasks/previous`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch previous tasks");

        const data = await res.json();
        const tasksArray = Array.isArray(data)
          ? data
          : Array.isArray(data?.tasks)
            ? data.tasks
            : [];
        console.log("Previous Tasks Data: ", tasksArray);

        const grouped: Record<string, Task[]> = {};
        tasksArray.forEach((task: Task) => {
          const dateKey = task.createdAt
            ? new Date(task.createdAt).toISOString().split("T")[0]
            : "Unknown Date";
          if (!grouped[dateKey]) grouped[dateKey] = [];
          grouped[dateKey].push(task);
        });

        Object.values(grouped).forEach((group) =>
          group.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );

        setGroupedTasks(grouped);
      } catch (err) {
        console.error("Error fetching previous tasks:", err);
        setError("Unable to load previous tasks. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPreviousTasks();
  }, []);

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TASK_STATUS_CONFIG.COMPLETED.label:
        return TASK_STATUS_CONFIG.COMPLETED.colorClass;
      case TASK_STATUS_CONFIG.DELAYED.label:
        return TASK_STATUS_CONFIG.DELAYED.colorClass;
      default:
        return TASK_STATUS_CONFIG.ACTIVE.colorClass;
    }
  };

  const sortedDates = Object.keys(groupedTasks).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  return (
    <div className="p-8 bg-blue-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Completed & Delayed Tasks
      </h2>

      {/* Loading State */}
      {loading && (
        <p className="text-center text-lg text-gray-500">
          Loading previous tasks...
        </p>
      )}

      {/* Error State */}
      {error && <p className="text-center text-red-600 text-lg">{error}</p>}

      {/* Main Content */}
      {!loading && !error && sortedDates.length === 0 && (
        <p className="text-gray-500 text-center">
          No completed or delayed tasks found.
        </p>
      )}

      {!loading && !error && sortedDates.length > 0 && (
        <div className="space-y-10">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                {dateKey === "Unknown Date"
                  ? "Unknown Deadline"
                  : new Date(dateKey).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedTasks[dateKey].map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`relative cursor-pointer border border-gray-200 rounded-2xl shadow-sm pt-3 p-4 bg-white hover:shadow-md hover:border-indigo-200 transition ${
                      task.status === TASK_STATUS_CONFIG.DELAYED.label
                        ? TASK_STATUS_CONFIG.DELAYED.colorClass
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-blue-700 leading-tight">
                        {task.title?.toUpperCase() ?? "UNTITLED TASK"}
                      </h3>

                      {task.priority && (
                        <div className="flex items-center gap-1.5 shrink-0 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: task.priority.color }}
                          />
                          <span className="text-[10px] font-medium text-gray-600 uppercase">
                            {task.priority.name}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {task.description || "No description provided."}
                    </p>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>
                        <span className="font-medium text-gray-700">
                          Deadline:
                        </span>{" "}
                        {task.deadline
                          ? new Date(task.deadline).toLocaleString()
                          : "N/A"}
                      </p>

                      <p>
                        <span className="font-medium text-gray-700">
                          Assigned By:
                        </span>{" "}
                        {task.assignedBy?.name ?? "Unknown"}
                      </p>
                    </div>
                    <div className=" flex justify-end">
                      <span
                        className={` text-xs font-semibold rounded-full ${getStatusColor(
                          task.status,
                        )}`}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
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
