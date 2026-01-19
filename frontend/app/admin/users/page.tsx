/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import API_BASE_URL from "@/lib/api";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  department: string | { name: string };
  approved: boolean;
  id: string;
  name: string;
  email: string;
  departmentId: string | null;
  role: string;
}

interface Department {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
}

export default function UsersTab() {
  const [pending, setPending] = useState<User[]>([]);
  const [employeesList, setEmployeesList] = useState<User[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string>("");

  const hardcodedRoles: Role[] = [
    { id: "admin_role_id", name: "ADMIN" },
    { id: "employee_role_id", name: "EMPLOYEE" },
    { id: "manager_role_id", name: "MANAGER" },
  ];

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptRes, usersRes, pendingRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/departments`, {
            headers: getAuthHeaders(),
          }),
          fetch(`${API_BASE_URL}/api/users`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE_URL}/api/users/pending`, {
            headers: getAuthHeaders(),
          }),
        ]);

        if (!deptRes.ok || !usersRes.ok || !pendingRes.ok)
          throw new Error("One or more fetches failed");

        const deptData = await deptRes.json();
        const usersData = await usersRes.json();
        const pendingData = await pendingRes.json();

        setDepartments(deptData.departments || []);
        setPending(pendingData.users || []);
        setEmployeesList(usersData.users.filter((u: User) => u.approved));
        setError("");
      } catch (err) {
        console.error(err);
        setError("Failed to load data.");
      }
    };

    fetchData();
  }, []);

  const handleAccept = async (userId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/users/approve/${userId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      setPending((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setError("Error approving user.");
    }
  };

  const handleDecline = async (userId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/users/decline/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      setPending((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setError("Error declining user.");
    }
  };

  const handleSave = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/update/${userId}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          departmentId: editedUser.departmentId,
          role: editedUser.role,
        }),
      });

      if (!res.ok) throw new Error("Failed to save user.");

      const updatedUser = await res.json();
      setEmployeesList((prev) =>
        prev.map((u) => (u.id === userId ? updatedUser.user : u))
      );

      setEditingUserId(null);
      setEditedUser({});
    } catch (err) {
      setError("Error saving user.");
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/users/delete/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      setEmployeesList((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      setError("Error deleting user.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 md:p-6">
      {/* Employees Section */}
      <div className="flex-1 border p-4 rounded-2xl bg-gray-50 shadow-sm">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">
          Employees
        </h3>

        <div className="space-y-3">
          {employeesList.map((user) => (
            <motion.div
              key={user.id}
              layout
              className="flex flex-col bg-white rounded-xl shadow hover:shadow-md transition-shadow p-3"
            >
              {editingUserId === user.id ? (
                <>
                  <div className="flex flex-col gap-2">
                    <select
                      value={editedUser.departmentId || ""}
                      onChange={(e) =>
                        setEditedUser({
                          ...editedUser,
                          departmentId: e.target.value,
                        })
                      }
                      className="border p-2 rounded text-gray-700 bg-white"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={editedUser.role || ""}
                      onChange={(e) =>
                        setEditedUser({ ...editedUser, role: e.target.value })
                      }
                      className="border p-2 rounded text-gray-700 bg-white"
                    >
                      <option value="">Select Role</option>
                      {hardcodedRoles.map((role) => (
                        <option key={role.id} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleSave(user.id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setEditingUserId(null)}
                      className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-gray-800">
                      {user.name}
                    </span>
                    <div className="text-sm text-gray-500">
                      {user.department && typeof user.department === "object"
                        ? user.department.name
                        : user.department || "N/A"}{" "}
                      – {user.role || "N/A"}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingUserId(user.id);
                      setEditedUser({
                        departmentId: user.departmentId || "",
                        role: user.role || "",
                      });
                    }}
                    className="text-blue-500 hover:underline"
                  >
                    Edit
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pending Section */}
      <div className="flex-1 border p-4 rounded-2xl bg-gray-50 shadow-sm">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">
          Pending Requests
        </h3>
        {pending.length === 0 ? (
          <div className="text-gray-500">No pending user requests.</div>
        ) : (
          <div className="space-y-3">
            {pending.map((user) => {
              const dept = departments.find((d) => d.id === user.departmentId);
              return (
                <motion.div
                  key={user.id}
                  layout
                  onClick={() =>
                    setExpandedUser(expandedUser === user.id ? null : user.id)
                  }
                  className="bg-white rounded-xl shadow hover:shadow-md p-3 cursor-pointer transition"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">
                      {user.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {dept ? dept.name : "N/A"}
                    </span>
                  </div>

                  <AnimatePresence>
                    {expandedUser === user.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-gray-100 mt-3 rounded-lg p-3 text-gray-600">
                          <p>Email: {user.email}</p>
                          <p>ID: {user.id}</p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <button
                              className="bg-green-500 px-3 py-1 rounded text-white hover:bg-green-600 transition"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAccept(user.id);
                              }}
                            >
                              Accept
                            </button>
                            <button
                              className="bg-red-500 px-3 py-1 rounded text-white hover:bg-red-600 transition"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDecline(user.id);
                              }}
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="fixed bottom-6 left-6 bg-red-600 text-white p-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
