"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Id } from "../../../convex/_generated/dataModel";
import { useState } from "react";

type Destination = "people" | "projects" | "ideas" | "admin";

export default function ReviewPage() {
  const [processing, setProcessing] = useState<string | null>(null);

  const needsReview = useQuery(api.inboxLog.getNeedingReview);
  const markAsDeleted = useMutation(api.inboxLog.markAsDeleted);
  const markAsCorrected = useMutation(api.inboxLog.markAsCorrected);

  // Create mutations for each table
  const createPerson = useMutation(api.people.create);
  const createProject = useMutation(api.projects.create);
  const createIdea = useMutation(api.ideas.create);
  const createAdmin = useMutation(api.admin.create);
  const updateRecordId = useMutation(api.inboxLog.updateRecordId);

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

  const handleApprove = async (log: typeof needsReview extends (infer T)[] | undefined ? T : never) => {
    if (!log) return;
    setProcessing(log._id);

    try {
      // Create record in the suggested destination
      let recordId: string | undefined;
      const destination = log.destination as Destination;

      if (destination === "people") {
        recordId = await createPerson({
          name: log.recordTitle,
          context: log.originalText,
        });
      } else if (destination === "projects") {
        recordId = await createProject({
          name: log.recordTitle,
          nextAction: "Define next action",
          notes: log.originalText,
        });
      } else if (destination === "ideas") {
        recordId = await createIdea({
          title: log.recordTitle,
          oneLiner: log.originalText.substring(0, 100),
          notes: log.originalText,
        });
      } else if (destination === "admin") {
        recordId = await createAdmin({
          task: log.recordTitle,
          notes: log.originalText,
        });
      }

      // Update inbox log
      await updateRecordId({
        id: log._id,
        recordId: recordId || "",
        newDestination: destination,
        recordTitle: log.recordTitle,
      });
    } catch (error) {
      console.error("Error approving:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleReclassify = async (logId: Id<"inboxLog">, originalText: string, newDestination: Destination) => {
    setProcessing(logId);

    try {
      // Create record in new destination
      let recordId: string | undefined;
      let title = originalText.substring(0, 50);

      if (newDestination === "people") {
        recordId = await createPerson({
          name: title,
          context: originalText,
        });
      } else if (newDestination === "projects") {
        recordId = await createProject({
          name: title,
          nextAction: "Define next action",
          notes: originalText,
        });
      } else if (newDestination === "ideas") {
        recordId = await createIdea({
          title: title,
          oneLiner: originalText.substring(0, 100),
          notes: originalText,
        });
      } else if (newDestination === "admin") {
        recordId = await createAdmin({
          task: title,
          notes: originalText,
        });
      }

      // Update inbox log
      await updateRecordId({
        id: logId,
        recordId: recordId || "",
        newDestination,
        recordTitle: title,
      });
    } catch (error) {
      console.error("Error reclassifying:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (logId: Id<"inboxLog">) => {
    setProcessing(logId);
    try {
      await markAsDeleted({ id: logId });
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <DashboardLayout
      title="Review Queue"
      description="Items needing your input"
    >
      {needsReview === undefined ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-zinc-200 bg-white p-6
                         dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="h-6 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-2 h-16 w-full rounded bg-zinc-100 dark:bg-zinc-900" />
            </div>
          ))}
        </div>
      ) : needsReview.length === 0 ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center
                        dark:border-green-900/50 dark:bg-green-900/20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100
                          dark:bg-green-900/50">
            <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-green-900 dark:text-green-100">
            All caught up!
          </h3>
          <p className="mt-1 text-sm text-green-700 dark:text-green-300">
            No items need review right now.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {needsReview.map((log) => (
            <div
              key={log._id}
              className="rounded-xl border border-orange-200 bg-white p-6
                         dark:border-orange-900/50 dark:bg-zinc-950"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getDestinationIcon(log.destination)}</span>
                    <div>
                      <p className="font-semibold text-zinc-900
                                    dark:text-zinc-100">
                        {log.recordTitle}
                      </p>
                      <p className="text-xs text-zinc-500
                                    dark:text-zinc-400">
                        Suggested: {log.destination} • {Math.round(log.confidence * 100)}% confidence • {formatDate(log.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg bg-zinc-50 p-4
                                  dark:bg-zinc-900">
                    <p className="text-sm text-zinc-600
                                  dark:text-zinc-400">
                      {log.originalText}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleApprove(log)}
                  disabled={processing === log._id}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors
                             hover:bg-green-700
                             disabled:opacity-50"
                >
                  {processing === log._id ? (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Approve as {log.destination}
                </button>

                <div className="flex items-center gap-1">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">or file as:</span>
                  {(["people", "projects", "ideas", "admin"] as const)
                    .filter((d) => d !== log.destination)
                    .map((dest) => (
                      <button
                        key={dest}
                        onClick={() => handleReclassify(log._id, log.originalText, dest)}
                        disabled={processing === log._id}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm transition-colors
                                   hover:bg-zinc-50
                                   disabled:opacity-50
                                   dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                      >
                        {getDestinationIcon(dest)} {dest}
                      </button>
                    ))}
                </div>

                <button
                  onClick={() => handleDelete(log._id)}
                  disabled={processing === log._id}
                  className="ml-auto rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition-colors
                             hover:bg-red-50
                             disabled:opacity-50
                             dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
