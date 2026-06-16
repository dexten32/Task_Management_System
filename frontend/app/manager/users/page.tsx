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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    <div className="min-h-screen text-foreground p-6 space-y-6 font-sans select-none w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          User Management
        </h1>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-md rounded-lg px-4 py-2 font-medium transition-all shrink-0">
              + Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-border text-card-foreground">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add New User</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-foreground/80">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  className="col-span-3 border-border"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right text-foreground/80">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="col-span-3 border-border"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right text-foreground/80">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  className="col-span-3 border-border"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department" className="text-right text-foreground/80">
                  Dept
                </Label>
                <div className="col-span-3">
                  <Input
                    value={managerDeptName}
                    disabled
                    className="w-full bg-muted border-border text-muted-foreground font-medium cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right text-foreground/80">
                  Role
                </Label>
                <div className="col-span-3">
                  <Input
                    value="EMPLOYEE"
                    disabled
                    className="w-full bg-muted border-border text-muted-foreground font-medium cursor-not-allowed"
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

      <div className="grid grid-cols-1 gap-6">
        {/* Employees Section */}
        <Card className="rounded-xl shadow-lg bg-card/60 backdrop-blur-md border border-border">
          <CardHeader className="p-4 md:p-6 border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="text-lg md:text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-500" /> Employees
            </CardTitle>
            <Badge variant="secondary" className="font-bold">
              {employeesList.length} Total
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="text-muted-foreground font-medium text-xs">User Name</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs">Department</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs">Role</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {employeesList.map((user) => (
                  <TableRow key={user.id} className="border-b border-border/50 hover:bg-muted/30">
                    {editingUserId === user.id ? (
                      <TableCell colSpan={4}>
                        <div className="flex flex-col gap-3 p-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input
                              value={managerDeptName}
                              disabled
                              className="w-full bg-muted border-border text-muted-foreground cursor-not-allowed"
                            />

                            <SelectField
                              value={editedUser.role || ""}
                              onValueChange={(val) =>
                                setEditedUser({ ...editedUser, role: val })
                              }
                            >
                              <SelectTrigger className="w-full bg-muted/50 border-border text-foreground">
                                <SelectValue placeholder="Role" />
                              </SelectTrigger>
                              <SelectContent className="bg-card border-border">
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
                              className="bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(user.id)}
                              className="bg-destructive/10 text-destructive hover:bg-destructive/10 hover:text-destructive border-none px-3"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSave(user.id)}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    ) : (
                      <>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {user.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground leading-tight">
                              {user.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground text-sm">
                            {user.department && typeof user.department === "object"
                              ? user.department.name
                              : user.department || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal text-muted-foreground">
                            {user.role || "Employee"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
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
                            className="text-muted-foreground hover:text-foreground h-8"
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
                {employeesList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                      No approved employees found.
                    </TableCell>
                  </TableRow>
                )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex flex-col divide-y divide-border/50">
              {employeesList.map((user) => (
                <div key={user.id} className="flex flex-col p-4 hover:bg-muted/10 transition-colors">
                  {editingUserId === user.id ? (
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-1 gap-3">
                        <Input
                          value={managerDeptName}
                          disabled
                          className="w-full bg-muted border-border text-muted-foreground cursor-not-allowed"
                        />

                        <SelectField
                          value={editedUser.role || ""}
                          onValueChange={(val) =>
                            setEditedUser({ ...editedUser, role: val })
                          }
                        >
                          <SelectTrigger className="w-full bg-muted/50 border-border text-foreground">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
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
                          className="bg-card text-muted-foreground border-border"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(user.id)}
                          className="bg-destructive/10 text-destructive border-none px-3"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSave(user.id)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground text-sm">{user.name}</span>
                          <span className="text-muted-foreground text-xs mt-0.5">
                            {user.department && typeof user.department === "object" ? user.department.name : user.department || "—"}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="secondary" className="font-normal text-muted-foreground text-[10px]">
                          {user.role || "Employee"}
                        </Badge>
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
                          className="h-6 px-2 text-xs text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {employeesList.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
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
