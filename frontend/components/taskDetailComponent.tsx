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
    const newStatus: TaskStatus = now < deadline ? "COMPLETE" : "DELAYED";

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
    task.status === "COMPLETE" || task.status === "DELAYED";

  return (
    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header - Fixed */}
      <div className="px-6 py-5 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <span
            className={`text-xs font-semibold tracking-wider uppercase ${
              TASK_STATUS_CONFIG[task.status].colorClass
            }`}
          >
            {TASK_STATUS_CONFIG[task.status].label}
          </span>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <svg
              className="w-3.5 h-3.5"
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

        <h1 className="text-2xl md:text-4xl font-light text-slate-900 mb-2 tracking-tight">
          {task.title}
        </h1>

        <p className="text-slate-600 text-md leading-relaxed">
          {task.description}
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <TaskLogDisplay task={task} onLogAdded={handleLogAdded} token={token} />
      </div>

      {/* Footer - Fixed */}
      <div className="px-6 py-4 border-t border-slate-200 flex-shrink-0">
        {/*{canModifyTask && (
          <button
            onClick={handleMarkAsComplete}
            className="w-full px-6 py-2.5 bg-slate-900 text-white text-sm font-medium tracking-wide hover:bg-slate-800 transition-colors duration-200 rounded"
          >
           Mark as Complete
          </button>
        )}*/}

        {showCompletedOrDelayedMessage && (
          <div className="flex items-center gap-2.5 py-2">
            <svg
              className="w-4 h-4 text-emerald-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span className="text-slate-700 text-sm">
              Task marked as {task.status.toLowerCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
