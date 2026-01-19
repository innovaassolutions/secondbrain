"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Id } from "../../../convex/_generated/dataModel";

export default function PeoplePage() {
  const [searchQuery, setSearchQuery] = useState("");

  const people = useQuery(api.people.list);
  const updatePerson = useMutation(api.people.update);
  const removePerson = useMutation(api.people.remove);

  const filteredPeople = people?.filter((person) =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.context.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleRemoveFollowUp = async (personId: Id<"people">, followUpIndex: number, currentFollowUps: string[]) => {
    const newFollowUps = currentFollowUps.filter((_, i) => i !== followUpIndex);
    await updatePerson({ id: personId, followUps: newFollowUps });
  };

  const handleDelete = async (personId: Id<"people">) => {
    if (confirm("Are you sure you want to delete this person?")) {
      await removePerson({ id: personId });
    }
  };

  return (
    <DashboardLayout
      title="People"
      description="Connections and contacts"
    >
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search people..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm
                     placeholder:text-zinc-400
                     focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-100
                     dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500
                     dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
        />
      </div>

      {/* People List */}
      <div className="grid gap-4
                      md:grid-cols-2
                      lg:grid-cols-3">
        {people === undefined ? (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-zinc-200 bg-white p-6
                           dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="h-6 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-2 h-4 w-48 rounded bg-zinc-100 dark:bg-zinc-900" />
              </div>
            ))}
          </>
        ) : filteredPeople?.length === 0 ? (
          <div className="col-span-full py-8 text-center text-zinc-500
                          dark:text-zinc-400">
            No people found
          </div>
        ) : (
          filteredPeople?.map((person) => (
            <div
              key={person._id}
              className="rounded-xl border border-zinc-200 bg-white p-6
                         dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900
                                 dark:text-zinc-100">
                    {person.name}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500
                                dark:text-zinc-400">
                    {person.context || "No context"}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(person._id)}
                  className="rounded p-1 text-zinc-400 transition-colors
                             hover:bg-zinc-100 hover:text-zinc-600
                             dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Follow-ups */}
              {person.followUps.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500
                                dark:text-zinc-400">
                    Follow-ups
                  </p>
                  <ul className="mt-2 space-y-2">
                    {person.followUps.map((followUp, i) => (
                      <li
                        key={i}
                        className="group flex items-start gap-2"
                      >
                        <input
                          type="checkbox"
                          onChange={() => handleRemoveFollowUp(person._id, i, person.followUps)}
                          className="mt-1 h-4 w-4 rounded border-zinc-300
                                     dark:border-zinc-600"
                        />
                        <span className="text-sm text-zinc-600
                                         dark:text-zinc-400">
                          {followUp}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {person.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1">
                  {person.tags.map((tag, i) => (
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

              {/* Last touched */}
              <p className="mt-4 text-xs text-zinc-400
                            dark:text-zinc-500">
                Last touched: {formatDate(person.lastTouched)}
              </p>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
