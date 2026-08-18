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
      status: "lobby",
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
      return { error: "Room not found. Check the code and try again." };
    }
    if (room.guestId) {
      return { error: "Room is full. Only 2 players allowed." };
    }
    if (room.status === "playing") {
      return { error: "Game already in progress." };
    }
    if (room.status === "finished") {
      return { error: "This game has ended. Create a new room." };
    }
    if (room.hostId === args.guestId) {
      return { error: "You can't join your own room!" };
    }

    // Check color conflicts
    if (args.guestColor === room.hostColor) {
      return { error: "That color is taken. Pick another one." };
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

/** Start the game (host only, both players must be in lobby) */
export const startGame = mutation({
  args: {
    roomId: v.id("rooms"),
    initialState: v.any(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return { error: "Room not found" };
    if (room.status !== "lobby") return { error: "Game already started" };
    if (!room.guestId) return { error: "Waiting for opponent to join" };

    await ctx.db.patch(args.roomId, {
      status: "playing",
      gameState: args.initialState,
      lastActivity: Date.now(),
    });

    return { success: true };
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

/** End the game */
export const endGame = mutation({
  args: {
    roomId: v.id("rooms"),
    winnerColor: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, {
      status: "finished",
      winnerColor: args.winnerColor,
      lastActivity: Date.now(),
    });
  },
});

/** Get room by code (reactive query) */
export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();
  },
});

/** Get room by ID (reactive query) */
export const getById = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.roomId);
  },
});

/** Clean up expired rooms (called periodically or manually) */
export const cleanupExpired = mutation({
  args: {},
  handler: async (ctx) => {
    const expiry = Date.now() - 30 * 60 * 1000; // 30 minutes
    const expired = await ctx.db
      .query("rooms")
      .filter((q) => q.lt(q.field("lastActivity"), expiry))
      .collect();

    for (const room of expired) {
      await ctx.db.delete(room._id);
    }

    return { deleted: expired.length };
  },
});
