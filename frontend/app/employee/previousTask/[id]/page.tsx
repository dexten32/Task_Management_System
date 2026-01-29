// frontend/app/employee/previousTask/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import TaskDetailComponent from "../../../../components/taskDetailComponent"; // Import the shared component
import API_BASE_URL from "@/lib/api";

import { TaskStatus } from "@/lib/taskStatus";

type Task = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: TaskStatus;
  logs: {
    id: string;
    description: string;
    createdAt: string;
  }[];
  priority?: { code: string; name: string; color: string };
};

export default function PreviousTaskDetailPage() {
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
        const taskRes = await fetch(
          `${API_BASE_URL}/api/tasks/${taskId}`, // Still fetches from the same API endpoint
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (taskRes.ok) {
          const taskData = await taskRes.json();
          // Ensure logs is always an array (even if missing from API)

          // Make sure to access taskData.task if your backend nests it
          setTask(taskData.task || taskData); // Adjust based on your API's actual response structure
        } else {
          const errorText = await taskRes.text();
          console.error(
            "API Fetch Error (Previous Task Detail):",
            taskRes.status,
            errorText
          );
          setError(`Failed to fetch task: ${taskRes.status} ${errorText}`);
        }
      } catch (err) {
        console.error("Network Error (Previous Task Detail):", err);
        setError("Network error or server unavailable.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [taskId, token]);

  if (loading) return <p className="text-white p-4">Loading task details...</p>;
  if (error) return <p className="text-red-500 p-4">Error: {error}</p>;
  if (!task) return <p className="text-white p-4">Task not found.</p>;

  // Render the shared component, passing the fetched task and token
  return <TaskDetailComponent initialTask={task} token={token} />;
}
