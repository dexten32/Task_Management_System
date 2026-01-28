/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import API_BASE_URL from "@/lib/api";
import { format } from "date-fns";
import { CheckCircle, Clock } from "lucide-react";
import ClientTaskDetail from "@/components/ClientTaskDetail";
import { TASK_STATUS_CONFIG } from "@/lib/taskStatus";

interface DecodedToken {
  id: string;
  email: string;
  name?: string;
  role: string;
  iat: number;
  exp?: number;
}

const decodeJwtToken = (token: string): DecodedToken | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: string;
  assignedTo: {
    id: string;
    name: string;
  };
  assignedBy: { id: string; name: string };
  priority: { code: string; name: string; color: string };
  createdAt: string;
}

export default function CurrentTasksSection() {
  const [currentTasks, setCurrentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string>("All");
  const [priorities, setPriorities] = useState<{ id: number; name: string }[]>(
    [],
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeJwtToken(token);
      if (decoded?.id) setLoggedInUserId(decoded.id);
      else setError("Failed to decode user ID from token.");
    } else {
      setError("No authentication token found.");
    }
  }, []);

  const fetchMyTasks = useCallback(async () => {
    if (!loggedInUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found.");

      const res = await fetch(`${API_BASE_URL}/api/tasks/my-tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch tasks");
      }

      const data = await res.json();
      const activeTasks = data.filter((t: Task) => t.status === "ACTIVE");
      setCurrentTasks(activeTasks);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [loggedInUserId]);

  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  const handleComplete = async (taskId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const task = currentTasks.find((t) => t.id === taskId);
      if (!task) throw new Error("Task not found.");

      const now = new Date();
      const deadline = new Date(task.deadline);
      const newStatus =
        now < deadline
          ? TASK_STATUS_CONFIG.COMPLETED.label
          : TASK_STATUS_CONFIG.DELAYED.label;

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

      await fetchMyTasks();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "Failed to mark task as complete.");
    }
  };

  useEffect(() => {
    const fetchPriorities = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        const res = await fetch(`${API_BASE_URL}/api/priorities`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch priorities");

        const data = await res.json();
        setPriorities(data.priorities || []);
      } catch (err) {
        console.error("Error fetching priorities:", err);
      }
    };

    fetchPriorities();
  }, []);

  // 1. Filter tasks
  const filteredTasks = currentTasks.filter((task) => {
    const priorityMatch =
      selectedPriority === "All" || task.priority?.name === selectedPriority;

    return priorityMatch;
  });

  // 2. Group filtered tasks
  const groupedTasks = filteredTasks.reduce(
    (acc, task) => {
      const dateKey = format(new Date(task.createdAt), "yyyy-MM-dd");
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(task);
      return acc;
    },
    {} as Record<string, Task[]>,
  );

  const sortedDates = Object.keys(groupedTasks).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <h2 className="text-3xl font-bold mb-6 text-gray-700">
        My Current Tasks
      </h2>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-4">
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Priority
          </label>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-white text-gray-800 p-2.5 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all min-w-[150px]"
          >
            <option value="All">All</option>
            {priorities.map((priority) => (
              <option key={priority.id} value={priority.name}>
                {priority.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <p className="text-center text-lg text-indigo-500">Loading tasks...</p>
      )}
      {error && <p className="text-center text-red-600 text-lg">{error}</p>}

      {!loading && !error && (
        <>
          {sortedDates.length === 0 ? (
            <p className="text-gray-500 text-center mt-10">
              No tasks found with the selected filters.
            </p>
          ) : (
            sortedDates.map((date: string) => (
              <div key={date} className="mb-10">
                <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b border-gray-300 pb-1">
                  {format(new Date(date), "EEEE, dd MMM yyyy")}
                </h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {groupedTasks[date].map((task: Task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="relative bg-white shadow-md rounded-2xl border border-indigo-100 hover:shadow-lg hover:border-indigo-300 transition-all duration-200 cursor-pointer"
                    >
                      <div className="p-5 pt-2 flex flex-col h-full justify-between">
                        <div>
                          <div className="flex item-start justify-between mb-2 gap-2 line-clamp-1">
                            <h4 className="text-lg font-semibold text-indigo-700 mb-2">
                              {task.title}
                            </h4>
                            {task.priority && (
                              <div className="flex items-center gap-1.5 shrink-0 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{
                                    backgroundColor: task.priority.color,
                                  }}
                                />
                                <span className="text-[10px] font-medium uppercase text-gray-600">
                                  {task.priority.name}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                            {task.description}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <Clock className="w-4 h-4 mr-1 text-indigo-500" />
                            Deadline:{" "}
                            {format(
                              new Date(task.deadline),
                              "dd MMM yyyy, hh:mm a",
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            Assigned by:{" "}
                            <span className="font-medium text-indigo-600">
                              {task.assignedBy?.name || "N/A"}
                            </span>
                          </div>
                          <div className="text-sm">
                            Status:{" "}
                            <span
                              className={`font-semibold ${TASK_STATUS_CONFIG[task.status as keyof typeof TASK_STATUS_CONFIG]?.colorClass || "text-gray-600"}`}
                            >
                              {task.status}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                          {task.status !== "COMPLETED" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleComplete(task.id);
                              }}
                              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-200"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Mark Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}

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
