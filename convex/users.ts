import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const store = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const existing = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                name: identity.name ?? "Anonymous",
                email: identity.email ?? "",
                imageUrl: identity.pictureUrl ?? "",
                isOnline: true,
                lastSeen: Date.now(),
            });
            return existing._id;
        }

        const userId = await ctx.db.insert("users", {
            clerkId: identity.subject,
            name: identity.name ?? "Anonymous",
            email: identity.email ?? "",
            imageUrl: identity.pictureUrl ?? "",
            isOnline: true,
            lastSeen: Date.now(),
        });

        return userId;
    },
});

export const get = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
    },
});

export const getAll = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const allUsers = await ctx.db.query("users").collect();
        return allUsers.filter((u) => u.clerkId !== identity.subject);
    },
});

export const search = query({
    args: { query: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const allUsers = await ctx.db.query("users").collect();
        const lowerQuery = args.query.toLowerCase();
        return allUsers.filter(
            (u) =>
                u.clerkId !== identity.subject &&
                u.name.toLowerCase().includes(lowerQuery)
        );
    },
});

export const setOnline = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (user) {
            await ctx.db.patch(user._id, { isOnline: true, lastSeen: Date.now() });
        }
    },
});

export const setOffline = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (user) {
            await ctx.db.patch(user._id, { isOnline: false, lastSeen: Date.now() });
        }
    },
});

export const getById = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userId);
    },
});
