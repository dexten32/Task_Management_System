"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { mockEmployeeTasks } from "@/lib/MockEmployeeTasks";

interface Task {
  id: number;
  title: string;
  due: string;
  status: "recent" | "delayed";
}

const typedMockEmployeeTasks: Task[] = mockEmployeeTasks as Task[];

export default function EmployeeDashboard() {
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [delayedTasks, setDelayedTasks] = useState<Task[]>([]);

  useEffect(() => {
    const recent = typedMockEmployeeTasks.filter(
      (task) => task.status === "recent"
    );
    const delayed = typedMockEmployeeTasks.filter(
      (task) => task.status === "delayed"
    );
    setRecentTasks(recent);
    setDelayedTasks(delayed);
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Employee Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          {/* Recent Tasks Section */}
          <div className="w-full">
            <h2 className="text-lg md:text-xl font-medium mb-3 text-gray-900 dark:text-white">
              Recent Tasks
            </h2>
            {recentTasks.length > 0 ? (
              <ul className="space-y-3">
                {recentTasks.map((task) => (
                  <li
                    key={task.id}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <p className="text-sm md:text-base font-medium text-gray-900 dark:text-slate-100">
                      {task.title}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Due: {task.due}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No recent tasks
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Delayed Tasks Section */}
          <div className="w-full">
            <h2 className="text-lg md:text-xl font-medium mb-3 text-gray-900 dark:text-white">
              Delayed Tasks
            </h2>
            {delayedTasks.length > 0 ? (
              <ul className="space-y-3">
                {delayedTasks.map((task) => (
                  <li
                    key={task.id}
                    className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                  >
                    <p className="text-sm md:text-base font-medium text-red-700 dark:text-red-500">
                      {task.title}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Was due: {task.due}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No delayed tasks
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
