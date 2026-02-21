import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const send = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) throw new Error("User not found");

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) throw new Error("Conversation not found");
        if (!conversation.participants.includes(currentUser._id)) {
            throw new Error("Not a participant");
        }

        await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: currentUser._id,
            content: args.content,
            isDeleted: false,
        });

        await ctx.db.patch(args.conversationId, {
            lastMessageTime: Date.now(),
        });

        const typingIndicator = await ctx.db
            .query("typingIndicators")
            .withIndex("by_conversationId_userId", (q) =>
                q
                    .eq("conversationId", args.conversationId)
                    .eq("userId", currentUser._id)
            )
            .unique();

        if (typingIndicator) {
            await ctx.db.delete(typingIndicator._id);
        }
    },
});

export const list = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversationId", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .order("asc")
            .collect();

        const messagesWithSender = [];
        for (const msg of messages) {
            const sender = await ctx.db.get(msg.senderId);
            messagesWithSender.push({
                ...msg,
                senderName: sender?.name ?? "Unknown",
                senderImageUrl: sender?.imageUrl ?? "",
            });
        }

        return messagesWithSender;
    },
});

export const remove = mutation({
    args: { messageId: v.id("messages") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) throw new Error("User not found");

        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");
        if (message.senderId !== currentUser._id) {
            throw new Error("Can only delete own messages");
        }

        await ctx.db.patch(args.messageId, { isDeleted: true });
    },
});

export const react = mutation({
    args: {
        messageId: v.id("messages"),
        emoji: v.union(
            v.literal("thumbsUp"),
            v.literal("heart"),
            v.literal("laugh"),
            v.literal("wow"),
            v.literal("sad")
        ),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Not authenticated");

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser) throw new Error("User not found");

        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");

        const defaultReactions = {
            thumbsUp: [] as string[],
            heart: [] as string[],
            laugh: [] as string[],
            wow: [] as string[],
            sad: [] as string[],
        };

        const reactions = message.reactions
            ? { ...defaultReactions, ...message.reactions }
            : defaultReactions;

        const emojiReactions = reactions[args.emoji] as string[];
        const userIndex = emojiReactions.indexOf(currentUser._id);

        if (userIndex > -1) {
            emojiReactions.splice(userIndex, 1);
        } else {
            emojiReactions.push(currentUser._id);
        }

        reactions[args.emoji] = emojiReactions as any;
        await ctx.db.patch(args.messageId, { reactions: reactions as any });
    },
});
