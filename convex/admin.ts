import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    task: v.string(),
    dueDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("admin", {
      task: args.task,
      dueDate: args.dueDate,
      status: "pending",
      notes: args.notes ?? "",
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("admin"),
    task: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    status: v.optional(v.union(v.literal("pending"), v.literal("done"))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    return await ctx.db.patch(id, filteredUpdates);
  },
});

export const markDone = mutation({
  args: { id: v.id("admin") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, { status: "done" });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("admin").order("desc").collect();
  },
});

export const getPending = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("admin").collect();
    return tasks.filter((t) => t.status === "pending");
  },
});

export const getDueToday = query({
  args: { today: v.number() },
  handler: async (ctx, args) => {
    const startOfDay = new Date(args.today).setHours(0, 0, 0, 0);
    const endOfDay = new Date(args.today).setHours(23, 59, 59, 999);
    const tasks = await ctx.db.query("admin").collect();
    return tasks.filter(
      (t) =>
        t.status === "pending" &&
        t.dueDate &&
        t.dueDate >= startOfDay &&
        t.dueDate <= endOfDay
    );
  },
});

export const get = query({
  args: { id: v.id("admin") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const remove = mutation({
  args: { id: v.id("admin") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getOverdue = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const tasks = await ctx.db.query("admin").collect();
    return tasks.filter(
      (t) => t.status === "pending" && t.dueDate && t.dueDate < now
    );
  },
});
