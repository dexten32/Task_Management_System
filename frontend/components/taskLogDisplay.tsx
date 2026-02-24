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
      <h2 className="text-lg font-semibold mb-4 text-slate-800 flex items-center gap-2">
        Task Logs
        <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          {task.logs.length}
        </span>
      </h2>

      {/* Log Input Area */}
      {canAddLogs && (
        <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="relative">
            <textarea
              value={logDescription}
              onChange={(e) => setLogDescription(e.target.value)}
              placeholder="Add a progress update or note..."
              className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-sm"
              rows={3}
            ></textarea>
            <div className="flex justify-end mt-2">
              <button
                onClick={handleAddLog}
                disabled={addingLog || !logDescription.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
        {task.logs.length > 0 && <div className="absolute left-2.5 top-2 bottom-2 w-px bg-slate-200"></div>}

        {task.logs.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <p className="text-slate-500 text-sm">No activity logs recorded yet.</p>
          </div>
        ) : (
          [...task.logs]
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
                  {/* Dot on Timeline */}
                  <div className={`absolute left-1 mt-1.5 w-3 h-3 rounded-full border-2 ${isOnTime ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'} z-10`}></div>

                  <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm group-hover:border-slate-200 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          {log.user?.name || "System"}
                          {log.user?.role && (
                            <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm border border-slate-200 tracking-wider">
                              {log.user.role}
                            </span>
                          )}
                        </span>
                        <span
                          className={`font-mono text-[10px] font-semibold ${isOnTime ? "text-green-600" : "text-red-600"}`}
                        >
                          {logTime.toLocaleDateString()}{" "}
                          {logTime.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
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
