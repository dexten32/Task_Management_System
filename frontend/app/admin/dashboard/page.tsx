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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { X, ListTodo, Activity, AlertCircle } from "lucide-react";

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
  const [departments, setDepartments] = useState<Department[]>([]);
  // const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);

  // Loading & Error States
  const [isModalDataLoading, setIsModalDataLoading] = useState(true);
  const [modalFetchError, setModalFetchError] = useState<string | null>(null);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [selectedPriorityId, setSelectedPriorityId] = useState<number | null>(
    null,
  );
  const [nextTaskId, setNextTaskId] = useState<number | null>(null);

  // Filters State
  const [filterDept, setFilterDept] = useState<string>("All");
  const [filterUser, setFilterUser] = useState<string>("All");
  const [filterAssignedBy, setFilterAssignedBy] = useState<string>("All");
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
      } catch (error: unknown) {
        console.error("Failed to fetch users/departments/priorities", error);
        setModalFetchError("Failed to load data.");
      } finally {
        setIsModalDataLoading(false);
      }
    };
    fetchUsersAndDepartments();
  }, []);

  const fetchTasks = async (filterUser: string, filterDept: string, filterAssignedBy: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const query = new URLSearchParams();
      query.set("limit", "3");
      if (filterUser !== "All") {
        query.set("userId", filterUser);
      }
      if (filterDept !== "All") {
        query.set("departmentId", filterDept);
      }
      if (filterAssignedBy !== "All") {
        query.set("assignedByUserId", filterAssignedBy);
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
    filterDept: string,
    filterAssignedBy: string,
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const query = new URLSearchParams();
      query.set("limit", "3");
      if (filterUser !== "All") {
        query.set("userId", filterUser);
      }
      if (filterDept !== "All") {
        query.set("departmentId", filterDept);
      }
      if (filterAssignedBy !== "All") {
        query.set("assignedByUserId", filterAssignedBy);
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
    filterDept: string,
    filterAssignedBy: string,
  ) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No Token");

    const query = new URLSearchParams();

    if (filterUser !== "All") {
      query.set("userId", filterUser);
    }
    if (filterDept !== "All") {
      query.set("departmentId", filterDept);
    }
    if (filterAssignedBy !== "All") {
      query.set("assignedByUserId", filterAssignedBy);
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
    fetchTasks(filterUser, filterDept, filterAssignedBy);
    fetchBackendDelayedTasks(filterUser, filterDept, filterAssignedBy);
    fetchDashboardAggregates(filterUser, filterDept, filterAssignedBy).then(setAggregates);
  }, [filterUser, filterDept, filterAssignedBy]);

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

      const matchesDept = filterDept === "All" || taskDeptId === filterDept;

      const matchesUser =
        filterUser === "All" ||
        task.assignees?.some((a) => a.id === filterUser);

      return matchesDept && matchesUser;
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
        fetchTasks(filterUser, filterDept, filterAssignedBy);
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
    <div className="min-h-screen text-foreground font-sans select-none w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your team's tasks and performance metrics.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setIsAddDeptModalOpen(true)}
            className="shrink-0"
          >
            + Add Department
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="shrink-0 bg-primary text-primary-foreground shadow-sm transition-colors"
          >
            + Create New Task
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="shadow-sm dark:shadow-2xl dark:shadow-black/40 bg-card backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks Assigned</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">All-time record across departments</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm dark:shadow-2xl dark:shadow-black/40 bg-card backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{activeTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently in progress</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm dark:shadow-2xl dark:shadow-black/40 bg-card backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delayed Tasks</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{delayedTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">Require immediate attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Content Area */}
        <div className="xl:col-span-3 space-y-6">
          <Card className="shadow-sm dark:shadow-2xl dark:shadow-black/40 bg-card backdrop-blur-md">
            <CardHeader className="p-4 md:p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-lg">Recent Tasks</CardTitle>
              <div className="flex flex-wrap gap-2">
                <div className="w-32">
                  <SelectField value={filterDept} onValueChange={setFilterDept}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Depts</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </SelectField>
                </div>
                <div className="w-32">
                  <SelectField value={filterUser} onValueChange={setFilterUser}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Users</SelectItem>
                      {(filterDept === "All" ? allUsers : allUsers.filter((u) => u.departmentId === filterDept))
                        .filter((u) => u.role !== "MANAGER")
                        .map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </SelectField>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px] text-xs font-medium text-muted-foreground">Task</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Assignee</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Deadline</TableHead>
                    <TableHead className="text-right text-xs font-medium text-muted-foreground">Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecentTasks.length > 0 ? (
                    filteredRecentTasks.map((task) => (
                      <TableRow key={task.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedTaskId(task.id)}>
                        <TableCell>
                          <div className="font-medium text-foreground">TSK-0{task.readableId} • {task.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1 mt-1">{task.description}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground">
                                {task.assignees?.[0]?.name?.substring(0, 2).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              {task.assignees?.[0]?.name || "Unassigned"}
                              {task.assignees && task.assignees.length > 1 && ` +${task.assignees.length - 1}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {task.deadline ? format(new Date(task.deadline), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {task.priority && (
                            <Badge 
                              style={{ backgroundColor: task.priority.color, color: "#ffffff" }}
                              className="border-none shadow-none font-medium text-[10px]"
                            >
                              {task.priority.name}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No tasks found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-sm dark:shadow-2xl dark:shadow-black/40 border-destructive/20 bg-card backdrop-blur-md">
            <CardHeader className="p-4 md:p-6 border-b border-destructive/10 bg-destructive/5 flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Delayed Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px] text-xs font-medium text-muted-foreground">Task</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Assignee</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Overdue Since</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDelayedTasks.length > 0 ? (
                    filteredDelayedTasks.map((task) => (
                      <TableRow key={task.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedTaskId(task.id)}>
                        <TableCell>
                          <div className="font-medium text-foreground">TSK-0{task.readableId} • {task.title}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground">
                                {task.assignees?.[0]?.name?.substring(0, 2).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              {task.assignees?.[0]?.name || "Unassigned"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {task.deadline ? (
                            <span className="bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-xs inline-block">
                              {format(new Date(task.deadline), "MMM d, yyyy")}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        No delayed tasks. Great job!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Column */}
        <div className="space-y-6">
          <Card className="shadow-sm dark:shadow-2xl dark:shadow-black/40 bg-card backdrop-blur-md">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg">Tasks Analytics</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex justify-center items-center">
                {totalChartValue === 0 ? (
                  <div className="h-40 w-40 rounded-full border-4 border-muted flex items-center justify-center text-xs text-muted-foreground">
                    No Data
                  </div>
                ) : (
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                      {chartData.map((slice, i) => {
                        const percent = slice.value / totalChartValue;
                        const radius = 50;
                        const circumference = 2 * Math.PI * radius;
                        const strokeDasharray = `${percent * circumference} ${circumference}`;
                        const strokeDashoffset = -cumulativePercent * circumference;
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
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-3xl font-bold">{totalChartValue}</span>
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Total</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-8 flex flex-col gap-3">
                {chartData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card backdrop-blur-md text-card-foreground rounded-xl p-6 w-full max-w-md relative shadow-xl border border-border">
            <h2 className="text-2xl font-semibold mb-6 text-foreground text-center">
              Create New Task {nextTaskId ? <span className="text-primary">TSK-0{nextTaskId}</span> : ""}
            </h2>
            {isModalDataLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading data...</p>
              </div>
            ) : modalFetchError ? (
              <div className="text-center py-8">
                <p className="text-destructive">{modalFetchError}</p>
                <Button onClick={() => setIsModalOpen(false)}>Close</Button>
              </div>
            ) : (
              <form onSubmit={handleCreateTask} className="space-y-5">
                <div>
                  <label className="block mb-2 font-medium text-foreground/80">
                    Title
                  </label>
                  <Input
                    className="bg-card"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-foreground/80">
                    Description
                  </label>
                  <Textarea
                    className="bg-card"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
                <div className="gap-2">
                  <label className="block mb-2 font-medium text-foreground/80">
                    Priority
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {priorities.map((p) => (
                      <label
                        key={p.id}
                        className={`flex text-xs items-center gap-2 px-2 py-2 rounded-lg border cursor-pointer ${selectedPriorityId === p.id ? "border-primary bg-primary/10" : "border-border bg-card"}`}
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
                        <span className="text-xs text-foreground/80">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="w-full">
                  <label className="block mb-2 font-medium text-foreground/80">
                    Deadline
                  </label>
                  <Input
                    type="datetime-local"
                    className="bg-card"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-foreground/80">
                    Department
                  </label>
                  <SelectField
                    value={selectedDeptId}
                    onValueChange={setSelectedDeptId}
                  >
                    <SelectTrigger className="bg-card">
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
                  <label className="block mb-2 font-medium text-foreground/80">
                    Assign To
                  </label>
                  <MultiSelect
                    options={allUsers
                      .filter(
                        (u) =>
                          u.departmentId === selectedDeptId && u.approved,
                      )
                      .map((user) => ({
                        id: user.id,
                        name: `${user.name} (${user.role || 'EMPLOYEE'})`
                      }))}
                    selectedIds={selectedUserIds}
                    onChange={setSelectedUserIds}
                    placeholder={selectedDeptId ? "Select Users..." : "Select Department First"}
                    className={!selectedDeptId ? "opacity-50 pointer-events-none" : ""}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Create Task
                  </Button>
                </div>
                {error && (
                  <p className="text-destructive text-sm flex items-center justify-center">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="flex items-center justify-center text-emerald-500 text-sm">
                    {success}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {isAddDeptModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card text-card-foreground rounded-xl p-6 w-full max-w-sm relative shadow-xl border border-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Add Department</h2>
              <button
                onClick={() => setIsAddDeptModalOpen(false)}
                className="text-muted-foreground/80 hover:text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-5">
              <div>
                <label className="block mb-2 text-sm font-medium text-foreground/80">
                  Department Name
                </label>
                <Input
                  className="bg-muted/50 border-border"
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
                  className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
                >
                  Create
                </Button>
              </div>

              {deptError && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex items-center justify-center mt-2">
                  <span className="font-medium mr-1">Error:</span> {deptError}
                </div>
              )}
              {deptSuccess && (
                <div className="p-3 bg-emerald-500/10 text-emerald-500 text-sm rounded-lg flex items-center justify-center mt-2 font-medium">
                  {deptSuccess}
                </div>
              )}
            </form>
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
            className="bg-card rounded-2xl shadow-2xl border border-border w-[95%] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTaskId(null)}
              className="absolute top-4 right-4 z-50 bg-card/ backdrop-blur-sm  text-muted-foreground hover:text-destructive text-lg font-semibold w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent transition"
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
