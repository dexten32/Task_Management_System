// frontend/components/TaskLogDisplay.tsx
"use client";

import API_BASE_URL from "@/lib/api";
import React, { useState } from "react";

// Ensure these types match your Task and Log types defined elsewhere
interface Log {
  id: string;
  description: string;
  createdAt: string;
  user?: { name: string; role?: string };
}

interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: string;
  logs: Log[];
}

interface TaskLogDisplayProps {
  task: Task;
  onLogAdded: (newLog: Log) => void;
  token: string | null;
}

export default function TaskLogDisplay({
  task,
  onLogAdded,
  token,
}: TaskLogDisplayProps) {
  const [logDescription, setLogDescription] = useState("");
  const [addingLog, setAddingLog] = useState(false);

  const canAddLogs =
    task.status.toUpperCase() === "ACTIVE" ||
    task.status.toUpperCase() === "PENDING";

  const handleAddLog = async () => {
    if (!logDescription.trim() || !token) {
      alert("Please enter a log description.");
      return;
    }

    setAddingLog(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: task.id,
          description: logDescription,
        }),
      });

      if (res.ok) {
        const newLog: Log = await res.json();
        onLogAdded(newLog);
        setLogDescription("");

      } else {
        const errorData = await res.json();
        console.error("Failed to add log:", res.status, errorData);
        alert(`Failed to add log: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Network error adding log:", error);
      alert("Network error. Could not add log.");
    } finally {
      setAddingLog(false);
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-4 text-card-foreground flex items-center gap-2">
        Task Logs
        <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {(task.logs || []).length}
        </span>
      </h2>

      {/* Log Input Area */}
      {canAddLogs && (
        <div className="mb-6 bg-muted/50 p-4 rounded-xl border border-border">
          <div className="relative">
            <textarea
              value={logDescription}
              onChange={(e) => setLogDescription(e.target.value)}
              placeholder="Add a progress update or note..."
              className="w-full p-3 bg-card border border-border rounded-lg text-foreground/80 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-sm"
              rows={3}
            ></textarea>
            <div className="flex justify-end mt-2">
              <button
                onClick={handleAddLog}
                disabled={addingLog || !logDescription.trim()}
                className="bg-primary hover:bg-primary/90 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {addingLog ? "Adding..." : "Add Log"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Display Area */}
      <div className="space-y-0 relative">
        {/* Vertical Line for Timeline */}
        {(task.logs || []).length > 0 && <div className="absolute left-2.5 top-2 bottom-2 w-px bg-muted"></div>}

        {(task.logs || []).length === 0 ? (
          <div className="text-center py-8 bg-muted/50 rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground text-sm">No activity logs recorded yet.</p>
          </div>
        ) : (
          [...(task.logs || [])]
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
            .map((log) => {
              const logTime = new Date(log.createdAt);
              const deadlineTime = new Date(task.deadline);
              const isOnTime = logTime.getTime() <= deadlineTime.getTime();

              return (
                <div
                  key={log.id}
                  className="relative pl-8 pb-6 last:pb-0 group"
                >
                  <div className={`absolute left-1 mt-1.5 w-3 h-3 rounded-full border-2 ${isOnTime ? 'border-emerald-600 dark:border-emerald-400 bg-emerald-600/10 dark:bg-emerald-400/10' : 'border-red-600 dark:border-red-400 bg-red-600/10 dark:bg-red-400/10'} z-10`}></div>

                  <div className="bg-card rounded-lg p-3 border border-border shadow-sm group-hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          {log.user?.name || "System"}
                          {log.user?.role && (
                            <span className="text-[9px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm border border-border tracking-wider">
                              {log.user.role}
                            </span>
                          )}
                        </span>
                        <span
                          className={`font-mono text-[10px] font-semibold ${isOnTime ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                        >
                          {logTime.toLocaleDateString()}{" "}
                          {logTime.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap mt-1">
                      {log.description}
                    </p>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
