/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import API_BASE_URL from "@/lib/api";
import ClientTaskDetail from "@/components/ClientTaskDetail";
import React, { useEffect, useState } from "react";
import { TaskStatus, TASK_STATUS_CONFIG } from "@/lib/taskStatus";
import {
  SelectField,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Task {
  priority: { code: string; name: string; color: string };
  id: string;
  title: string;
  description: string;
  deadline: string;
  readableId?: number;
  assignedTo: { id: string; name: string };
  assignees?: { id: string; name: string; department?: { name?: string } }[];
  department: string;
  status: string;
  assignedBy: { id: string; name: string };
  createdAt: string;
}

interface FetchedTask {
  id: string;
  readableId?: number;
  title: string;
  description: string;
  deadline: string;
  assignedTo?: { id: string; name: string; department?: { name?: string } };
  assignees?: { id: string; name: string; department?: { name?: string } }[];
  status: string;
  assignedBy?: { id: string; name: string };
  priority: { code: string; name: string; color: string };
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  departmentId: string | null;
  departmentName?: string;
}

interface Department {
  id: string;
  name: string;
}

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp?: number;
}

type Priority = {
  id: string;
  code: string;
  name: string;
  color: string;
};

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
    return JSON.parse(jsonPayload) as DecodedToken;
  } catch (error) {
    console.error("Failed to decode JWT token:", error);
    return null;
  }
};

function useLoggedInAdmin() {
  const [adminInfo, setAdminInfo] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeJwtToken(token);
      if (decoded && decoded.id) {
        setAdminInfo({
          id: decoded.id,
          name: decoded.email || "Logged-in Admin",
        });
      } else {
        console.warn("Token found but could not decode or extract ID.");
        setAdminInfo(null);
      }
    } else {
      console.warn("No authentication token found in localStorage.");
      setAdminInfo(null);
    }
  }, []);

  return adminInfo;
}

