"use client";

import React, { useState, useEffect } from "react";
import TaskLogDisplay from "./taskLogDisplay";
import API_BASE_URL from "@/lib/api";
import { TaskStatus, TASK_STATUS_CONFIG } from "@/lib/taskStatus";
import TaskAssigneeEditor from "./TaskAssigneeEditor";

type Log = {
  id: string;
  description: string;
  createdAt: string;
};

type Task = {
  id: string;
  readableId?: number;
  title: string;
  description: string;
  deadline: string;
  status: TaskStatus;
  priority?: { code: string; name: string; color: string };
  assignees?: { id: string; name: string }[];
  logs: Log[];
};

interface TaskDetailComponentProps {
  initialTask: Task;
  token: string | null;
}

const decodeJwtToken = (token: string) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export default function TaskDetailComponent({
  initialTask,
  token,
}: TaskDetailComponentProps) {
  const [task, setTask] = useState<Task>(initialTask);
  const [isReactivating, setIsReactivating] = useState(false);
  const [newDeadline, setNewDeadline] = useState(initialTask.deadline);
  const [reactivationLoading, setReactivationLoading] = useState(false);

  const userRole = token ? decodeJwtToken(token)?.role : null;
  const canReactivate = userRole === "ADMIN" || userRole === "MANAGER";

  useEffect(() => {
    setTask(initialTask);
  }, [initialTask]);

  const handleLogAdded = (newLog: Log) => {
    setTask((prevTask) => {
      if (!prevTask) return prevTask;
      return {
        ...prevTask,
        logs: [newLog, ...(prevTask.logs || [])],
      };
    });
  };

  const handleReactivate = async () => {
    if (!task || !token || !newDeadline) return;

    setReactivationLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${task.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "ACTIVE",
          deadline: new Date(newDeadline).toISOString()
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedTaskFromServer = data.task;

        setTask((prev) => {
          if (!prev) return updatedTaskFromServer;
          return {
            ...prev,
            ...updatedTaskFromServer,
            logs: updatedTaskFromServer?.logs || prev.logs || [],
          };
        });

        setIsReactivating(false);
        handleLogAdded({
          id: Date.now().toString(),
          description: `Task reactivated with new deadline: ${new Date(newDeadline).toLocaleString()}.`,
          createdAt: new Date().toISOString(),
        });
      } else {
        const errorData = await res.json();
        alert(`Failed to reactivate task: ${errorData.message || "Error"}`);
      }
    } catch {
      alert("Network error. Could not reactivate task.");
    } finally {
      setReactivationLoading(false);
    }
  };

  // const handleMarkAsComplete = async () => {
  //   if (!task || !token) return;

  //   const now = new Date();
  //   const deadline = new Date(task.deadline);
  //   const newStatus: TaskStatus = now < deadline ? "COMPLETED" : "DELAYED";

  //   try {
  //     const res = await fetch(`${API_BASE_URL}/api/tasks/${task.id}/status`, {
  //       method: "PATCH",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({ status: newStatus }),
  //     });

  //     if (res.ok) {
  //       setTask((prev) => (prev ? { ...prev, status: newStatus } : prev));
  //       handleLogAdded({
  //         id: Date.now().toString(),
  //         description: `Task status changed to ${newStatus}.`,
  //         createdAt: new Date().toISOString(),
  //       });
  //     } else {
  //       const errorData = await res.json();
  //       alert(`Failed to update task status: ${errorData.message || "Error"}`);
  //     }
  //   } catch {
  //     alert("Network error. Could not update task status.");
  //   }
  // };

  // const canModifyTask = task.status === "ACTIVE" || task.status === "PENDING";

  const showCompletedOrDelayedMessage =
    task.status === "COMPLETED" || task.status === "DELAYED";

  return (
    <div className="bg-white rounded-2xl w-full max-h-[90vh] overflow-hidden flex flex-col font-sans">
      {/* Header - Fixed */}
      <div className="relative pl-8 pr-16 py-6 flex-shrink-0  border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${TASK_STATUS_CONFIG[task.status].colorClass} border border-current/10`}
            >
              {TASK_STATUS_CONFIG[task.status].label}
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              {task.readableId ? `CYN-0${task.readableId}` : "N/A"}
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

        <TaskAssigneeEditor
          taskId={task.id}
          currentAssignees={task.assignees || []}
          token={token}
          isActive={task.status === "ACTIVE"}
          onAssigneesUpdated={(newAssignees: { id: string; name: string }[]) =>
            setTask((prev) => ({ ...prev, assignees: newAssignees }))
          }
        />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 bg-white custom-scrollbar">
        <TaskLogDisplay task={task} onLogAdded={handleLogAdded} token={token} />
      </div>

      {/* Footer - Fixed */}
      <div className="px-8 py-5 border-t border-slate-100 flex-shrink-0">
        {showCompletedOrDelayedMessage && !isReactivating && (
          <div className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-center gap-2">
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
            {canReactivate && (
              <button
                onClick={() => setIsReactivating(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors border border-indigo-500 shadow-sm"
              >
                Reactivate Task
              </button>
            )}
          </div>
        )}

        {isReactivating && (
          <div className="flex flex-col gap-4 py-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-800 text-sm font-bold">Set New Deadline</span>
              <button
                onClick={() => setIsReactivating(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-medium"
              >
                Cancel
              </button>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="datetime-local"
                value={newDeadline.slice(0, 16)} // Format for datetime-local input
                onChange={(e) => setNewDeadline(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <button
                onClick={handleReactivate}
                disabled={reactivationLoading}
                className={`bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-2 rounded-lg transition-all shadow-md ${reactivationLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {reactivationLoading ? 'Processing...' : 'Confirm Reactivation'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
