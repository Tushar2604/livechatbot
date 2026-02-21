import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createOrGet = mutation({
    args: { participantId: v.id("users") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) throw new Error("User not found");

        const allConversations = await ctx.db.query("conversations").collect();
        const existing = allConversations.find(
            (c) =>
                !c.isGroup &&
                c.participants.length === 2 &&
                c.participants.includes(currentUser._id) &&
                c.participants.includes(args.participantId)
        );

        if (existing) return existing._id;

        const conversationId = await ctx.db.insert("conversations", {
            isGroup: false,
            participants: [currentUser._id, args.participantId],
            lastMessageTime: Date.now(),
        });

        return conversationId;
    },
});

export const list = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) return [];

        const allConversations = await ctx.db.query("conversations").collect();
        const myConversations = allConversations.filter((c) =>
            c.participants.includes(currentUser._id)
        );

        const results = [];
        for (const conv of myConversations) {
            const messages = await ctx.db
                .query("messages")
                .withIndex("by_conversationId", (q) =>
                    q.eq("conversationId", conv._id)
                )
                .order("desc")
                .take(1);

            const lastMessage = messages[0] || null;

            const otherParticipants = [];
            for (const pId of conv.participants) {
                if (pId !== currentUser._id) {
                    const user = await ctx.db.get(pId);
                    if (user) otherParticipants.push(user);
                }
            }

            const readStatus = await ctx.db
                .query("readStatus")
                .withIndex("by_conversationId_userId", (q) =>
                    q.eq("conversationId", conv._id).eq("userId", currentUser._id)
                )
                .unique();

            let unreadCount = 0;
            if (readStatus) {
                const unreadMessages = await ctx.db
                    .query("messages")
                    .withIndex("by_conversationId", (q) =>
                        q.eq("conversationId", conv._id)
                    )
                    .collect();
                unreadCount = unreadMessages.filter(
                    (m) =>
                        m._creationTime > readStatus.lastReadTime &&
                        m.senderId !== currentUser._id
                ).length;
            } else {
                const allMessages = await ctx.db
                    .query("messages")
                    .withIndex("by_conversationId", (q) =>
                        q.eq("conversationId", conv._id)
                    )
                    .collect();
                unreadCount = allMessages.filter(
                    (m) => m.senderId !== currentUser._id
                ).length;
            }

            results.push({
                ...conv,
                lastMessage,
                otherParticipants,
                unreadCount,
            });
        }

        results.sort((a, b) => {
            const aTime =
                a.lastMessage?._creationTime ?? a.lastMessageTime ?? a._creationTime;
            const bTime =
                b.lastMessage?._creationTime ?? b.lastMessageTime ?? b._creationTime;
            return bTime - aTime;
        });

        return results;
    },
});

export const get = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) return null;

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) return null;
        if (!conversation.participants.includes(currentUser._id)) return null;

        const participants = [];
        for (const pId of conversation.participants) {
            const user = await ctx.db.get(pId);
            if (user) participants.push(user);
        }

        return {
            ...conversation,
            participantDetails: participants,
        };
    },
});

export const createGroup = mutation({
    args: {
        name: v.string(),
        participantIds: v.array(v.id("users")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) throw new Error("User not found");

        const allParticipants = [currentUser._id, ...args.participantIds];

        const conversationId = await ctx.db.insert("conversations", {
            isGroup: true,
            groupName: args.name,
            participants: allParticipants,
            lastMessageTime: Date.now(),
        });

        return conversationId;
    },
});

export const markRead = mutation({
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
            .query("readStatus")
            .withIndex("by_conversationId_userId", (q) =>
                q.eq("conversationId", args.conversationId).eq("userId", currentUser._id)
            )
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { lastReadTime: Date.now() });
        } else {
            await ctx.db.insert("readStatus", {
                conversationId: args.conversationId,
                userId: currentUser._id,
                lastReadTime: Date.now(),
            });
        }
    },
});
