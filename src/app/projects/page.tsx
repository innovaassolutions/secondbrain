"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Id } from "../../../convex/_generated/dataModel";

type StatusFilter = "all" | "active" | "waiting" | "blocked" | "someday" | "done";
type ProjectStatus = "active" | "waiting" | "blocked" | "someday" | "done";

export default function ProjectsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const projects = useQuery(api.projects.list);
  const stalledProjects = useQuery(api.projects.getStalled);
  const updateProject = useMutation(api.projects.update);
  const removeProject = useMutation(api.projects.remove);

  const stalledIds = new Set(stalledProjects?.map((p) => p._id) || []);

  const filteredProjects = projects?.filter((project) => {
    if (statusFilter !== "all" && project.status !== statusFilter) return false;
    return true;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleStatusChange = async (projectId: Id<"projects">, newStatus: ProjectStatus) => {
    await updateProject({ id: projectId, status: newStatus });
  };

  const handleDelete = async (projectId: Id<"projects">) => {
    if (confirm("Are you sure you want to delete this project?")) {
      await removeProject({ id: projectId });
    }
  };

  return (
    <DashboardLayout
      title="Projects"
      description="Track your active work and goals"
    >
      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          {(["all", "active", "waiting", "blocked", "someday", "done"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors
                         ${statusFilter === status
                           ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                           : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                         }`}
            >
              {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {projects === undefined ? (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-zinc-200 bg-white p-6
                           dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="h-6 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-2 h-4 w-64 rounded bg-zinc-100 dark:bg-zinc-900" />
              </div>
            ))}
          </>
        ) : filteredProjects?.length === 0 ? (
          <div className="py-8 text-center text-zinc-500
                          dark:text-zinc-400">
            No projects found
          </div>
        ) : (
          filteredProjects?.map((project) => (
            <div
              key={project._id}
              className={`rounded-xl border bg-white p-6
                         dark:bg-zinc-950
                         ${stalledIds.has(project._id)
                           ? "border-yellow-300 dark:border-yellow-800"
                           : "border-zinc-200 dark:border-zinc-800"
                         }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-zinc-900
                                   dark:text-zinc-100">
                      {project.name}
                    </h3>
                    <StatusBadge status={project.status} type="project" />
                    {stalledIds.has(project._id) && (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700
                                       dark:bg-yellow-900/30 dark:text-yellow-400">
                        Stalled
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-zinc-600
                                dark:text-zinc-400">
                    <span className="font-medium">Next action:</span> {project.nextAction}
                  </p>
                  {project.notes && (
                    <p className="mt-2 text-sm text-zinc-500
                                  dark:text-zinc-500">
                      {project.notes}
                    </p>
                  )}
                  {/* Tags */}
                  {project.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {project.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600
                                     dark:bg-zinc-800 dark:text-zinc-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 text-xs text-zinc-400
                                dark:text-zinc-500">
                    Updated: {formatDate(project.updatedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={project.status}
                    onChange={(e) => handleStatusChange(project._id, e.target.value as ProjectStatus)}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm
                               dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="active">Active</option>
                    <option value="waiting">Waiting</option>
                    <option value="blocked">Blocked</option>
                    <option value="someday">Someday</option>
                    <option value="done">Done</option>
                  </select>
                  <button
                    onClick={() => handleDelete(project._id)}
                    className="rounded p-1 text-zinc-400 transition-colors
                               hover:bg-zinc-100 hover:text-zinc-600
                               dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
