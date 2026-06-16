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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Filter, Folder, Clock } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

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

    const searchMatch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || task.readableId?.toString().includes(searchQuery) || task.description.toLowerCase().includes(searchQuery.toLowerCase());

    return userMatch && priorityMatch && statusMatch && searchMatch;
  });

  return (
    <div className="min-h-screen text-card-foreground p-8 font-sans rounded-xl relative">
      <h1 className="text-3xl font-bold text-foreground mb-8 tracking-tight">
        Tasks Assigned by You
      </h1>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded-lg mb-6 shadow-sm">
          <p>{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tasks..." 
            className="pl-9 bg-card border-border shadow-sm text-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="bg-card shrink-0 text-foreground" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4 mr-2" /> Filters
        </Button>
      </div>

      {showFilters && (
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-card/60 backdrop-blur-md p-4 rounded-xl border border-border shadow-md">
          <div className="flex flex-col">
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Assigned To</label>
            <SelectField value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-full bg-card border-border"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {users.map((u) => (<SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>))}
              </SelectContent>
            </SelectField>
          </div>
          <div className="flex flex-col">
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Status</label>
            <SelectField value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full bg-card border-border"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="DELAYED">Delayed</SelectItem>
              </SelectContent>
            </SelectField>
          </div>
          <div className="flex flex-col">
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Priority</label>
            <SelectField value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-full bg-card border-border"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {priorities.map((p) => (<SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>))}
              </SelectContent>
            </SelectField>
          </div>
        </div>
      )}

      {/* Tasks Section */}
      <div className="space-y-8">
        {loadingTasks ? (
          <p className="text-muted-foreground text-lg">Loading tasks...</p>
        ) : filteredTasks.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-xl shadow-lg bg-card/60 backdrop-blur-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium text-xs w-[80px]">ID</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs min-w-[200px]">Task Name</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs">Assignees</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs">Department</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs">Deadline</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs text-right">Status</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs text-right">Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(
                    [...filteredTasks]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .reduce((groups: Record<string, typeof filteredTasks>, task) => {
                        const date = new Date(task.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                        if (!groups[date]) groups[date] = [];
                        groups[date].push(task);
                        return groups;
                      }, {})
                  ).map(([date, tasks]) => (
                    <React.Fragment key={date}>
                      <TableRow className="bg-muted/10 hover:bg-muted/10 border-border/50">
                        <TableCell colSpan={7} className="font-semibold text-zinc-400 py-3 text-xs uppercase tracking-wider">
                          {date}
                        </TableCell>
                      </TableRow>
                      {tasks.map((task) => (
                        <TableRow 
                          key={task.id} 
                          onClick={() => setSelectedTaskId(task.id)}
                          className="cursor-pointer border-b border-border/50 hover:bg-muted/30 group"
                        >
                          <TableCell>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted/50 px-2 py-1 rounded">
                              TSK-0{task.readableId}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                              {task.title}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center -space-x-2">
                              {(task.assignees?.length ? task.assignees : (task.assignedTo ? [task.assignedTo] : [])).slice(0, 3).map((a, i) => (
                                <Avatar key={i} className="h-7 w-7 border-2 border-background">
                                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                                    {a?.name?.substring(0, 2).toUpperCase() || 'NA'}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {(task.assignees?.length ? task.assignees.length > 3 : false) && (
                                <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center z-10">
                                  <span className="text-[10px] font-bold text-muted-foreground">+{task.assignees!.length - 3}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Folder className="w-4 h-4" />
                              <span>{task.department || "N/A"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(task.deadline).toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-none shadow-none font-medium text-[10px] uppercase tracking-wider">
                              {task.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              style={{ backgroundColor: task.priority?.color, color: "#ffffff" }}
                              className="border-none shadow-none font-bold text-[9px] uppercase tracking-wider px-2 py-0.5"
                            >
                              {task.priority?.name || "None"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-6">
              {Object.entries(
                [...filteredTasks]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .reduce((groups: Record<string, typeof filteredTasks>, task) => {
                    const date = new Date(task.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                    if (!groups[date]) groups[date] = [];
                    groups[date].push(task);
                    return groups;
                  }, {})
              ).map(([date, tasks]) => (
                <div key={date} className="space-y-3">
                  <h3 className="font-semibold text-zinc-400 text-xs uppercase tracking-wider pl-1">{date}</h3>
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div 
                        key={task.id} 
                        className="p-4 flex flex-col gap-3 cursor-pointer hover:border-primary/50 transition-colors bg-card/60 backdrop-blur-md shadow-sm border border-border/80 rounded-xl"
                        onClick={() => setSelectedTaskId(task.id)}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted border border-border/40 px-2 py-0.5 rounded">
                                TSK-0{task.readableId}
                              </span>
                              {task.priority && (
                                <Badge 
                                  style={{ backgroundColor: task.priority.color, color: "#ffffff" }}
                                  className="border-none shadow-none font-bold text-[9px] uppercase tracking-wider px-2 py-0.5"
                                >
                                  {task.priority.name}
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-bold text-foreground leading-tight text-sm">{task.title}</h4>
                          </div>
                          <Badge className="bg-primary/10 text-primary border-none shadow-none font-bold text-[9px] uppercase tracking-wider shrink-0 mt-0.5">
                            {task.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1 pt-3 border-t border-border/50">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center -space-x-2">
                              {(task.assignees?.length ? task.assignees : (task.assignedTo ? [task.assignedTo] : [])).slice(0, 3).map((a, i) => (
                                <Avatar key={i} className="h-6 w-6 border-2 border-background">
                                  <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-bold">
                                    {a?.name?.substring(0, 2).toUpperCase() || 'NA'}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                              <Folder className="w-3.5 h-3.5 text-indigo-500" />
                              <span className="truncate max-w-[80px]">{task.department || "N/A"}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{new Date(task.deadline).toLocaleString([], { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-lg text-center py-10">
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
              className="bg-card rounded-2xl shadow-2xl border border-border w-[95%] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedTaskId(null)}
                className="absolute top-4 right-4 z-50 bg-card/ backdrop-blur-sm  text-muted-foreground hover:text-destructive text-lg font-semibold"
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
