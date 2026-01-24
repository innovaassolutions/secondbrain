import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    word: v.string(),
    definition: v.string(),
    partOfSpeech: v.optional(v.string()),
    example: v.string(),
    source: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("vocabulary", {
      word: args.word,
      definition: args.definition,
      partOfSpeech: args.partOfSpeech,
      example: args.example,
      source: args.source,
      tags: args.tags ?? [],
      timesShown: 0,
      lastShownAt: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("vocabulary"),
    word: v.optional(v.string()),
    definition: v.optional(v.string()),
    partOfSpeech: v.optional(v.string()),
    example: v.optional(v.string()),
    source: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    return await ctx.db.patch(id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("vocabulary").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("vocabulary") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const remove = mutation({
  args: { id: v.id("vocabulary") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getRecentCount = query({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - args.days * 24 * 60 * 60 * 1000;
    const words = await ctx.db.query("vocabulary").collect();
    return words.filter((w) => w.createdAt >= cutoff).length;
  },
});

export const getTotalCount = query({
  args: {},
  handler: async (ctx) => {
    const words = await ctx.db.query("vocabulary").collect();
    return words.length;
  },
});

// Get a random word, prioritizing less-shown words
export const getRandomWord = query({
  args: {},
  handler: async (ctx) => {
    const words = await ctx.db.query("vocabulary").collect();
    if (words.length === 0) return null;

    // Weight selection toward words shown fewer times
    // Sort by timesShown ascending, then pick from top half randomly
    const sorted = words.sort((a, b) => a.timesShown - b.timesShown);
    const poolSize = Math.max(1, Math.ceil(sorted.length / 2));
    const pool = sorted.slice(0, poolSize);

    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  },
});

// Mark a word as shown (increment counter and update timestamp)
export const markAsShown = mutation({
  args: { id: v.id("vocabulary") },
  handler: async (ctx, args) => {
    const word = await ctx.db.get(args.id);
    if (!word) return;

    await ctx.db.patch(args.id, {
      timesShown: word.timesShown + 1,
      lastShownAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Search vocabulary by word
export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const words = await ctx.db.query("vocabulary").collect();
    const term = args.searchTerm.toLowerCase();
    return words.filter(
      (w) =>
        w.word.toLowerCase().includes(term) ||
        w.definition.toLowerCase().includes(term)
    );
  },
});
