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
}

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo?: { name: string; id: string };
  assignedBy?: { name: string; id: string };
  deadline: string;
}

interface PendingUser extends User {
  role: string;
}

interface Department {
  id: string;
  name: string;
}

const DashboardPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [backendDelayedTasks, setBackendDelayedTasks] = useState<Task[]>([]);
  const [isModalDataLoading, setIsModalDataLoading] = useState(true);
  const [modalFetchError, setModalFetchError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsersAndDepartments = async () => {
      setIsModalDataLoading(true);
      setModalFetchError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const userResponse = await fetch(`${API_BASE_URL}/api/users`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          throw new Error(errorData.message || "Failed to fetch users");
        }
        const usersData = await userResponse.json();
        console.log("1. Raw usersData from API (full response):", usersData);
        const usersArray = usersData.users || [];
        const mappedUsers: User[] = usersArray.map(
          (user: {
            department: { id: string; name: string } | null;
            id: string;
            name: string;
            email: string;
            departmentId: string | null;
            approved: boolean;
            role: string;
          }) => {
            console.log(
              "User object *inside map function* (raw from API, before mapping):",
              user
            );
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              departmentId: user.departmentId,
              role: user.role,
              approved: user.approved,
            };
          }
        );
        console.log(
          "2. Mapped users (before setting allUsers state):",
          mappedUsers
        );
        setAllUsers(mappedUsers);

        const deptResponse = await fetch(`${API_BASE_URL}/api/departments`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!deptResponse.ok) {
          const errorData = await deptResponse.json();
          throw new Error(errorData.message || "Failed to fetch departments");
        }
        const departmentsData = await deptResponse.json();
        setDepartments(departmentsData.departments || []);
      } catch (error: unknown) {
        console.error("Failed to fetch users and departments", error);
        setModalFetchError(
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message?: string }).message ||
                "Failed to load data. Please check your connection."
            : "Failed to load data. Please check your connection."
        );
      } finally {
        setIsModalDataLoading(false);
      }
    };
    fetchUsersAndDepartments();
  }, []);

  useEffect(() => {
    const fetchPendingUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found.");
        }
        const response = await fetch(`${API_BASE_URL}/api/users/pending`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to fetch pending user requests"
          );
        }
        const data = await response.json();
        setPendingUsers(data.users || []);
      } catch (error: unknown) {
        console.error("Failed to fetch pending users", error);
        setError(
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message?: string }).message ||
                "Failed to load pending user requests."
            : "Failed to load pending user requests."
        );
      }
    };

    fetchPendingUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }
      const res = await fetch(`${API_BASE_URL}/api/tasks/recentlimit`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to fetch recent tasks");
      }
      const data = await res.json();
      setRecentTasks(data || []);
      console.log("5. Recent tasks fetched:", data);
    } catch (err: unknown) {
      console.error("Failed to fetch recent tasks", err);
      setError(
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message?: string }).message || "Failed to load tasks."
          : "Failed to load tasks."
      );
    }
  };
  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const fetchBackendDelayedTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found.");
        }
        const res = await fetch(`${API_BASE_URL}/api/tasks/delayed`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch delayed tasks");
        }
        const data = await res.json();
        setBackendDelayedTasks(data.tasks || []);
      } catch (err: unknown) {
        console.error("Failed to fetch backend delayed tasks", err);
        setError(
          typeof err === "object" && err !== null && "message" in err
            ? (err as { message?: string }).message ||
                "Failed to load delayed tasks."
            : "Failed to load delayed tasks."
        );
      }
    };

    fetchBackendDelayedTasks();
  }, []);

  useEffect(() => {
    setSelectedUser("");
  }, [selectedDeptId]);

  // Prevent scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = selectedTaskId ? "hidden" : "";
  }, [selectedTaskId]);

  const filteredUsers = allUsers.filter((user) => {
    return user.departmentId === selectedDeptId;
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !title ||
      !description ||
      !deadline ||
      !selectedUser ||
      !selectedDeptId
    ) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }
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
        }),
      });

      if (response.ok) {
        setSuccess("Task created successfully!");
        setTitle("");
        setDescription("");
        setDeadline("");
        setSelectedUser("");
        setSelectedDeptId("");
        setTimeout(() => setIsModalOpen(false), 1500);
        fetchTasks();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to create task");
      }
    } catch (err: unknown) {
      setError(
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message?: string }).message || "Error creating task"
          : "Error creating task"
      );
    }
  };

  const handleApproveUser = async (userId: string) => {
    console.log("APPROVE USER: Attempting to approve user with ID:", userId);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }
      const response = await fetch(
        `${API_BASE_URL}/api/users/approve/${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("APPROVE USER: Response status:", response.status);
      if (response.ok) {
        setPendingUsers(pendingUsers.filter((user) => user.id !== userId));
      } else {
        const data = await response.json();
        setError(data.message || "Failed to approve user");
      }
    } catch (error: unknown) {
      console.error("APPROVE USER: Error approving user:", error);
      setError(
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message || "Failed to approve user."
          : "Failed to approve user."
      );
    }
  };

  const handleDeclineUser = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }
      const response = await fetch(
        `${API_BASE_URL}/api/users/decline/${userId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        setPendingUsers(pendingUsers.filter((user) => user.id !== userId));
      } else {
        const data = await response.json();
        setError(data.message || "Failed to decline user");
      }
    } catch (error: unknown) {
      console.error("Error declining user:", error);
      setError(
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message || "Failed to decline user."
          : "Failed to decline user."
      );
    }
  };

  const handleDepartmentChange = async (
    userId: string,
    departmentId: string
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }
      const response = await fetch(
        `${API_BASE_URL}/api/users/update/${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ departmentId, role: "EMPLOYEE" }),
        }
      );
      if (response.ok) {
        setPendingUsers(
          pendingUsers.map((user) =>
            user.id === userId ? { ...user, departmentId: departmentId } : user
          )
        );

        setAllUsers(
          allUsers.map((user) =>
            user.id === userId ? { ...user, departmentId: departmentId } : user
          )
        );
      } else {
        const data = await response.json();
        setError(data.message || "Failed to update department");
      }
    } catch (error: unknown) {
      console.error("Error updating user department:", error);
      setError(
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message ||
              "Failed to update department."
          : "Failed to update department."
      );
    }
  };

  const getDepartmentName = (departmentId: string | null) => {
    if (!departmentId) return "N/A";
    const department = departments.find((d) => d.id === departmentId);
    return department ? department.name : "Unknown";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 text-gray-900 p-4 md:p-6 lg:p-8 font-sans">
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
      `}
      </style>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column */}
        <div className="flex flex-col gap-6 lg:col-span-2 order-2 lg:order-1">
          {/* Recent Tasks */}
          <Card className="rounded-xl shadow-lg bg-white/90 backdrop-blur-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-6 border-b border-gray-200 gap-3 sm:gap-0">
              <CardTitle className="text-lg md:text-xl font-semibold text-gray-800">
                Recent Tasks
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="bg-slate-100 text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 transition duration-200 rounded-lg px-4 py-2 text-sm shadow-sm"
              >
                + New Task
              </Button>
            </div>
            <CardContent className="p-4 md:p-6">
              <ul className="space-y-4">
                {recentTasks.length > 0 ? (
                  recentTasks.map((task) => (
                    <li
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="p-4 border border-gray-200 rounded-lg bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-indigo-200 transition duration-200 cursor-pointer"
                    >
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Title:</strong>{" "}
                          <span className="font-medium text-gray-800">
                            {task.title}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Description:</strong> {task.description}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Assigned To:</strong>{" "}
                          <span className="font-medium text-gray-800">
                            {task.assignedTo?.name || "N/A"}
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
                    No recent tasks
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
                {backendDelayedTasks.length > 0 ? (
                  backendDelayedTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="flex flex-col p-4 border border-red-200 rounded-lg bg-red-50 shadow-sm hover:border-red-300 hover:shadow-md transition duration-200 cursor-pointer"
                    >
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTaskId(task.id);
                          }}
                          className="bg-red-600 text-white rounded-lg px-4 py-2 mt-3 text-sm hover:bg-red-700 transition duration-200"
                        >
                          Complete
                        </button>
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

        {/* Right Column - User Requests */}
        <Card className="h-full rounded-xl shadow-lg bg-white/90 backdrop-blur-sm border border-gray-200 order-1 lg:order-2">
          <CardHeader className="p-4 md:p-6 border-b border-gray-200">
            <CardTitle className="text-lg md:text-xl font-semibold text-gray-800">
              User Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              {pendingUsers.length > 0 ? (
                pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col p-4 border border-gray-200 rounded-lg bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-indigo-200 transition duration-200"
                  >
                    <p className="font-medium text-gray-800 text-base">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-500 break-all mb-2">
                      {user.email}
                    </p>
                    <div className="relative mb-3">
                      <SelectField
                        value={
                          typeof user.departmentId === "object" &&
                          user.departmentId !== null
                            ? user.departmentId
                            : user.departmentId || ""
                        }
                        onValueChange={(value) =>
                          handleDepartmentChange(user.id, value)
                        }
                        disabled={departments.length === 0}
                      >
                        <SelectTrigger className="w-full bg-white text-sm border-gray-300 focus:border-indigo-400 focus:ring-indigo-400">
                          <SelectValue
                            placeholder={
                              departments.length > 0
                                ? "Select Department"
                                : "Loading..."
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="absolute z-10 mt-1 w-full border rounded shadow-md bg-white">
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </SelectField>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveUser(user.id)}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm flex-1"
                      >
                        Accept
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeclineUser(user.id)}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm flex-1"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center text-sm">
                  No pending user requests.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-md text-gray-800 rounded-xl p-6 w-full max-w-md relative shadow-xl border border-gray-200">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 text-center">
              Create New Task
            </h2>

            {isModalDataLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading data for dropdowns...</p>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-500 mx-auto mt-4"></div>
              </div>
            ) : modalFetchError ? (
              <div className="text-center py-8">
                <p className="text-red-600">{modalFetchError}</p>
                <Button
                  onClick={() => setIsModalOpen(false)}
                  className="mt-4 bg-gray-800 text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 transition rounded-lg px-4 py-2 text-sm"
                >
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCreateTask} className="space-y-5">
                <div>
                  <label
                    htmlFor="title"
                    className="block mb-2 font-medium text-gray-700"
                  >
                    Title
                  </label>
                  <Input
                    id="title"
                    type="text"
                    className="w-full rounded-lg border-gray-300 focus:border-indigo-400 focus:ring-indigo-400"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block mb-2 font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <Textarea
                    id="description"
                    className="w-full rounded-lg border-gray-300 focus:border-indigo-400 focus:ring-indigo-400"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="deadline"
                    className="block mb-2 font-medium text-gray-700"
                  >
                    Deadline
                  </label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    className="w-full rounded-lg border-gray-300 focus:border-indigo-400 focus:ring-indigo-400"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="department"
                    className="block mb-2 font-medium text-gray-700"
                  >
                    Department
                  </label>
                  <SelectField
                    value={selectedDeptId || ""}
                    onValueChange={(value: string) => setSelectedDeptId(value)}
                    required
                    disabled={departments.length === 0}
                  >
                    <SelectTrigger className="w-full bg-white text-sm border-gray-300 focus:border-indigo-400 focus:ring-indigo-400">
                      <SelectValue
                        placeholder={
                          departments.length > 0
                            ? "Select a department"
                            : "No departments available"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="absolute z-10 mt-1 w-full border rounded shadow-md bg-white">
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectField>
                </div>

                <div>
                  <label
                    htmlFor="assignToUser"
                    className="block mb-2 font-medium text-gray-700"
                  >
                    Assign To User
                  </label>
                  <SelectField
                    value={selectedUser}
                    onValueChange={(value: string) => setSelectedUser(value)}
                    required
                    disabled={!selectedDeptId || filteredUsers.length === 0}
                  >
                    <SelectTrigger className="w-full bg-white text-sm border-gray-300 focus:border-indigo-400 focus:ring-indigo-400">
                      <SelectValue
                        placeholder={
                          !selectedDeptId
                            ? "Select department first"
                            : filteredUsers.length > 0
                            ? "Select a user"
                            : "No users in this department"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="absolute z-10 mt-1 w-full border rounded shadow-md bg-white">
                      {filteredUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectField>
                </div>

                {error && (
                  <p className="text-red-600 text-sm text-center">{error}</p>
                )}
                {success && (
                  <p className="text-green-600 text-sm text-center">
                    {success}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 hover:border-red-400 text-gray-700 
                                hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 
                                transition-all duration-200 shadow-sm hover:shadow-md 
                                text-sm w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-500 text-gray-700 hover:text-white border border-gray-400 hover:border-blue-400 hover:bg-blue-600 
                                rounded-lg 
                                px-4 py-2 text-sm w-full sm:w-auto 
                                transition-all duration-200 shadow-sm hover:shadow-md"
                    disabled={isModalDataLoading}
                  >
                    Create Task
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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
};

export default DashboardPage;
