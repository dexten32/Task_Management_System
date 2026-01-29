/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import {
  SelectContent,
  SelectField,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import ClientTaskDetail from "@/components/ClientTaskDetail";
import API_BASE_URL from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  departmentId: string | null;
  departmentName?: string;
  approved?: boolean;
  role?: string;
}

interface Task {
  priority: { code: string; name: string; color: string };
  id: string;
  title: string;
  description: string;
  assignedTo?: { name: string; id: string };
  assignedBy?: { name: string; id: string };
  deadline: string;
  status?: string; // Added status for filtering
  department?: string; // Added for filtering convenience
  departmentId?: string;
  createdAt?: string;
}

interface PendingUser extends User {
  role: string;
}

interface Department {
  id: string;
  name: string;
}
type Priority = {
  id: number;
  code: string;
  name: string;
  color: string;
};

const DashboardPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Data State
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [backendDelayedTasks, setBackendDelayedTasks] = useState<Task[]>([]);

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);

  // Loading & Error States
  const [isModalDataLoading, setIsModalDataLoading] = useState(true);
  const [modalFetchError, setModalFetchError] = useState<string | null>(null);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [selectedPriorityId, setSelectedPriorityId] = useState<number | null>(
    null,
  );

  // Filters State
  const [filterDept, setFilterDept] = useState<string>("All");
  const [filterUser, setFilterUser] = useState<string>("All");

  useEffect(() => {
    const fetchUsersAndDepartments = async () => {
      setIsModalDataLoading(true);
      setModalFetchError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        const userResponse = await fetch(`${API_BASE_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!userResponse.ok) throw new Error("Failed to fetch users");
        const usersData = await userResponse.json();
        const usersArray = usersData.users || [];

        const mappedUsers: User[] = usersArray.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          departmentId: user.departmentId,
          role: user.role,
          approved: user.approved,
        }));
        setAllUsers(mappedUsers);

        const deptResponse = await fetch(`${API_BASE_URL}/api/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!deptResponse.ok) throw new Error("Failed to fetch departments");
        const departmentsData = await deptResponse.json();
        setDepartments(departmentsData.departments || []);

        const priorityResponse = await fetch(`${API_BASE_URL}/api/priorities`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!priorityResponse.ok) throw new Error("Failed to fetch priorities");
        const priorityData = await priorityResponse.json();
        setPriorities(priorityData.priorities || []);
      } catch (error: unknown) {
        console.error("Failed to fetch users/departments/priorities", error);
        setModalFetchError("Failed to load data.");
      } finally {
        setIsModalDataLoading(false);
      }
    };
    fetchUsersAndDepartments();
  }, []);

  const fetchTasks = async (filterUser: string, filterDept: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const query = new URLSearchParams();
      query.set("limit", "3");
      if (filterUser !== "All") {
        query.set("userId", filterUser);
      } else if (filterDept !== "All") {
        query.set("departmentId", filterDept);
      }
      const res = await fetch(
        `${API_BASE_URL}/api/tasks/recentlimit?${query.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Failed to fetch recent tasks");
      const data = await res.json();
      setRecentTasks(Array.isArray(data) ? data : (data.tasks ?? []));
    } catch (err: unknown) {
      console.error("Failed to fetch recent tasks", err);
    }
  };

  const fetchBackendDelayedTasks = async (
    filterUser: string,
    filterDept: string,
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const query = new URLSearchParams();
      query.set("limit", "3");
      if (filterUser !== "All") {
        query.set("userId", filterUser);
      } else if (filterDept !== "All") {
        query.set("DepartmentId", filterDept);
      }
      const res = await fetch(
        `${API_BASE_URL}/api/tasks/delayed?${query.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Failed to fetch delayed tasks");
      const backendData = await res.json();
      setBackendDelayedTasks(
        Array.isArray(backendData) ? backendData : (backendData.tasks ?? []),
      );
    } catch (err: unknown) {
      console.error("Failed to fetch delayed tasks", err);
    }
  };

  useEffect(() => {
    fetchTasks(filterUser, filterDept);
    fetchBackendDelayedTasks(filterUser, filterDept);
  }, [filterUser, filterDept]);

  useEffect(() => {
    setSelectedUser("");
  }, [selectedDeptId]);

  // Prevent scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = selectedTaskId ? "hidden" : "";
  }, [selectedTaskId]);

  // --- FILTERING LOGIC ---
  const applyFilters = (tasks: Task[]) => {
    return tasks.filter((task) => {
      // Resolve Task Department ID
      let taskDeptId = task.departmentId;

      if (!taskDeptId && task.assignedTo?.id) {
        const assignedUser = allUsers.find((u) => u.id === task.assignedTo!.id);
        if (assignedUser?.departmentId) {
          taskDeptId = assignedUser.departmentId;
        }
      }

      // Fallback: Check for nested department object from API
      if (!taskDeptId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawTask = task as any;
        if (rawTask.assignedTo?.department?.id) {
          taskDeptId = rawTask.assignedTo.department.id;
        }
      }

      const matchesDept = filterDept === "All" || taskDeptId === filterDept;

      const matchesUser =
        filterUser === "All" || task.assignedTo?.id === filterUser;

      return matchesDept && matchesUser;
    });
  };

  const filteredRecentTasks = applyFilters(recentTasks);
  const filteredDelayedTasks = applyFilters(backendDelayedTasks);
  const totalVisibleTasks =
    filteredRecentTasks.length + filteredDelayedTasks.length;
  const recentCount = filteredRecentTasks.length;
  const delayedCount =
    filteredDelayedTasks.length +
    filteredRecentTasks.filter((t) => t.status === "DELAYED").length;
  const completedCount = filteredRecentTasks.filter(
    (t) => t.status === "COMPLETED",
  ).length;

  // Pie Chart Data
  const chartData = [
    { label: "Active", value: recentCount, color: "#6366f1" }, // indigo-500
    { label: "Completed", value: completedCount, color: "#10b981" }, // emerald-500
    { label: "Delayed", value: delayedCount, color: "#f59e0b" }, // amber-500
  ].filter((d) => d.value > 0);

  const totalChartValue = chartData.reduce((acc, curr) => acc + curr.value, 0);
  let cumulativePercent = 0;

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !title ||
      !description ||
      !deadline ||
      !selectedUser ||
      !selectedDeptId ||
      !selectedPriorityId
    ) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const response = await fetch(`${API_BASE_URL}/api/tasks/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          deadline,
          assignedTo: selectedUser,
          departmentId: selectedDeptId || null,
          priorityId: selectedPriorityId,
        }),
      });

      if (response.ok) {
        setSuccess("Task created successfully!");
        setTitle("");
        setDescription("");
        setDeadline("");
        setSelectedUser("");
        setSelectedDeptId("");
        setSelectedPriorityId(null);
        setTimeout(() => setIsModalOpen(false), 1500);
        fetchTasks(filterUser, filterDept);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to create task");
      }
    } catch (err: unknown) {
      setError("Error creating task");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 text-gray-900 p-4 md:p-6 lg:p-8 font-sans select-none">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Dashboard
        </h1>
        <Button
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md rounded-lg px-4 py-2 text-sm w-full sm:w-auto"
        >
          + Create New Task
        </Button>
      </div>

      {/* MAIN GRID LAYOUT */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* LEFT COLUMN: ANALYTICS & SIDEBAR */}
        <div className="w-full xl:w-80 flex flex-col gap-6 shrink-0 order-2 xl:order-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-4">
            <Card className="bg-white/80 backdrop-blur-sm border-indigo-100 shadow-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  Visible Tasks
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {totalVisibleTasks}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-indigo-50 border-indigo-100 shadow-sm">
              <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] text-indigo-600 font-bold uppercase">
                  Active
                </p>
                <p className="text-xl font-bold text-indigo-800">
                  {recentCount}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 border-amber-100 shadow-sm">
              <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] text-amber-600 font-bold uppercase">
                  Delayed
                </p>
                <p className="text-xl font-bold text-amber-800">
                  {delayedCount}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Donut Chart */}
          <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col pb-6">
              <div className="flex justify-center items-center">
                {totalChartValue === 0 ? (
                  <div className="h-40 w-40 rounded-full border-4 border-gray-100 flex items-center justify-center text-xs text-gray-400">
                    No Data
                  </div>
                ) : (
                  <div className="relative w-48 h-48">
                    <svg
                      viewBox="0 0 120 120"
                      className="w-full h-full transform -rotate-90"
                    >
                      {chartData.map((slice, i) => {
                        const percent = slice.value / totalChartValue;
                        const radius = 50;
                        const circumference = 2 * Math.PI * radius;
                        const strokeDasharray = `${
                          percent * circumference
                        } ${circumference}`;
                        const strokeDashoffset =
                          -cumulativePercent * circumference;
                        cumulativePercent += percent;

                        return (
                          <circle
                            key={i}
                            cx="60"
                            cy="60"
                            r={radius}
                            fill="transparent"
                            stroke={slice.color}
                            strokeWidth="12"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="butt"
                            className="transition-all duration-1000 ease-out"
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-3xl font-bold text-gray-800">
                        {totalChartValue}
                      </span>
                      <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                        Total
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2">
                {chartData.map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full ring-2 ring-white shadow-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-gray-600 font-medium">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: FILTERS & CONTENT */}
        <div className="flex-1 order-1 xl:order-2 flex flex-col gap-6">
          {/* Filter Bar */}
          <div className="bg-white/80 p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SelectField value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectField>

            <SelectField value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger>
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Users</SelectItem>
                {(filterDept === "All"
                  ? allUsers
                  : allUsers.filter((u) => u.departmentId === filterDept)
                ).map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectField>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {/* Recent Tasks */}
            <Card className="rounded-xl shadow-lg bg-white/90 backdrop-blur-sm border border-gray-200">
              <CardHeader className="p-4 md:p-6 border-b border-gray-200">
                <CardTitle className="text-lg md:text-xl font-semibold text-gray-800">
                  Recent Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <ul className="space-y-4">
                  {filteredRecentTasks.length > 0 ? (
                    filteredRecentTasks.map((task) => (
                      <li
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="relative p-4 border border-gray-200 rounded-lg bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-indigo-200 transition duration-200 cursor-pointer"
                      >
                        {task.priority && (
                          <div className="absolute top-3 right-3 flex items-center gap-1.5 shrink-0 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: task.priority.color }}
                            />
                            <span className="text-[10px] uppercase font-bold text-gray-600">
                              {task.priority.name}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Title:</strong>{" "}
                            <span className="font-medium text-gray-800">
                              {task.title}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600 mb-1 line-clamp-1">
                            <strong>Desc:</strong> {task.description}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Assigned To:</strong>{" "}
                            <span className="font-medium text-gray-800">
                              {task.assignedTo?.name || "N/A"}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Deadline:</strong>{" "}
                            {task.deadline
                              ? format(new Date(task.deadline), "PPPpp")
                              : "N/A"}
                          </p>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="p-4 text-gray-500 text-center text-sm">
                      No recent tasks match filters
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Delayed Tasks */}
            <Card className="rounded-xl shadow-lg bg-white/90 backdrop-blur-sm border border-gray-200">
              <CardHeader className="p-4 md:p-6 border-b border-gray-200">
                <CardTitle className="text-lg md:text-xl font-semibold text-gray-800">
                  Delayed Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-4">
                  {filteredDelayedTasks.length > 0 ? (
                    filteredDelayedTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className="relative flex flex-col p-4 border border-red-200 rounded-lg bg-red-50 shadow-sm hover:border-red-300 hover:shadow-md transition duration-200 cursor-pointer"
                      >
                        {task.priority && (
                          <div className="absolute top-3 right-3 flex items-center gap-1.5 shrink-0 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: task.priority.color }}
                            />
                            <span className="text-[10px] uppercase font-bold text-gray-600">
                              {task.priority.name}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-700 text-base">
                            {task.title}
                          </p>
                          <p className="text-sm text-red-500 mt-1">
                            Overdue since:{" "}
                            {task.deadline
                              ? format(new Date(task.deadline), "PPPpp")
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center text-sm">
                      No delayed tasks match filters.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Task Lists */}
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-blue-50 backdrop-blur-md text-gray-800 rounded-xl p-6 w-full max-w-md relative shadow-xl border border-gray-200">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 text-center">
              Create New Task
            </h2>
            {isModalDataLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading data...</p>
              </div>
            ) : modalFetchError ? (
              <div className="text-center py-8">
                <p className="text-red-600">{modalFetchError}</p>
                <Button onClick={() => setIsModalOpen(false)}>Close</Button>
              </div>
            ) : (
              <form onSubmit={handleCreateTask} className="space-y-5">
                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Title
                  </label>
                  <Input
                    className="bg-white"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Description
                  </label>
                  <Textarea
                    className="bg-white"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
                <div className="gap-2">
                  <label className="block mb-2 font-medium text-gray-700">
                    Priority
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {priorities.map((p) => (
                      <label
                        key={p.id}
                        className={`flex text-xs items-center gap-2 px-2 py-2 rounded-lg border cursor-pointer ${selectedPriorityId === p.id ? "border-indigo-500 bg-indigo-50" : "border-gray-300 bg-white"}`}
                      >
                        <input
                          type="radio"
                          name="priority"
                          value={p.id}
                          checked={selectedPriorityId === p.id}
                          onChange={() => setSelectedPriorityId(p.id)}
                          className="accent-indigo-600"
                        />
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="text-xs text-gray-700">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="w-full">
                  <label className="block mb-2 font-medium text-gray-700">
                    Deadline
                  </label>
                  <Input
                    type="datetime-local"
                    className="bg-white"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Department
                  </label>
                  <SelectField
                    value={selectedDeptId}
                    onValueChange={setSelectedDeptId}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dep) => (
                        <SelectItem key={dep.id} value={dep.id}>
                          {dep.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectField>
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Assign To
                  </label>
                  <SelectField
                    value={selectedUser}
                    onValueChange={setSelectedUser}
                    disabled={!selectedDeptId}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select User" />
                    </SelectTrigger>
                    <SelectContent>
                      {allUsers
                        .filter(
                          (u) =>
                            u.departmentId === selectedDeptId && u.approved,
                        )
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </SelectField>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Create Task
                  </Button>
                </div>
                {error && (
                  <p className="text-red-600 text-sm flex items-center justify-center">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="flex items-center justify-center text-green-600 text-sm">
                    {success}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm"
          onClick={() => setSelectedTaskId(null)}
        >
          <div
            className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-200 w-[95%] max-w-2xl h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTaskId(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600 text-lg font-semibold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
            >
              ✕
            </button>
            <ClientTaskDetail taskId={selectedTaskId} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
