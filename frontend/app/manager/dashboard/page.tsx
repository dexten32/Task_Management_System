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
import MultiSelect from "@/components/MultiSelect";
import ClientTaskDetail from "@/components/ClientTaskDetail";
import API_BASE_URL from "@/lib/api";

import { X } from "lucide-react";

interface UserResponse {
  id: string;
  name: string;
  email: string;
  departmentId: string | null;
  role?: string;
  approved?: boolean;
}

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
  readableId?: number;
  title: string;
  description: string;
  assignees?: { name: string; id: string }[];
  assignedBy?: { name: string; id: string };
  deadline: string;
  status?: string; // Added status for filtering
  department?: string; // Added for filtering convenience
  departmentId?: string;
  createdAt?: string;
}

// interface PendingUser extends User {
//   role: string;
// }

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
type DashboardAggregates = {
  total: number;
  active: number;
  delayed: number;
  completed: number;
};

const DashboardPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [managerDeptName, setManagerDeptName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add Department State
  const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [deptError, setDeptError] = useState("");
  const [deptSuccess, setDeptSuccess] = useState("");

  // Data State
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [backendDelayedTasks, setBackendDelayedTasks] = useState<Task[]>([]);

  const [allUsers, setAllUsers] = useState<User[]>([]);
  // const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);

  // Loading & Error States
  const [isModalDataLoading, setIsModalDataLoading] = useState(true);
  const [modalFetchError, setModalFetchError] = useState<string | null>(null);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [selectedPriorityId, setSelectedPriorityId] = useState<number | null>(
    null,
  );
  const [nextTaskId, setNextTaskId] = useState<number | null>(null);

  // Filters State
  const [filterUser, setFilterUser] = useState<string>("All");
  const [aggregates, setAggregates] = useState<DashboardAggregates>({
    total: 0,
    active: 0,
    delayed: 0,
    completed: 0,
  });

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
        const usersArray: UserResponse[] = usersData.users || [];

        const mappedUsers: User[] = usersArray.map((user: UserResponse) => ({
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

        const meResponse = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!meResponse.ok) throw new Error("Failed to fetch current user");
        const meData = await meResponse.json();

        if (meData?.departmentId) {
          setSelectedDeptId(meData.departmentId);
          const dept = departmentsData.departments?.find((d: Department) => d.id === meData.departmentId);
          if (dept) setManagerDeptName(dept.name);
        }
      } catch (error: unknown) {
        console.error("Failed to fetch users/departments/priorities", error);
        setModalFetchError("Failed to load data.");
      } finally {
        setIsModalDataLoading(false);
      }
    };
    fetchUsersAndDepartments();
  }, []);

  const fetchTasks = async (filterUser: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const query = new URLSearchParams();
      query.set("limit", "3");
      if (filterUser !== "All") {
        query.set("userId", filterUser);
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
    } catch (error: unknown) {
      console.error("Failed to fetch recent tasks", error);
    }
  };

  const fetchBackendDelayedTasks = async (
    filterUser: string,
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const query = new URLSearchParams();
      query.set("limit", "3");
      if (filterUser !== "All") {
        query.set("userId", filterUser);
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

  const fetchDashboardAggregates = async (
    filterUser: string,
  ) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No Token");

    const query = new URLSearchParams();

    if (filterUser !== "All") {
      query.set("userId", filterUser);
    }
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/tasks/dashboard-aggregate?${query.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Failed to fetch aggregates");
      return res.json();
    } catch (error) {
      console.error("Failed to fetch dashboard aggregates", error);
      return { total: 0, active: 0, delayed: 0, completed: 0 };
    }
  };

  useEffect(() => {
    fetchTasks(filterUser);
    fetchBackendDelayedTasks(filterUser);
    fetchDashboardAggregates(filterUser).then(setAggregates);
  }, [filterUser]);

  useEffect(() => {
    setSelectedUserIds([]);
  }, [selectedDeptId]);

  useEffect(() => {
    document.body.style.overflow = selectedTaskId ? "hidden" : "";
  }, [selectedTaskId]);

  useEffect(() => {
    if (isModalOpen) {
      const fetchNextId = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;
          const res = await fetch(`${API_BASE_URL}/api/tasks/next-id`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setNextTaskId(data.nextId);
          }
        } catch (error) {
          console.error("Failed to fetch next task ID", error);
        }
      };
      fetchNextId();
    }
  }, [isModalOpen]);

  // --- FILTERING LOGIC ---
  const applyFilters = (tasks: Task[]) => {
    return tasks.filter((task) => {
      // Resolve Task Department ID
      let taskDeptId = task.departmentId;

      if (!taskDeptId && task.assignees && task.assignees.length > 0) {
        // Try to find department from the first assignee's ID in allUsers
        const firstAssigneeId = task.assignees[0].id;
        const assignedUser = allUsers.find((u) => u.id === firstAssigneeId);
        if (assignedUser?.departmentId) {
          taskDeptId = assignedUser.departmentId;
        }

        // Fallback: Check for nested department object from API in the assignee object
        if (!taskDeptId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawTask = task as any;
          if (rawTask.assignees?.[0]?.department?.id) {
            taskDeptId = rawTask.assignees[0].department.id;
          }
        }
      }

      const matchesUser =
        filterUser === "All" ||
        task.assignees?.some((a) => a.id === filterUser);

      return matchesUser;
    });
  };

  const filteredRecentTasks = applyFilters(recentTasks);
  const filteredDelayedTasks = applyFilters(backendDelayedTasks);
  const totalTasks = aggregates.total;
  const activeTasks = aggregates.active;
  const delayedTasks = aggregates.delayed;
  const completedTasks = aggregates.completed;

  // Pie Chart Data
  const chartData = [
    { label: "Active", value: activeTasks, color: "#6366f1" }, // indigo-500
    { label: "Completed", value: completedTasks, color: "#10b981" }, // emerald-500
    { label: "Delayed", value: delayedTasks, color: "#f59e0b" }, // amber-500
  ].filter((d) => d.value > 0);

  const totalChartValue = chartData.reduce((acc, curr) => acc + curr.value, 0);
  let cumulativePercent = 0;

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const missingFields = [];
    if (!title) missingFields.push("Title");
    if (!description) missingFields.push("Description");
    if (!deadline) missingFields.push("Deadline");
    if (selectedUserIds.length === 0) missingFields.push("Assign To");
    if (!selectedDeptId) missingFields.push("Department");
    if (selectedPriorityId === null) missingFields.push("Priority");

    if (missingFields.length > 0) {
      setError(`Please fill in all fields: ${missingFields.join(", ")}`);
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
          assignees: selectedUserIds,
          departmentId: selectedDeptId || null,
          priorityId: selectedPriorityId,
        }),
      });

      if (response.ok) {
        setSuccess("Task created successfully!");
        setTitle("");
        setDescription("");
        setDeadline("");
        setSelectedUserIds([]);
        setSelectedDeptId("");
        setSelectedPriorityId(null);
        setTimeout(() => setIsModalOpen(false), 1500);
        fetchTasks(filterUser);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to create task");
      }
    } catch (error: unknown) {
      console.error("Error creating task", error);
      setError("Error creating task");
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptError("");
    setDeptSuccess("");

    if (!newDeptName.trim()) {
      setDeptError("Department name is required.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const response = await fetch(`${API_BASE_URL}/api/departments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newDeptName.trim() }),
      });

      if (response.ok) {
        const newDept = await response.json();
        setDeptSuccess("Department created successfully!");
        setDepartments((prev) => [...prev, newDept]);
        setTimeout(() => {
          setIsAddDeptModalOpen(false);
          setNewDeptName("");
          setDeptSuccess("");
        }, 1500);
      } else {
        const data = await response.json();
        setDeptError(data.message || "Failed to create department");
      }
    } catch (error: unknown) {
      console.error("Error creating department:", error);
      setDeptError("Network error. Could not create department.");
    }
  };

  return (
    <div className="min-h-screen text-gray-900 p-4 md:p-6 lg:p-8 font-sans select-none">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Dashboard
        </h1>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md rounded-lg px-4 py-2 text-sm w-full sm:w-auto font-medium transition-all"
          >
            + Create New Task
          </Button>
        </div>
      </div>

      {/* MAIN GRID LAYOUT */}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* RIGHT COLUMN: ANALYTICS & SIDEBAR */}
        <div className="w-full xl:w-72 flex flex-col gap-6 shrink-0 order-2 xl:order-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-4">
            <Card className="bg-white/80 backdrop-blur-sm border-indigo-100 shadow-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  Total Tasks Assigned
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {totalTasks}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-indigo-50 border-indigo-100 shadow-sm">
              <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] text-indigo-600 font-bold uppercase">
                  Active Tasks
                </p>
                <p className="text-xl font-bold text-indigo-800">
                  {activeTasks}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 border-amber-100 shadow-sm">
              <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] text-amber-600 font-bold uppercase">
                  Delayed Tasks
                </p>
                <p className="text-xl font-bold text-amber-800">
                  {delayedTasks}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Donut Chart */}
          <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Tasks Analytics
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
                        const strokeDasharray = `${percent * circumference
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

        {/* LEFT COLUMN: FILTERS & CONTENT */}
        <div className="flex-1 order-1 xl:order-1 flex flex-col gap-6">
          {/* Filter Bar */}
          <div className="bg-white/80 p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SelectField value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger>
                <SelectValue placeholder="Assigned To" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Assignees</SelectItem>
                {allUsers
                  .filter((u) => u.role !== "MANAGER")
                  .map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </SelectField>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
                          <div className="absolute top-4 right-4 z-50 bg-white/80 backdrop-blur-sm  flex items-center gap-1.5 shrink-0 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
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
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded mb-1 inline-block">
                            CYN-0{task.readableId}
                          </span>
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
                              {task.assignees && task.assignees.length > 0
                                ? task.assignees.map((a) => a.name).join(", ")
                                : "N/A"}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Assigned By:</strong>{" "}
                            <span className="font-medium text-gray-800">
                              {task.assignedBy?.name || "N/A"}
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
                      No recent tasks.
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
                          <div className="absolute top-4 right-4 z-50 bg-white/80 backdrop-blur-sm  flex items-center gap-1.5 shrink-0 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
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
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded mb-1 inline-block">
                            CYN-0{task.readableId}
                          </span>
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
                              {task.assignees && task.assignees.length > 0
                                ? task.assignees.map((a) => a.name).join(", ")
                                : "N/A"}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Assigned By:</strong>{" "}
                            <span className="font-medium text-gray-800">
                              {task.assignedBy?.name || "N/A"}
                            </span>
                          </p>
                          <p className="text-sm text-red-600">
                            <strong>Overdue since:</strong>{" "}
                            {task.deadline
                              ? format(new Date(task.deadline), "PPPpp")
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center text-sm">
                      No delayed tasks.
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
      {
        isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white backdrop-blur-md text-gray-800 rounded-xl p-6 w-full max-w-md relative shadow-xl border border-gray-200">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900 text-center">
                Create New Task {nextTaskId ? <span className="text-indigo-600">CYN-0{nextTaskId}</span> : ""}
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
                    <Input
                      value={managerDeptName}
                      disabled
                      className="bg-gray-100 border-gray-200 text-gray-600 font-medium cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Assign To
                    </label>
                    <MultiSelect
                      options={allUsers
                        .filter(
                          (u) =>
                            u.departmentId === selectedDeptId && u.approved && u.role !== "MANAGER",
                        )
                        .map((user) => ({
                          id: user.id,
                          name: `${user.name} (${user.role || 'EMPLOYEE'})`
                        }))}
                      selectedIds={selectedUserIds}
                      onChange={setSelectedUserIds}
                      placeholder={selectedDeptId ? "Select Users..." : "Loading Department..."}
                      className={!selectedDeptId ? "opacity-50 pointer-events-none" : ""}
                    />
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
        )
      }

      {/* Add Department Modal */}
      {
        isAddDeptModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white text-gray-800 rounded-xl p-6 w-full max-w-sm relative shadow-xl border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Add Department</h2>
                <button
                  onClick={() => setIsAddDeptModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateDepartment} className="space-y-5">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Department Name
                  </label>
                  <Input
                    className="bg-gray-50 border-gray-200"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="e.g. Engineering"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDeptModalOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto"
                  >
                    Create
                  </Button>
                </div>

                {deptError && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center justify-center mt-2">
                    <span className="font-medium mr-1">Error:</span> {deptError}
                  </div>
                )}
                {deptSuccess && (
                  <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center justify-center mt-2 font-medium">
                    {deptSuccess}
                  </div>
                )}
              </form>
            </div>
          </div>
        )
      }

      {/* Task Detail Modal */}
      {
        selectedTaskId && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm"
            onClick={() => setSelectedTaskId(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[95%] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedTaskId(null)}
                className="absolute top-4 right-4 z-50 bg-white/80 backdrop-blur-sm  text-gray-500 hover:text-red-600 text-lg font-semibold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
              >
                ✕
              </button>
              <ClientTaskDetail taskId={selectedTaskId} />
            </div>
          </div>
        )
      }
    </div>
  );
};

export default DashboardPage;
