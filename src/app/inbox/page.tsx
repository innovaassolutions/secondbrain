"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";

type StatusFilter = "all" | "filed" | "needs_review" | "corrected" | "deleted";
type DestinationFilter = "all" | "people" | "projects" | "ideas" | "admin";

export default function InboxPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [destinationFilter, setDestinationFilter] = useState<DestinationFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const logs = useQuery(api.inboxLog.list);

  const filteredLogs = logs?.filter((log) => {
    if (statusFilter !== "all" && log.status !== statusFilter) return false;
    if (destinationFilter !== "all" && log.destination !== destinationFilter) return false;
    return true;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDestinationIcon = (destination: string) => {
    const icons: Record<string, string> = {
      people: "👥",
      projects: "🚀",
      ideas: "💡",
      admin: "📋",
    };
    return icons[destination] || "📄";
  };

  return (
    <DashboardLayout
      title="Inbox Log"
      description="All captured thoughts and their classifications"
    >
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700
                            dark:text-zinc-300">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm
                       dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="all">All Statuses</option>
            <option value="filed">Filed</option>
            <option value="needs_review">Needs Review</option>
            <option value="corrected">Corrected</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700
                            dark:text-zinc-300">
            Destination
          </label>
          <select
            value={destinationFilter}
            onChange={(e) => setDestinationFilter(e.target.value as DestinationFilter)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm
                       dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="all">All Destinations</option>
            <option value="people">People</option>
            <option value="projects">Projects</option>
            <option value="ideas">Ideas</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Log Table */}
      <div className="rounded-xl border border-zinc-200 bg-white
                      dark:border-zinc-800 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500
                               dark:text-zinc-400">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500
                               dark:text-zinc-400">
                  Destination
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500
                               dark:text-zinc-400">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500
                               dark:text-zinc-400">
                  Confidence
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500
                               dark:text-zinc-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {logs === undefined ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <div className="animate-pulse text-zinc-500">Loading...</div>
                  </td>
                </tr>
              ) : filteredLogs?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500
                                             dark:text-zinc-400">
                    No logs found matching filters
                  </td>
                </tr>
              ) : (
                filteredLogs?.map((log) => (
                  <>
                    <tr
                      key={log._id}
                      onClick={() => setExpandedId(expandedId === log._id ? null : log._id)}
                      className="cursor-pointer border-b border-zinc-100 transition-colors
                                 hover:bg-zinc-50
                                 dark:border-zinc-800 dark:hover:bg-zinc-900"
                    >
                      <td className="px-4 py-3 text-sm text-zinc-600
                                     dark:text-zinc-400">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-sm">
                          {getDestinationIcon(log.destination)} {log.destination}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-zinc-900
                                     dark:text-zinc-100">
                        {log.recordTitle}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-zinc-200
                                          dark:bg-zinc-700">
                            <div
                              className={`h-full rounded-full ${
                                log.confidence >= 0.8
                                  ? "bg-green-500"
                                  : log.confidence >= 0.6
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${log.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-zinc-500
                                           dark:text-zinc-400">
                            {Math.round(log.confidence * 100)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={log.status} type="inbox" />
                      </td>
                    </tr>
                    {expandedId === log._id && (
                      <tr key={`${log._id}-expanded`}>
                        <td colSpan={5} className="bg-zinc-50 px-4 py-4
                                                   dark:bg-zinc-900">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-zinc-700
                                          dark:text-zinc-300">
                              Original Text:
                            </p>
                            <p className="whitespace-pre-wrap rounded-lg bg-white p-3 text-sm text-zinc-600
                                          dark:bg-zinc-800 dark:text-zinc-400">
                              {log.originalText}
                            </p>
                            <p className="text-xs text-zinc-500
                                          dark:text-zinc-500">
                              Slack Message ID: {log.slackMessageId}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
