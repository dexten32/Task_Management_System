/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import API_BASE_URL from "@/lib/api";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SelectField,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User as UserIcon, Shield, Briefcase, Mail, Building, Plus, MoreVertical, Trash2, CheckCircle2, XCircle, Clock } from "lucide-react";

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
  const [employeesList, setEmployeesList] = useState<User[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string>("");

  // Add User State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [managerDeptId, setManagerDeptId] = useState<string>("");
  const [managerDeptName, setManagerDeptName] = useState<string>("");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    departmentId: "",
    role: "EMPLOYEE",
  });

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
        const [deptRes, usersRes, meRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/departments`, {
            headers: getAuthHeaders(),
          }),
          fetch(`${API_BASE_URL}/api/users`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE_URL}/api/users/me`, {
            headers: getAuthHeaders(),
          }),
        ]);

        if (!deptRes.ok || !usersRes.ok || !meRes.ok)
          throw new Error("One or more fetches failed");

        const deptData = await deptRes.json();
        const usersData = await usersRes.json();
        const meData = await meRes.json();

        setDepartments(deptData.departments || []);
        if (meData?.departmentId) {
          setManagerDeptId(meData.departmentId);
          setNewUser(prev => ({ ...prev, departmentId: meData.departmentId }));
          const dept = deptData.departments?.find((d: Department) => d.id === meData.departmentId);
          if (dept) setManagerDeptName(dept.name);
        }

        setEmployeesList(usersData.users.filter((u: User) => u.approved));
        setError("");
      } catch (err) {
        console.error(err);
        setError("Failed to load data.");
      }
    };

    fetchData();
  }, []);

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

  const handleAddUser = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newUser),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create user");
      }

      const createdUser = await res.json();
      setEmployeesList((prev) => [...prev, createdUser]);
      setIsAddUserOpen(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        departmentId: managerDeptId, // Reset to manager's dept
        role: "EMPLOYEE",
      });
      setError("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error creating user.");
      }
    }
  };

  return (
    <div className="min-h-screen text-gray-900 p-4 md:p-6 lg:p-8 font-sans select-none">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          User Management
        </h1>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md rounded-lg px-4 py-2 text-sm w-full sm:w-auto font-medium transition-all">
              + Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white border-gray-200 text-gray-800">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Add New User</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-gray-700">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  className="col-span-3 border-gray-300"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="col-span-3 border-gray-300"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  className="col-span-3 border-gray-300"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department" className="text-right text-gray-700">
                  Dept
                </Label>
                <div className="col-span-3">
                  <Input
                    value={managerDeptName}
                    disabled
                    className="w-full bg-gray-100 border-gray-200 text-gray-600 font-medium cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right text-gray-700">
                  Role
                </Label>
                <div className="col-span-3">
                  <Input
                    value="EMPLOYEE"
                    disabled
                    className="w-full bg-gray-100 border-gray-200 text-gray-600 font-medium cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleAddUser}
                className="bg-green-600 hover:bg-green-700 text-white border-none"
              >
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Employees Section */}
        <Card className="flex-1 rounded-xl shadow-lg bg-white/90 backdrop-blur-sm border border-gray-200">
          <CardHeader className="p-4 md:p-6 border-b border-gray-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg md:text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-500" /> Employees
            </CardTitle>
            <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2 py-1 rounded-full">
              {employeesList.length} Total
            </span>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-3">
              {employeesList.map((user) => (
                <motion.div
                  key={user.id}
                  layout
                  className="flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 p-4"
                >
                  {editingUserId === user.id ? (
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          value={managerDeptName}
                          disabled
                          className="w-full bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                        />

                        <SelectField
                          value={editedUser.role || ""}
                          onValueChange={(val) =>
                            setEditedUser({ ...editedUser, role: val })
                          }
                        >
                          <SelectTrigger className="w-full bg-gray-50 border-gray-200 text-gray-900">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-200">
                            {hardcodedRoles.filter(r => r.name !== "ADMIN").map((role) => (
                              <SelectItem key={role.id} value={role.name}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </SelectField>
                      </div>

                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingUserId(null)}
                          className="bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(user.id)}
                          className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-none px-3"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSave(user.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 shrink-0 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 leading-tight">
                            {user.name}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                              <Building className="w-3 h-3 text-gray-400" />
                              {user.department && typeof user.department === "object"
                                ? user.department.name
                                : user.department || "No Dept"}
                            </span>
                            <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 font-medium">
                              <Shield className="w-3 h-3 text-blue-400" />
                              {user.role || "No Role"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingUserId(user.id);
                          setEditedUser({
                            departmentId: user.departmentId || "",
                            role: user.role || "",
                          });
                        }}
                        className="text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 font-medium px-3 shrink-0"
                      >
                        Edit
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
              {employeesList.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No approved employees found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="fixed bottom-6 left-6 bg-red-600 text-white p-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
