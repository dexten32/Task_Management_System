"use client";

import React, { useEffect, useState } from "react";
import API_BASE_URL from "@/lib/api";
import { format } from "date-fns";
import { Clock, Search, Folder, Calendar } from "lucide-react";
import ClientTaskDetail from "@/components/ClientTaskDetail";
import { TaskStatus, TASK_STATUS_CONFIG } from "@/lib/taskStatus";
import {
  SelectField,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: string;
  readableId?: number;
  title: string;
  description: string;
  deadline: string;
  status: TaskStatus;
  assignedBy: { id: string; name: string };
  priority: { id: string; name: string; color: string; code: string };
  createdAt: string;
  assignees?: { id: string; name: string; department?: { name?: string } }[];
  assignedTo?: { id: string; name: string };
}

export default function PreviousTasksSection() {
  const [previousTasks, setPreviousTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [priorities, setPriorities] = useState<{ id: number; name: string }[]>(
    [],
  );

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
        setPriorities(data.priorities || []);
      } catch (err) {
        console.error("Error fetching priorities:", err);
      }
    };

    fetchPriorities();
  }, []);

  useEffect(() => {
    const fetchPreviousTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const res = await fetch(`${API_BASE_URL}/api/tasks/previous`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch previous tasks");

        const data = await res.json();
        const tasksArray = Array.isArray(data)
          ? data
          : Array.isArray(data?.tasks)
            ? data.tasks
            : [];

        setPreviousTasks(tasksArray);
      } catch (err) {
        console.error("Error fetching previous tasks:", err);
        setError("Unable to load previous tasks. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPreviousTasks();
  }, []);

  const filteredTasks = previousTasks.filter((task) => {
    // STRICTLY EXCLUDE ACTIVE TASKS
    if (task.status === "ACTIVE") return false;

    // Filter by Priority
    const priorityMatch =
      selectedPriority === "All" || task.priority?.name === selectedPriority;

    // Filter by Status
    const statusMatch =
      selectedStatus === "All" || task.status === selectedStatus;

    // Filter by Search Query
    const searchMatch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.readableId && `TSK-0${task.readableId}`.toLowerCase().includes(searchQuery.toLowerCase()));

    return priorityMatch && statusMatch && searchMatch;
  });

  // Group by date
  const groupedTasks = filteredTasks.reduce(
    (groups, task) => {
      const date = task.createdAt
        ? new Date(task.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
        : "Unknown Date";
      if (!groups[date]) groups[date] = [];
      groups[date].push(task);
      return groups;
    },
    {} as Record<string, Task[]>,
  );

  const sortedDates = Object.keys(groupedTasks).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/50 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Task History</h2>
          <p className="text-muted-foreground mt-1">Review all your previous completed or delayed milestones in tabular layout.</p>
        </div>
      </div>

      {/* Modern Filter controls */}
      <Card className="p-4 border border-border/80 shadow-sm bg-card/60 backdrop-blur-md rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Title, ID, Description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/80 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority:</span>
            <SelectField
              value={selectedPriority}
              onValueChange={setSelectedPriority}
            >
              <SelectTrigger className="w-[150px] bg-background border-border">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Priorities</SelectItem>
                {priorities.map((priority) => (
                  <SelectItem key={priority.id} value={priority.name}>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          priority.name === 'High' ? 'bg-red-500' :
                          priority.name === 'Medium' ? 'bg-amber-500' :
                          priority.name === 'Low' ? 'bg-emerald-500' : 'bg-gray-400'
                        }`}
                      />
                      {priority.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectField>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status:</span>
            <SelectField
              value={selectedStatus}
              onValueChange={setSelectedStatus}
            >
              <SelectTrigger className="w-[150px] bg-background border-border">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="COMPLETED">
                  <span className="text-emerald-500 font-medium">Completed</span>
                </SelectItem>
                <SelectItem value="DELAYED">
                  <span className="text-amber-500 font-medium">Delayed</span>
                </SelectItem>
              </SelectContent>
            </SelectField>
          </div>
        </div>
      </Card>

      {/* Loading & Error States */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground font-medium">Loading history tracks...</p>
        </div>
      )}
      {error && (
        <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-xl flex items-center gap-3 text-destructive">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Table Container */}
      {!loading && !error && (
        <div className="rounded-xl shadow-lg bg-card/60 backdrop-blur-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground font-semibold text-xs w-[80px]">ID</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-xs min-w-[200px]">Task Name</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-xs">Assignees</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-xs">Department</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-xs">Deadline</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-xs text-right">Status</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-xs text-right">Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDates.length > 0 ? (
                sortedDates.map((date) => (
                  <React.Fragment key={date}>
                    {/* Date Section Header Row */}
                    <TableRow className="bg-muted/10 hover:bg-muted/10 border-border/50">
                      <TableCell colSpan={7} className="font-semibold text-zinc-400 py-3 text-xs uppercase tracking-wider">
                        {date}
                      </TableCell>
                    </TableRow>
                    {groupedTasks[date].map((task) => (
                      <TableRow 
                        key={task.id} 
                        className="cursor-pointer border-b border-border/50 hover:bg-muted/30 group transition-colors"
                        onClick={() => setSelectedTaskId(task.id)}
                      >
                        <TableCell className="py-4">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted/60 border border-border/40 px-2 py-1 rounded">
                            TSK-0{task.readableId}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                            {task.title}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-1 mt-1 font-medium">
                            {task.description}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
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
                        <TableCell className="py-4">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                            <Folder className="w-4 h-4 text-indigo-500" />
                            <span>{task.assignees?.[0]?.department?.name || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{format(new Date(task.deadline), "dd MMM yyyy, hh:mm a")}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <Badge className={`border-none shadow-none font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 ${
                            task.status === "COMPLETED" 
                              ? "bg-emerald-500/10 text-emerald-500" 
                              : "bg-amber-500/10 text-amber-500"
                          }`}>
                            {task.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          {task.priority && (
                            <Badge 
                              style={{ backgroundColor: task.priority.color, color: "#ffffff" }}
                              className="border-none shadow-none font-bold text-[9px] uppercase tracking-wider px-2 py-0.5"
                            >
                              {task.priority.name}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground font-medium">
                    No task history records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal */}
      {selectedTaskId && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedTaskId(null)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl border border-border w-[95%] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTaskId(null)}
              className="absolute top-4 right-4 z-50 bg-secondary/80 hover:bg-destructive/10 text-muted-foreground hover:text-destructive w-7 h-7 rounded-full flex items-center justify-center transition-colors"
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

function Loader2({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
