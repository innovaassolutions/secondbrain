import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // People Database
  people: defineTable({
    name: v.string(),
    context: v.string(),
    followUps: v.array(v.string()),
    lastTouched: v.number(),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Projects Database
  projects: defineTable({
    name: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("waiting"),
      v.literal("blocked"),
      v.literal("someday"),
      v.literal("done")
    ),
    nextAction: v.string(),
    notes: v.string(),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Ideas Database
  ideas: defineTable({
    title: v.string(),
    oneLiner: v.string(),
    notes: v.string(),
    tags: v.array(v.string()),
    createdAt: v.number(),
  }),

  // Admin Database
  admin: defineTable({
    task: v.string(),
    dueDate: v.optional(v.number()),
    status: v.union(v.literal("pending"), v.literal("done")),
    notes: v.string(),
    createdAt: v.number(),
  }),

  // Vocabulary Database
  vocabulary: defineTable({
    word: v.string(),
    definition: v.string(),
    partOfSpeech: v.optional(v.string()),
    example: v.optional(v.string()),
    source: v.optional(v.string()),
    tags: v.array(v.string()),
    timesShown: v.number(),
    lastShownAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Inbox Log (Audit Trail)
  inboxLog: defineTable({
    originalText: v.string(),
    destination: v.string(),
    recordId: v.optional(v.string()),
    recordTitle: v.string(),
    confidence: v.number(),
    status: v.union(
      v.literal("filed"),
      v.literal("needs_review"),
      v.literal("corrected"),
      v.literal("deleted")
    ),
    slackMessageId: v.string(),
    createdAt: v.number(),
  }),
});
