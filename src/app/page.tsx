"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";

export default function DashboardHome() {
  const activeProjects = useQuery(api.projects.getActive);
  const stalledProjects = useQuery(api.projects.getStalled);
  const overdueAdmin = useQuery(api.admin.getOverdue);
  const needsReview = useQuery(api.inboxLog.getNeedingReview);
  const peopleWithFollowUps = useQuery(api.people.getWithFollowUps);
  const todayAdmin = useQuery(api.admin.getDueToday, { today: Date.now() });

  const isLoading = activeProjects === undefined || stalledProjects === undefined;

  return (
    <DashboardLayout
      title="Dashboard"
      description="Your personal knowledge management overview"
    >
      <div className="grid gap-6
                      lg:grid-cols-2">
        {/* Top Actions Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6
                        dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900
                         dark:text-zinc-100">
            Top Actions
          </h2>
          <p className="mt-1 text-sm text-zinc-500
                        dark:text-zinc-400">
            Focus on these today
          </p>
          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                ))}
              </div>
            ) : (
              <>
                {activeProjects?.slice(0, 3).map((project) => (
                  <div
                    key={project._id}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 p-3
                               dark:bg-zinc-900"
                  >
                    <div>
                      <p className="font-medium text-zinc-900
                                    dark:text-zinc-100">
                        {project.name}
                      </p>
                      <p className="text-sm text-zinc-500
                                    dark:text-zinc-400">
                        {project.nextAction}
                      </p>
                    </div>
                    <StatusBadge status={project.status} type="project" />
                  </div>
                ))}
                {activeProjects?.length === 0 && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No active projects. Capture something new!
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Due Today Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6
                        dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900
                         dark:text-zinc-100">
            Due Today
          </h2>
          <p className="mt-1 text-sm text-zinc-500
                        dark:text-zinc-400">
            Admin tasks needing attention
          </p>
          <div className="mt-4 space-y-3">
            {todayAdmin === undefined ? (
              <div className="animate-pulse space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                ))}
              </div>
            ) : todayAdmin.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Nothing due today
              </p>
            ) : (
              todayAdmin.map((task) => (
                <div
                  key={task._id}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 p-3
                             dark:bg-zinc-900"
                >
                  <p className="font-medium text-zinc-900
                                dark:text-zinc-100">
                    {task.task}
                  </p>
                  <StatusBadge status={task.status} type="admin" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Needs Review Alert */}
        {needsReview && needsReview.length > 0 && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-6
                          dark:border-orange-900/50 dark:bg-orange-900/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100
                              dark:bg-orange-900/50">
                <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                  {needsReview.length} item{needsReview.length > 1 ? "s" : ""} need review
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Low confidence classifications waiting for your input
                </p>
              </div>
            </div>
            <Link
              href="/review"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors
                         hover:bg-orange-700"
            >
              Review now
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        {/* Stalled Projects Alert */}
        {stalledProjects && stalledProjects.length > 0 && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6
                          dark:border-yellow-900/50 dark:bg-yellow-900/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100
                              dark:bg-yellow-900/50">
                <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  {stalledProjects.length} stalled project{stalledProjects.length > 1 ? "s" : ""}
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Not updated in 7+ days
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {stalledProjects.slice(0, 3).map((project) => (
                <div
                  key={project._id}
                  className="rounded-lg bg-yellow-100/50 px-3 py-2 text-sm
                             dark:bg-yellow-900/30"
                >
                  <span className="font-medium text-yellow-900 dark:text-yellow-100">
                    {project.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overdue Admin Alert */}
        {overdueAdmin && overdueAdmin.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6
                          dark:border-red-900/50 dark:bg-red-900/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100
                              dark:bg-red-900/50">
                <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">
                  {overdueAdmin.length} overdue task{overdueAdmin.length > 1 ? "s" : ""}
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Past due date
                </p>
              </div>
            </div>
            <Link
              href="/admin"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors
                         hover:bg-red-700"
            >
              View admin tasks
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        {/* People Follow-ups Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6
                        dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900
                         dark:text-zinc-100">
            People Follow-ups
          </h2>
          <p className="mt-1 text-sm text-zinc-500
                        dark:text-zinc-400">
            People with pending follow-ups
          </p>
          <div className="mt-4 space-y-3">
            {peopleWithFollowUps === undefined ? (
              <div className="animate-pulse space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                ))}
              </div>
            ) : peopleWithFollowUps.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No pending follow-ups
              </p>
            ) : (
              peopleWithFollowUps.slice(0, 5).map((person) => (
                <div
                  key={person._id}
                  className="rounded-lg bg-zinc-50 p-3
                             dark:bg-zinc-900"
                >
                  <p className="font-medium text-zinc-900
                                dark:text-zinc-100">
                    {person.name}
                  </p>
                  <ul className="mt-1 space-y-1">
                    {person.followUps.slice(0, 2).map((followUp, i) => (
                      <li
                        key={i}
                        className="text-sm text-zinc-500
                                   dark:text-zinc-400"
                      >
                        • {followUp}
                      </li>
                    ))}
                    {person.followUps.length > 2 && (
                      <li className="text-sm text-zinc-400 dark:text-zinc-500">
                        +{person.followUps.length - 2} more
                      </li>
                    )}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
