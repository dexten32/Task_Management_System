"use client";

import React, { useState, useEffect, useCallback } from "react";
import API_BASE_URL from "@/lib/api";
import { format } from "date-fns";
import { CheckCircle, Clock } from "lucide-react";
import ClientTaskDetail from "@/components/ClientTaskDetail";

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
        .join("")
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
}

export default function CurrentTasksSection() {
  const [currentTasks, setCurrentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

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
      const activeTasks = data.filter((t: Task) => t.status === "active");
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
      const newStatus = now < deadline ? "complete" : "delayed";

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

  // Group tasks by deadline date (descending order)
  const groupedTasks = currentTasks.reduce((acc, task) => {
    const dateKey = format(new Date(task.deadline), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const sortedDates = Object.keys(groupedTasks).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <h2 className="text-3xl font-bold mb-6 text-indigo-700">
        My Current Tasks
      </h2>

      {loading && (
        <p className="text-center text-lg text-indigo-500">Loading tasks...</p>
      )}
      {error && <p className="text-center text-red-600 text-lg">{error}</p>}

      {!loading && !error && (
        <>
          {sortedDates.length === 0 ? (
            <p className="text-gray-500 text-center">
              No active tasks assigned to you.
            </p>
          ) : (
            sortedDates.map((date: string) => (
              <div key={date} className="mb-10">
                <h3 className="text-xl font-semibold text-indigo-600 mb-4">
                  {format(new Date(date), "EEEE, dd MMM yyyy")}
                </h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {groupedTasks[date].map((task: Task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="bg-white shadow-md rounded-2xl border border-indigo-100 hover:shadow-lg hover:border-indigo-300 transition-all duration-200 cursor-pointer"
                    >
                      <div className="p-5 flex flex-col h-full justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-indigo-700 mb-2">
                            {task.title}
                          </h4>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                            {task.description}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <Clock className="w-4 h-4 mr-1 text-indigo-500" />
                            Deadline:{" "}
                            {format(
                              new Date(task.deadline),
                              "dd MMM yyyy, hh:mm a"
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            Assigned by:{" "}
                            <span className="font-medium text-indigo-600">
                              {task.assignedBy?.name || "N/A"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex justify-end">
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
