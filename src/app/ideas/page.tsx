"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Id } from "../../../convex/_generated/dataModel";

export default function IdeasPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const ideas = useQuery(api.ideas.list);
  const removeIdea = useMutation(api.ideas.remove);

  // Get all unique tags
  const allTags = Array.from(
    new Set(ideas?.flatMap((idea) => idea.tags) || [])
  ).sort();

  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredIdeas = ideas?.filter((idea) => {
    if (searchQuery && !idea.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !idea.oneLiner.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedTag && !idea.tags.includes(selectedTag)) {
      return false;
    }
    return true;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDelete = async (ideaId: Id<"ideas">) => {
    if (confirm("Are you sure you want to delete this idea?")) {
      await removeIdea({ id: ideaId });
    }
  };

  return (
    <DashboardLayout
      title="Ideas"
      description="Concepts and insights worth saving"
    >
      {/* Search and Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Search ideas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm
                     placeholder:text-zinc-400
                     focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100
                     dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500
                     dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
        />
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors
                         ${selectedTag === null
                           ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                           : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                         }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors
                           ${selectedTag === tag
                             ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                             : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                           }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ideas Grid */}
      <div className="grid gap-4
                      md:grid-cols-2
                      lg:grid-cols-3">
        {ideas === undefined ? (
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-zinc-200 bg-white p-6
                           dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="h-6 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-2 h-4 w-full rounded bg-zinc-100 dark:bg-zinc-900" />
              </div>
            ))}
          </>
        ) : filteredIdeas?.length === 0 ? (
          <div className="col-span-full py-8 text-center text-zinc-500
                          dark:text-zinc-400">
            No ideas found
          </div>
        ) : (
          filteredIdeas?.map((idea) => (
            <div
              key={idea._id}
              className="group relative rounded-xl border border-zinc-200 bg-white p-6 transition-shadow
                         hover:shadow-md
                         dark:border-zinc-800 dark:bg-zinc-950"
            >
              <button
                onClick={() => handleDelete(idea._id)}
                className="absolute right-4 top-4 rounded p-1 text-zinc-400 opacity-0 transition-all
                           hover:bg-zinc-100 hover:text-zinc-600
                           group-hover:opacity-100
                           dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 text-lg
                                dark:bg-purple-900/30">
                  💡
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-zinc-900
                                 dark:text-zinc-100">
                    {idea.title}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600
                                dark:text-zinc-400">
                    {idea.oneLiner}
                  </p>
                </div>
              </div>

              {/* Expandable Notes */}
              {idea.notes && (
                <div className="mt-4">
                  <button
                    onClick={() => setExpandedId(expandedId === idea._id ? null : idea._id)}
                    className="flex items-center gap-1 text-xs text-zinc-500 transition-colors
                               hover:text-zinc-700
                               dark:text-zinc-400 dark:hover:text-zinc-300"
                  >
                    <svg
                      className={`h-3 w-3 transition-transform ${expandedId === idea._id ? "rotate-90" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {expandedId === idea._id ? "Hide notes" : "Show notes"}
                  </button>
                  {expandedId === idea._id && (
                    <p className="mt-2 whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600
                                  dark:bg-zinc-900 dark:text-zinc-400">
                      {idea.notes}
                    </p>
                  )}
                </div>
              )}

              {/* Tags */}
              {idea.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1">
                  {idea.tags.map((tag, i) => (
                    <span
                      key={i}
                      onClick={() => setSelectedTag(tag)}
                      className="cursor-pointer rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700 transition-colors
                                 hover:bg-purple-200
                                 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-4 text-xs text-zinc-400
                            dark:text-zinc-500">
                {formatDate(idea.createdAt)}
              </p>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
