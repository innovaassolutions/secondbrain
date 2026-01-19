"use client";

interface StatusBadgeProps {
  status: string;
  type?: "project" | "inbox" | "admin";
}

const statusColors: Record<string, string> = {
  // Project statuses
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  waiting: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  blocked: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  someday: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  done: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
  // Inbox statuses
  filed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  needs_review: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  corrected: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  deleted: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
  // Admin statuses
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

const statusLabels: Record<string, string> = {
  needs_review: "Needs Review",
};

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const colorClass = statusColors[status] || "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400";
  const label = statusLabels[status] || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}
