"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import API_BASE_URL from "@/lib/api";
import { Loader2, CheckCircle, Clock, AlertTriangle, ListTodo } from "lucide-react";
import { TaskStatus, TASK_STATUS_CONFIG } from "@/lib/taskStatus";
import ClientTaskDetail from "@/components/ClientTaskDetail";
import { format } from "date-fns";
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
  priority: { code: string; name: string; color: string };
  assignedBy?: { id: string; name: string };
  assignedTo?: { id: string; name: string };
  createdAt: string;
}

export default function EmployeeDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/tasks/my-tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const data = await response.json();
      setTasks(Array.isArray(data) ? data : (data && Array.isArray(data.tasks) ? data.tasks : []));
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleComplete = async (taskId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const task = tasks.find((t) => t.id === taskId);
      if (!task) throw new Error("Task not found.");

      const now = new Date();
      const deadline = new Date(task.deadline);
      const newStatus = now < deadline ? "COMPLETED" : "DELAYED";

      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update task status.");
      }

      await fetchTasks();
    } catch (err: unknown) {
      console.error("Error updating task status:", err);
    }
  };

  // Calculate KPIs
  const totalTasks = tasks.length;
  const activeTasks = tasks
    .filter(
      (t) =>
        t.status === TASK_STATUS_CONFIG.PENDING.label ||
        t.status === TASK_STATUS_CONFIG.ACTIVE.label,
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const delayedTasks = tasks
    .filter((t) => t.status === TASK_STATUS_CONFIG.DELAYED.label)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const completedTasks = tasks.filter(
    (t) => t.status === TASK_STATUS_CONFIG.COMPLETED.label,
  );

  // Multi-slice donut calculations
  const chartData = [
    { label: "Active", value: activeTasks.length, color: "#6366f1" },
    { label: "Completed", value: completedTasks.length, color: "#10b981" },
    { label: "Delayed", value: delayedTasks.length, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  const totalChartValue = chartData.reduce((acc, curr) => acc + curr.value, 0);
  let cumulativePercent = 0;

  if (loading && tasks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-destructive min-h-[400px] font-medium">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent p-6 rounded-2xl border border-indigo-500/15">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Welcome to your Workspace</h2>
          <p className="text-muted-foreground mt-1">Here is a summary of your targets and task completion telemetry.</p>
        </div>
        <div className="bg-background border border-border px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground flex items-center gap-2 shadow-sm">
          <Clock className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
          {format(new Date(), "EEEE, d MMMM yyyy")}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Allocated Tasks"
          value={totalTasks}
          subtitle="All assigned milestones"
          icon={<ListTodo className="h-4 w-4 text-indigo-500" />}
          gradient="from-indigo-500/10 to-indigo-500/2"
          borderColor="border-indigo-500/15 hover:border-indigo-500/30"
        />
        <KPICard
          title="Active Progress"
          value={activeTasks.length}
          subtitle="Tasks pending completion"
          icon={<Clock className="h-4 w-4 text-emerald-500" />}
          gradient="from-emerald-500/10 to-emerald-500/2"
          borderColor="border-emerald-500/15 hover:border-emerald-500/30"
        />
        <KPICard
          title="Delayed Tasks"
          value={delayedTasks.length}
          subtitle="Overdue action items"
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          gradient="from-destructive/10 to-destructive/2"
          borderColor="border-destructive/15 hover:border-destructive/30"
        />
      </div>

      {/* Main Sections (Balanced 70/30 Split Row) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        
        {/* Left 70% column: Recent Tasks Table */}
        <div className="lg:col-span-7">
          <Card className="border border-border/80 shadow-sm overflow-hidden bg-card/60 backdrop-blur-md rounded-2xl">
            <div className="border-b border-border/50 p-6">
              <h2 className="text-xl font-bold tracking-tight">Recent Tasks</h2>
            </div>
            <CardContent className="p-0">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="w-[45%] text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-6">Task</TableHead>
                    <TableHead className="w-[20%] text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned By</TableHead>
                    <TableHead className="w-[18%] text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deadline</TableHead>
                    <TableHead className="w-[9%] text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Priority</TableHead>
                    <TableHead className="w-[8%] text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.length > 0 ? (
                    tasks.slice(0, 6).map((task) => (
                      <TableRow 
                        key={task.id} 
                        className="cursor-pointer hover:bg-muted/30 border-none transition-colors"
                        onClick={() => setSelectedTaskId(task.id)}
                      >
                        <TableCell className="py-4 border-none pl-6">
                          <div className="font-semibold text-foreground leading-snug truncate max-w-[280px]">
                            TSK-0{task.readableId} • {task.title}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-1 mt-1 font-medium truncate max-w-[280px]">
                            {task.description}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 border-none">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[10px] bg-indigo-500/10 text-indigo-500 font-bold">
                                {task.assignedBy?.name?.substring(0, 2).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-muted-foreground truncate max-w-[110px]">
                              {task.assignedBy?.name || "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 border-none text-sm font-medium text-muted-foreground whitespace-nowrap">
                          {task.deadline ? format(new Date(task.deadline), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell className="py-4 border-none text-right">
                          {task.priority && (
                            <Badge 
                              style={{ backgroundColor: task.priority.color, color: "#ffffff" }}
                              className="border-none shadow-none font-bold text-[9px] uppercase tracking-wider px-2 py-0.5"
                            >
                              {task.priority.name}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-4 border-none text-right pr-6" onClick={(e) => e.stopPropagation()}>
                          {(task.status === "ACTIVE" || task.status === "PENDING") ? (
                            <button
                              onClick={() => handleComplete(task.id)}
                              className="inline-flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm hover:shadow transition-all duration-200 hover:scale-105"
                            >
                              Done
                            </button>
                          ) : (
                            <Badge className={`border-none shadow-none font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 whitespace-nowrap ${
                              task.status === "COMPLETED" 
                                ? "bg-emerald-500/10 text-emerald-500" 
                                : "bg-amber-500/10 text-amber-500"
                            }`}>
                              {task.status}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="border-none">
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-medium border-none">
                        No tasks found in workspace.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right 30% column: Tasks Analytics (Admin Donut Chart) */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border border-border shadow-sm bg-card backdrop-blur-md rounded-2xl">
            <div className="p-6 border-b border-border/50">
              <h3 className="text-md font-bold tracking-tight text-foreground">Tasks Analytics</h3>
            </div>
            <CardContent className="pt-6 pb-6">
              <div className="flex justify-center items-center">
                {totalChartValue === 0 ? (
                  <div className="h-36 w-36 rounded-full border-4 border-muted flex items-center justify-center text-xs text-muted-foreground font-medium">
                    No Data
                  </div>
                ) : (
                  <div className="relative w-40 h-40">
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
                      <span className="text-3xl font-bold tracking-tight text-foreground">{totalChartValue}</span>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">Total</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-8 flex flex-col gap-3">
                {[
                  { label: "Active", value: activeTasks.length, color: "#6366f1" },
                  { label: "Completed", value: completedTasks.length, color: "#10b981" },
                  { label: "Delayed", value: delayedTasks.length, color: "#f59e0b" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-semibold text-muted-foreground">{item.label}</span>
                    </div>
                    <span className="text-xs font-bold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Task Detail Modal */}
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

function KPICard({
  title,
  value,
  subtitle,
  icon,
  gradient,
  borderColor,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  borderColor: string;
}) {
  return (
    <Card
      className={`relative overflow-hidden bg-card border ${borderColor} p-6 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md group cursor-pointer`}
    >
      <div className={`absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-gradient-to-br ${gradient} opacity-30 -z-10 group-hover:scale-110 transition-transform duration-500`} />
      
      {/* Header with Title and Icon quietly in top right */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
        <div className="text-muted-foreground/80 shrink-0">
          {icon}
        </div>
      </div>

      {/* Main Metric Value and Subtitle stacked cleanly below */}
      <div className="space-y-1">
        <p className="text-3xl font-extrabold tracking-tight text-foreground">{value}</p>
        <p className="text-[11px] text-muted-foreground font-medium">{subtitle}</p>
      </div>
    </Card>
  );
}
