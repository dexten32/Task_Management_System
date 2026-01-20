"use client";

import API_BASE_URL from "@/lib/api";
import ClientTaskDetail from "@/components/ClientTaskDetail";
import React, { useEffect, useState } from "react";

interface Task {
  priority: { code: string; name: string; color: string };
  id: string;
  title: string;
  description: string;
  deadline: string;
  assignedTo: { id: string; name: string };
  department: string;
  status: string;
  assignedBy: { id: string; name: string };
}

interface FetchedTask {
  id: string;
  title: string;
  description: string;
  deadline: string;
  assignedTo?: { id: string; name: string; department?: { name?: string } };
  status: string;
  assignedBy?: { id: string; name: string };
  priority: { code: string; name: string; color: string };
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

export default function AdminTasksPage() {
  const loggedInAdmin = useLoggedInAdmin();
  const loggedInAdminId = loggedInAdmin?.id;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All");
  const [selectedUser, setSelectedUser] = useState<string>("All");
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDepartments() {
      setLoadingDepartments(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");
        const res = await fetch(`${API_BASE_URL}/api/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch departments");
        const data = await res.json();
        setDepartments(data.departments);
      } catch (error: unknown) {
        console.error("Error fetching departments:", error);
        if (error instanceof Error) {
          setError(error.message || "Failed to load departments.");
        } else {
          setError(String(error) || "Failed to load departments.");
        }
      } finally {
        setLoadingDepartments(false);
      }
    }
    fetchDepartments();
  }, []);

  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        const url =
          selectedDepartment === "All"
            ? `${API_BASE_URL}/api/users`
            : `${API_BASE_URL}/api/users?department=${encodeURIComponent(
                selectedDepartment,
              )}`;

        const res = await fetch(url, {
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
  }, [selectedDepartment]);

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
        console.log("data: ", data);

        const mappedTasks: Task[] = data.tasks.map((task: FetchedTask) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          assignedTo: task.assignedTo || { id: "", name: "N/A" },
          department: task.assignedTo?.department?.name || "N/A",
          status: task.status,
          assignedBy: task.assignedBy || { id: "", name: "N/A" },
          priority: task.priority,
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

  const filteredTasks = (tasks || []).filter((task) => {
    const departmentMatch =
      selectedDepartment === "All" || task.department === selectedDepartment;
    const userMatch =
      selectedUser === "All" || task.assignedTo.name === selectedUser;
    return departmentMatch && userMatch;
    console.log("Filtered Task: ", filteredTasks);
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
      <div className="mb-10 flex flex-wrap gap-6">
        <div className="flex flex-col">
          <label
            htmlFor="department"
            className="block text-sm text-gray-600 mb-2"
          >
            Filter by Department
          </label>
          {loadingDepartments ? (
            <p className="text-gray-500">Loading departments...</p>
          ) : (
            <select
              id="department"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-white text-gray-800 p-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
            >
              <option value="All">All</option>
              {departments.map((dep) => (
                <option key={dep.id} value={dep.name}>
                  {dep.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-col">
          <label htmlFor="user" className="block text-sm text-gray-600 mb-2">
            Filter by User
          </label>
          {loadingUsers ? (
            <p className="text-gray-500">Loading users...</p>
          ) : (
            <select
              id="user"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="bg-white text-gray-800 p-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
            >
              <option value="All">All</option>
              {users.map((user) => (
                <option key={user.id} value={user.name}>
                  {user.name}
                </option>
              ))}
            </select>
          )}
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
                  new Date(b.deadline).getTime() -
                  new Date(a.deadline).getTime(),
              )
              .reduce((groups: Record<string, typeof filteredTasks>, task) => {
                const date = new Date(task.deadline).toLocaleDateString(
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
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{
                              backgroundColor: task.priority?.color,
                            }}
                          />
                          <span className="text-xs font-medium text-gray-700">
                            {task.priority?.name}
                          </span>
                        </div>
                      )}
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
                          {new Date(task.deadline).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-700">
                            Assigned To:
                          </span>{" "}
                          {task.assignedTo?.name || "N/A"}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-700">
                            Department:
                          </span>{" "}
                          {task.department || "N/A"}
                        </p>
                        <p>
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
            No tasks found for the selected filters.
          </p>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-transparent"
          onClick={() => setSelectedTaskId(null)}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-200 w-[95%] max-w-2xl h-[90vh] overflow-y-auto relative"
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
