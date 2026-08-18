import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/** Generate a short room code like LUDO-7XQ2 */
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `LUDO-${code}`;
}

/** Create a new room */
export const create = mutation({
  args: {
    hostId: v.string(),
    hostName: v.string(),
    hostColor: v.string(),
  },
  handler: async (ctx, args) => {
    // Ensure unique code
    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await ctx.db
        .query("rooms")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    const roomId = await ctx.db.insert("rooms", {
      code,
      hostId: args.hostId,
      hostName: args.hostName,
      hostColor: args.hostColor,
      status: "waiting",
      createdAt: Date.now(),
      lastActivity: Date.now(),
    });

    return { roomId, code };
  },
});

/** Join an existing room */
export const join = mutation({
  args: {
    code: v.string(),
    guestId: v.string(),
    guestName: v.string(),
    guestColor: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!room) {
      return { error: "Room not found" };
    }
    if (room.guestId) {
      return { error: "Room is full" };
    }
    if (room.status !== "waiting") {
      return { error: "Game already in progress" };
    }

    await ctx.db.patch(room._id, {
      guestId: args.guestId,
      guestName: args.guestName,
      guestColor: args.guestColor,
      lastActivity: Date.now(),
    });

    return { roomId: room._id, code: room.code };
  },
});

/** Update game state (called after each move) */
export const updateGameState = mutation({
  args: {
    roomId: v.id("rooms"),
    gameState: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, {
      gameState: args.gameState,
      lastActivity: Date.now(),
    });
  },
});

/** Start the game (host clicks start) */
export const startGame = mutation({
  args: {
    roomId: v.id("rooms"),
    initialState: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, {
      status: "playing",
      gameState: args.initialState,
      lastActivity: Date.now(),
    });
  },
});

/** Get room by code */
export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();
  },
});

/** Get room by ID */
export const getById = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.roomId);
  },
});