export default function ManagerTasksPage() {
  const loggedInAdmin = useLoggedInAdmin();
  const loggedInAdminId = loggedInAdmin?.id;

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("All");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [priorities, setPriorities] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        const res = await fetch(`${API_BASE_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        const mappedUsers: User[] = data.users.map(
          (user: User & { department?: { name?: string } }) => ({
            id: user.id,
            name: user.name,
            departmentId: user.departmentId || null,
            departmentName: user.department?.name || null,
          }),
        );
        setUsers(mappedUsers);
        setSelectedUser("All");
      } catch (error: unknown) {
        console.error("Error fetching users:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load users.",
        );
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchUsers();
  }, []);

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

        // backend returns { priorities: [...] }
        setPriorities(data.priorities || []);
      } catch (err) {
        console.error("Error fetching priorities:", err);
      }
    };

    fetchPriorities();
  }, []);

  useEffect(() => {
    async function fetchTasks() {
      setLoadingTasks(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        const res = await fetch(`${API_BASE_URL}/api/tasks/recent`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const data = await res.json();

        const mappedTasks: Task[] = data.tasks.map((task: FetchedTask) => ({
          id: task.id,
          readableId: task.readableId,
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          assignedTo: task.assignedTo || { id: "", name: "N/A" },
          assignees: task.assignees || [],
          department: task.assignees && task.assignees.length > 0
            ? task.assignees[0].department?.name || "N/A"
            : "N/A",
          status: task.status,
          assignedBy: task.assignedBy || { id: "", name: "N/A" },
          priority: task.priority,
          createdAt: task.createdAt,
        }));
        setTasks(mappedTasks);
      } catch (error: unknown) {
        console.error("Error fetching tasks:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load tasks.",
        );
      } finally {
        setLoadingTasks(false);
      }
    }

    if (loggedInAdminId) fetchTasks();
  }, [loggedInAdminId]);

  // Prevent scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = selectedTaskId ? "hidden" : "";
  }, [selectedTaskId]);

  const filteredTasks = tasks.filter((task) => {
    const userMatch =
      selectedUser === "All" ||
      task.assignedTo?.name === selectedUser ||
      (task.assignees && task.assignees.some(u => u.name === selectedUser));

    const priorityMatch =
      selectedPriority === "All" || task.priority?.name === selectedPriority;

    const statusMatch =
      selectedStatus === "All" || task.status === selectedStatus;

    return userMatch && priorityMatch && statusMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-800 p-8 font-sans rounded-xl relative">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">
        Tasks Assigned by You
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-lg mb-6 shadow-sm">
          <p>{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="flex flex-col">
          <label
            htmlFor="user"
            className="block text-sm font-medium text-gray-600 mb-1"
          >
            Filter by User
          </label>
          {loadingUsers ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <SelectField value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-full bg-white border-gray-300">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.name}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectField>
          )}
        </div>
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Filter by Status
          </label>
          <SelectField value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full bg-white border-gray-300">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="DELAYED">Delayed</SelectItem>
            </SelectContent>
          </SelectField>
        </div>

        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Filter by Priority
          </label>

          <SelectField
            value={selectedPriority}
            onValueChange={setSelectedPriority}
          >
            <SelectTrigger className="w-full bg-white border-gray-300">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              {priorities.map((priority) => (
                <SelectItem key={priority.id} value={priority.name}>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          priority.name === "High"
                            ? "#ef4444" // red
                            : priority.name === "Medium"
                              ? "#f59e0b" // amber
                              : priority.name === "Low"
                                ? "#10b981" // emerald
                                : "#6b7280",
                      }}
                    />
                    {priority.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </SelectField>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="space-y-10">
        {loadingTasks ? (
          <p className="text-gray-600 text-lg">Loading tasks...</p>
        ) : filteredTasks.length > 0 ? (
          Object.entries(
            [...filteredTasks]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )
              .reduce((groups: Record<string, typeof filteredTasks>, task) => {
                const date = new Date(task.createdAt).toLocaleDateString(
                  undefined,
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                );
                if (!groups[date]) groups[date] = [];
                groups[date].push(task);
                return groups;
              }, {}),
          ).map(([date, tasks]) => (
            <div key={date}>
              <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b border-gray-300 pb-1">
                {date}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="block group cursor-pointer"
                  >
                    <div className="relative bg-white/90 pt-2 p-6 rounded-2xl border border-gray-200 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:border-indigo-300 transition-all duration-300">
                      {/* Priority Indicator */}
                      {task.priority && (
                        <div className="absolute top-4 right-4 z-50 bg-white/80 backdrop-blur-sm  flex items-center gap-1.5 shrink-0 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor: task.priority?.color,
                            }}
                          />
                          <span className="text-[10px] uppercase font-bold text-gray-600">
                            {task.priority?.name}
                          </span>
                        </div>
                      )}

                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded mb-1 inline-block">
                        CYN-0{task.readableId}
                      </span>

                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {task.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                      <div className="space-y-1 text-sm text-gray-500">
                        <p>
                          <span className="font-semibold text-gray-700">
                            Deadline:
                          </span>{" "}
                          {new Date(task.deadline).toLocaleString([], {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-700">
                            Assigned To:
                          </span>{" "}
                          {task.assignees && task.assignees.length > 0
                            ? task.assignees.map((a) => a.name).join(", ")
                            : task.assignedTo?.name || "N/A"}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-700">
                            Department:
                          </span>{" "}
                          {task.department || "N/A"}
                        </p>
                        <p
                          className={`font-semibold ${TASK_STATUS_CONFIG[task.status as TaskStatus]?.colorClass || ""}`}
                        >
                          <span className="font-semibold text-gray-700">
                            Status:
                          </span>{" "}
                          {task.status}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-700">
                            Assigned By:
                          </span>{" "}
                          {task.assignedBy?.name || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600 text-lg text-center py-10">
            No tasks found.
          </p>
        )}
      </div>

      {/* Task Detail Modal */}
      {
        selectedTaskId && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 bg-transparent"
            onClick={() => setSelectedTaskId(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[95%] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedTaskId(null)}
                className="absolute top-4 right-4 z-50 bg-white/80 backdrop-blur-sm  text-gray-500 hover:text-red-600 text-lg font-semibold"
              >
                ✕
              </button>
              <ClientTaskDetail taskId={selectedTaskId} />
            </div>
          </div>
        )
      }
    </div >
  );
}
