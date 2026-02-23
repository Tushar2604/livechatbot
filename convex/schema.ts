import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.string(),
    isOnline: v.boolean(),
    lastSeen: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  conversations: defineTable({
    isGroup: v.boolean(),
    groupName: v.optional(v.string()),
    participants: v.array(v.id("users")),
    lastMessageTime: v.optional(v.number()),
  }).index("by_participants", ["participants"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    messageType: v.optional(v.union(v.literal("text"), v.literal("image"))),
    imageId: v.optional(v.id("_storage")),
    isDeleted: v.boolean(),
    reactions: v.optional(
      v.object({
        thumbsUp: v.array(v.id("users")),
        heart: v.array(v.id("users")),
        laugh: v.array(v.id("users")),
        wow: v.array(v.id("users")),
        sad: v.array(v.id("users")),
      })
    ),
  })
    .index("by_conversationId", ["conversationId"]),

  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    expiresAt: v.number(),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_conversationId_userId", ["conversationId", "userId"]),

  readStatus: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    lastReadTime: v.number(),
  })
    .index("by_conversationId_userId", ["conversationId", "userId"])
    .index("by_userId", ["userId"]),
});
