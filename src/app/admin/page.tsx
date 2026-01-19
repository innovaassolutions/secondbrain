"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Id } from "../../../convex/_generated/dataModel";

type StatusFilter = "all" | "pending" | "done";

export default function AdminPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");

  const tasks = useQuery(api.admin.list);
  const overdueAdmin = useQuery(api.admin.getOverdue);
  const markDone = useMutation(api.admin.markDone);
  const updateTask = useMutation(api.admin.update);
  const removeTask = useMutation(api.admin.remove);

  const overdueIds = new Set(overdueAdmin?.map((t) => t._id) || []);
  const now = Date.now();

  const filteredTasks = tasks?.filter((task) => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    return true;
  });

  // Sort by due date (overdue first, then by due date ascending)
  const sortedTasks = filteredTasks?.sort((a, b) => {
    // Overdue items first
    const aOverdue = overdueIds.has(a._id);
    const bOverdue = overdueIds.has(b._id);
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;

    // Then by due date
    if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return b.createdAt - a.createdAt;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysUntilDue = (dueDate: number) => {
    const days = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `Due in ${days} days`;
  };

  const handleMarkDone = async (taskId: Id<"admin">) => {
    await markDone({ id: taskId });
  };

  const handleMarkPending = async (taskId: Id<"admin">) => {
    await updateTask({ id: taskId, status: "pending" });
  };

  const handleDelete = async (taskId: Id<"admin">) => {
    if (confirm("Are you sure you want to delete this task?")) {
      await removeTask({ id: taskId });
    }
  };

  return (
    <DashboardLayout
      title="Admin Tasks"
      description="Errands, appointments, and logistics"
    >
      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {(["pending", "done", "all"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors
                       ${statusFilter === status
                         ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                         : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                       }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks === undefined ? (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-zinc-200 bg-white p-4
                           dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-2 h-4 w-24 rounded bg-zinc-100 dark:bg-zinc-900" />
              </div>
            ))}
          </>
        ) : sortedTasks?.length === 0 ? (
          <div className="py-8 text-center text-zinc-500
                          dark:text-zinc-400">
            {statusFilter === "pending" ? "No pending tasks" : "No tasks found"}
          </div>
        ) : (
          sortedTasks?.map((task) => (
            <div
              key={task._id}
              className={`rounded-xl border bg-white p-4
                         dark:bg-zinc-950
                         ${overdueIds.has(task._id)
                           ? "border-red-300 bg-red-50/50 dark:border-red-900 dark:bg-red-900/10"
                           : "border-zinc-200 dark:border-zinc-800"
                         }
                         ${task.status === "done" ? "opacity-60" : ""}`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => task.status === "pending" ? handleMarkDone(task._id) : handleMarkPending(task._id)}
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors
                             ${task.status === "done"
                               ? "border-green-500 bg-green-500 text-white"
                               : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-600 dark:hover:border-zinc-500"
                             }`}
                >
                  {task.status === "done" && (
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Content */}
                <div className="flex-1">
                  <p className={`font-medium
                                ${task.status === "done"
                                  ? "text-zinc-500 line-through dark:text-zinc-500"
                                  : "text-zinc-900 dark:text-zinc-100"
                                }`}>
                    {task.task}
                  </p>
                  {task.notes && (
                    <p className="mt-1 text-sm text-zinc-500
                                  dark:text-zinc-400">
                      {task.notes}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    {task.dueDate && (
                      <span className={`text-xs font-medium
                                       ${overdueIds.has(task._id)
                                         ? "text-red-600 dark:text-red-400"
                                         : "text-zinc-500 dark:text-zinc-400"
                                       }`}>
                        {getDaysUntilDue(task.dueDate)}
                      </span>
                    )}
                    <StatusBadge status={task.status} type="admin" />
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => handleDelete(task._id)}
                  className="rounded p-1 text-zinc-400 transition-colors
                             hover:bg-zinc-100 hover:text-zinc-600
                             dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
