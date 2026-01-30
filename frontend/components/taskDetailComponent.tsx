/* eslint-disable @typescript-eslint/no-unused-vars, react/jsx-no-comment-textnodes */
"use client";

import React, { useState, useEffect } from "react";
import TaskLogDisplay from "./taskLogDisplay";
import API_BASE_URL from "@/lib/api";
import { TaskStatus, TASK_STATUS_CONFIG } from "@/lib/taskStatus";

type Log = {
  id: string;
  description: string;
  createdAt: string;
};

type Task = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: TaskStatus;
  priority: { code: string; name: string; color: string };
  logs: Log[];
};

interface TaskDetailComponentProps {
  initialTask: Task;
  token: string | null;
}

export default function TaskDetailComponent({
  initialTask,
  token,
}: TaskDetailComponentProps) {
  const [task, setTask] = useState<Task>(initialTask);

  useEffect(() => {
    setTask(initialTask);
  }, [initialTask]);

  const handleLogAdded = (newLog: Log) => {
    setTask((prevTask) => {
      if (!prevTask) return prevTask;
      return {
        ...prevTask,
        logs: [newLog, ...prevTask.logs],
      };
    });
  };

  const handleMarkAsComplete = async () => {
    if (!task || !token) return;

    const now = new Date();
    const deadline = new Date(task.deadline);
    const newStatus: TaskStatus = now < deadline ? "COMPLETED" : "DELAYED";

    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${task.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setTask((prev) => (prev ? { ...prev, status: newStatus } : prev));
        handleLogAdded({
          id: Date.now().toString(),
          description: `Task status changed to ${newStatus}.`,
          createdAt: new Date().toISOString(),
        });
      } else {
        const errorData = await res.json();
        alert(`Failed to update task status: ${errorData.message || "Error"}`);
      }
    } catch {
      alert("Network error. Could not update task status.");
    }
  };

  const canModifyTask = task.status === "ACTIVE" || task.status === "PENDING";

  const showCompletedOrDelayedMessage =
    task.status === "COMPLETED" || task.status === "DELAYED";

  return (
    <div className="bg-white rounded-2xl w-full max-h-[90vh] overflow-hidden flex flex-col font-sans">
      {/* Header - Fixed */}
      <div className="relative px-8 py-6 flex-shrink-0  border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${TASK_STATUS_CONFIG[task.status].colorClass} border border-current/10`}
            >
              {TASK_STATUS_CONFIG[task.status].label}
            </span>
            {task.priority && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: task.priority.color,
                  }}
                />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {task.priority.name}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
            <svg
              className="w-3.5 h-3.5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              ></path>
            </svg>
            {new Date(task.deadline).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight leading-tight">
          {task.title}
        </h1>

        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          {task.description}
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 bg-white custom-scrollbar">
        <TaskLogDisplay task={task} onLogAdded={handleLogAdded} token={token} />
      </div>

      {/* Footer - Fixed */}
      <div className="px-8 py-5 border-t border-slate-100 flex-shrink-0">
        {showCompletedOrDelayedMessage && (
          <div className="flex items-center justify-center gap-2 py-1">
            <svg
              className="w-5 h-5 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span className="text-slate-600 text-sm font-medium">
              Task marked as{" "}
              <span className="font-bold text-slate-800">
                {task.status.toLowerCase()}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
