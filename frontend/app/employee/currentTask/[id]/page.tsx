// frontend/app/employee/currentTask/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import TaskDetailComponent from "../../../../components/taskDetailComponent"; // Import the shared component
import API_BASE_URL from "@/lib/api";

type Log = {
  id: string;
  description: string; // Match the shared Log type used in TaskDetailComponent
  createdAt: string;
  // Add other fields as needed
};

type Task = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: string;
  logs: Log[]; // logs is always defined and matches the expected type
};

export default function CurrentTaskDetailPage() {
  // Renamed for clarity
  const { id } = useParams();
  const taskId = id?.toString();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!taskId || !token) {
      setLoading(false);
      if (!taskId) setError("Task ID is missing.");
      if (!token) setError("Authentication token is missing.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const taskRes = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (taskRes.ok) {
          const taskData = await taskRes.json();
          console.log("--- RAW API Response for Task (Current) ---", taskData);
          console.log("Parsed Task Status (Current):", taskData.status);
          // Ensure logs is always an array
          setTask(taskData);
        } else {
          const errorText = await taskRes.text();
          console.error(
            "API Fetch Error (Current Task Detail):",
            taskRes.status,
            errorText
          );
          setError(`Failed to fetch task: ${taskRes.status} ${errorText}`);
        }
      } catch (err) {
        console.error("Network Error (Current Task Detail):", err);
        setError("Network error or server unavailable.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [taskId, token]);

  // Remove the direct rendering and pass 'task' to the shared component
  if (loading) return <p className="text-white p-4">Loading task details...</p>;
  if (error) return <p className="text-red-500 p-4">Error: {error}</p>;
  if (!task) return <p className="text-white p-4">Task not found.</p>;

  // Render the shared component, passing the fetched task and token
  return <TaskDetailComponent initialTask={task} token={token} />;
}
