import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(
        v.union(v.literal("admin"), v.literal("user"), v.literal("member")),
      ),
    }).index("email", ["email"]),

    // Ludo game rooms
    rooms: defineTable({
      code: v.string(),
      hostId: v.string(),
      hostName: v.string(),
      hostColor: v.string(),
      guestId: v.optional(v.string()),
      guestName: v.optional(v.string()),
      guestColor: v.optional(v.string()),
      gameState: v.optional(v.any()),
      status: v.string(), // "waiting" | "lobby" | "playing" | "finished"
      createdAt: v.number(),
      lastActivity: v.number(),
      winnerColor: v.optional(v.string()),
    }).index("by_code", ["code"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
