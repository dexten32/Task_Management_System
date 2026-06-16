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
  const [pending, setPending] = useState<User[]>([]);
  const [employeesList, setEmployeesList] = useState<User[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string>("");

  // Add User State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    departmentId: "",
    role: "",
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
        departmentId: "",
        role: "",
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
                  <SelectField
                    value={newUser.departmentId}
                    onValueChange={(val) =>
                      setNewUser({ ...newUser, departmentId: val })
                    }
                  >
                    <SelectTrigger className="w-full border-border bg-card text-foreground">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {departments.map((dept) => (
                        <SelectItem
                          key={dept.id}
                          value={dept.id}
                          className="text-foreground hover:bg-accent focus:bg-muted cursor-pointer"
                        >
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectField>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right text-foreground/80">
                  Role
                </Label>
                <div className="col-span-3">
                  <SelectField
                    value={newUser.role}
                    onValueChange={(val) =>
                      setNewUser({ ...newUser, role: val })
                    }
                  >
                    <SelectTrigger className="w-full border-border bg-card text-foreground">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {hardcodedRoles.map((role) => (
                        <SelectItem
                          key={role.id}
                          value={role.name}
                          className="text-foreground hover:bg-accent focus:bg-muted cursor-pointer"
                        >
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectField>
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Employees Section */}
        <Card className="lg:col-span-3 rounded-xl shadow-lg bg-card/60 backdrop-blur-md border border-border">
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
                            <SelectField
                              value={editedUser.departmentId || ""}
                              onValueChange={(val) =>
                                setEditedUser({
                                  ...editedUser,
                                  departmentId: val,
                                })
                              }
                            >
                              <SelectTrigger className="w-full bg-muted/50 border-border text-foreground">
                                <SelectValue placeholder="Department" />
                              </SelectTrigger>
                              <SelectContent className="bg-card border-border">
                                <SelectItem value="none">No Department</SelectItem>
                                {departments.map((dept) => (
                                  <SelectItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </SelectField>

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
                                {hardcodedRoles.map((role) => (
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
                        <SelectField
                          value={editedUser.departmentId || ""}
                          onValueChange={(val) =>
                            setEditedUser({
                              ...editedUser,
                              departmentId: val,
                            })
                          }
                        >
                          <SelectTrigger className="w-full bg-muted/50 border-border text-foreground">
                            <SelectValue placeholder="Department" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="none">No Department</SelectItem>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </SelectField>

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
                            {hardcodedRoles.map((role) => (
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

        {/* Pending Section */}
        <Card className="lg:col-span-1 lg:sticky lg:top-24 h-fit rounded-xl shadow-lg bg-card/60 backdrop-blur-md border border-border">
          <CardHeader className="p-4 md:p-6 border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="text-lg md:text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> Pending Requests
            </CardTitle>
            {pending.length > 0 && (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-[10px] font-bold text-destructive">
                {pending.length}
              </span>
            )}
          </CardHeader>
          <CardContent className={pending.length === 0 ? "flex flex-col items-center justify-center min-h-[300px] text-center" : "p-4 md:p-6"}>
            {pending.length === 0 ? (
              <div className="text-muted-foreground text-sm flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 text-muted-foreground/30 mb-4" />
                <p className="font-medium text-foreground mb-1">No pending requests</p>
                <p>You&apos;re all caught up!</p>
              </div>
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
                      className="bg-card rounded-xl border border-border shadow-sm hover:shadow hover:border-amber-500/50 p-4 cursor-pointer transition-all duration-200"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 shrink-0 bg-amber-500/10 rounded-full flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-amber-500" />
                          </div>
                          <div>
                            <span className="font-semibold text-foreground block leading-tight">
                              {user.name}
                            </span>
                            <span className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {dept ? dept.name : "N/A"}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/80 hover:text-muted-foreground">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
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
                            <div className="bg-muted/50 border border-border/50 mt-4 rounded-lg p-4">
                              <div className="space-y-2 text-sm text-muted-foreground">
                                <p className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-muted-foreground/80" /> {user.email}
                                </p>
                              </div>
                              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                                <Button
                                  size="sm"
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium"
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    handleAccept(user.id);
                                  }}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="flex-1 bg-destructive/10 text-destructive hover:bg-destructive/10 border border-destructive/20 font-medium"
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    handleDecline(user.id);
                                  }}
                                >
                                  <XCircle className="w-4 h-4 mr-1.5" /> Decline
                                </Button>
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
