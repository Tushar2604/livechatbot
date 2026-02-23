import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const set = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) return;

        const existing = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversationId_userId", (q) =>
                q
                    .eq("conversationId", args.conversationId)
                    .eq("userId", currentUser._id)
            )
            .unique();

        const expiresAt = Date.now()  ;

        if (existing) {
            await ctx.db.patch(existing._id, { expiresAt });
        } else {
            await ctx.db.insert("typingIndicators", {
                conversationId: args.conversationId,
                userId: currentUser._id,
                expiresAt,
            });
        }
    },
});

export const get = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) return [];

        const indicators = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversationId", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .collect();

        const now = Date.now();
        const activeTypers = [];
        for (const indicator of indicators) {
            if (indicator.userId !== currentUser._id && indicator.expiresAt > now) {
                const user = await ctx.db.get(indicator.userId);
                if (user) {
                    activeTypers.push(user.name);
                }
            }
        }

        return activeTypers;
    },
});

export const clear = mutation({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return;

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) return;

        const existing = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversationId_userId", (q) =>
                q
                    .eq("conversationId", args.conversationId)
                    .eq("userId", currentUser._id)
            )
            .unique();

        if (existing) {
            await ctx.db.delete(existing._id);
        }
    },
});
