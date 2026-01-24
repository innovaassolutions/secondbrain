import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("inboxLog", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const markAsCorrected = mutation({
  args: {
    id: v.id("inboxLog"),
    newDestination: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      status: "corrected",
      destination: args.newDestination,
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("inboxLog").order("desc").collect();
  },
});

export const getRecent = query({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - args.days * 24 * 60 * 60 * 1000;
    const logs = await ctx.db.query("inboxLog").order("desc").collect();
    return logs.filter((l) => l.createdAt >= cutoff);
  },
});

export const getNeedingReview = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query("inboxLog").order("desc").collect();
    return logs.filter((l) => l.status === "needs_review");
  },
});

export const getWeeklyActivity = query({
  args: {},
  handler: async (ctx) => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const logs = await ctx.db.query("inboxLog").collect();
    const recentLogs = logs.filter((l) => l.createdAt >= weekAgo);

    return {
      total: recentLogs.length,
      byDestination: {
        people: recentLogs.filter((l) => l.destination === "people").length,
        projects: recentLogs.filter((l) => l.destination === "projects").length,
        ideas: recentLogs.filter((l) => l.destination === "ideas").length,
        admin: recentLogs.filter((l) => l.destination === "admin").length,
        vocabulary: recentLogs.filter((l) => l.destination === "vocabulary").length,
      },
      needsReview: recentLogs.filter((l) => l.status === "needs_review").length,
      corrected: recentLogs.filter((l) => l.status === "corrected").length,
    };
  },
});

export const get = query({
  args: { id: v.id("inboxLog") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByPostId = query({
  args: { slackMessageId: v.string() },
  handler: async (ctx, args) => {
    const logs = await ctx.db.query("inboxLog").collect();
    return logs.find((l) => l.slackMessageId === args.slackMessageId);
  },
});

export const markAsDeleted = mutation({
  args: { id: v.id("inboxLog") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, { status: "deleted" });
  },
});

export const updateRecordId = mutation({
  args: {
    id: v.id("inboxLog"),
    recordId: v.string(),
    newDestination: v.string(),
    recordTitle: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      recordId: args.recordId,
      destination: args.newDestination,
      recordTitle: args.recordTitle,
      status: "corrected",
    });
  },
});
