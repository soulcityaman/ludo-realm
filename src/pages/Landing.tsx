/**
 * Landing Page — premium Claymorphism-styled Ludo game entry point.
 * Create or join a room to play. Uses Convex for room management.
 */
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COLOR_HEX, TWO_PLAYER_COLORS, PLAYER_NAMES, type PlayerColor } from "@/lib/game/constants";
import type { Id } from "@/convex/_generated/dataModel";

interface LandingProps {
  onRoomCreated: (roomId: Id<"rooms">, code: string, playerNames: Record<PlayerColor, string>, isHost: boolean) => void;
}

/** Mini decorative Ludo board for the hero section */
function MiniBoard() {
  return (
    <div className="w-24 h-24 rounded-3xl overflow-hidden relative"
      style={{
        boxShadow: "0 8px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5)",
        backgroundColor: "#F5F0E8",
      }}
    >
      <div className="absolute inset-0 grid grid-cols-5 grid-rows-5">
        <div className="col-span-2 row-span-2 rounded-tl-2xl" style={{ backgroundColor: COLOR_HEX.red.light }} />
        <div className="col-span-1" />
        <div className="col-span-2 row-span-2 rounded-tr-2xl" style={{ backgroundColor: COLOR_HEX.green.light }} />
        <div className="col-span-1" />
        <div className="col-span-1 flex items-center justify-center" style={{ backgroundColor: COLOR_HEX.red.track }} />
        <div className="col-span-1" />
        <div className="col-span-1 flex items-center justify-center" style={{ backgroundColor: COLOR_HEX.green.track }} />
        <div className="col-span-1" />
        <div className="col-span-1" />
        <div className="col-span-1 flex items-center justify-center" style={{ backgroundColor: COLOR_HEX.yellow.track }} />
        <div className="col-span-1 flex items-center justify-center bg-amber-300">
          <span className="text-[8px]">⭐</span>
        </div>
        <div className="col-span-1 flex items-center justify-center" style={{ backgroundColor: COLOR_HEX.blue.track }} />
        <div className="col-span-1" />
        <div className="col-span-2 row-span-2 rounded-bl-2xl" style={{ backgroundColor: COLOR_HEX.yellow.light }} />
        <div className="col-span-1" />
        <div className="col-span-2 row-span-2 rounded-br-2xl" style={{ backgroundColor: COLOR_HEX.blue.light }} />
      </div>
    </div>
  );
}

/** Animated dice for hero */
function HeroDice() {
  return (
    <motion.div
      animate={{ rotate: [0, 10, -10, 5, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center"
      style={{
        boxShadow: "0 8px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
    >
      <div className="grid grid-cols-3 gap-[3px] w-9 h-9">
        <div className="flex justify-start items-start">
          <div className="w-2 h-2 rounded-full bg-stone-700" />
        </div>
        <div />
        <div className="flex justify-end items-start">
          <div className="w-2 h-2 rounded-full bg-stone-700" />
        </div>
        <div className="flex justify-start items-center">
          <div className="w-2 h-2 rounded-full bg-stone-700" />
        </div>
        <div className="flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-stone-700" />
        </div>
        <div className="flex justify-end items-center">
          <div className="w-2 h-2 rounded-full bg-stone-700" />
        </div>
        <div className="flex justify-start items-end">
          <div className="w-2 h-2 rounded-full bg-stone-700" />
        </div>
        <div />
        <div className="flex justify-end items-end">
          <div className="w-2 h-2 rounded-full bg-stone-700" />
        </div>
      </div>
    </motion.div>
  );
}

export default function Landing({ onRoomCreated }: LandingProps) {
  const [view, setView] = useState<"home" | "create" | "join">("home");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [selectedColor, setSelectedColor] = useState<PlayerColor>("red");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createRoom = useMutation(api.rooms.create);
  const joinRoom = useMutation(api.rooms.join);

  // Check for room code in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get("room");
    if (roomCode) {
      setCode(roomCode.toUpperCase());
      setView("join");
      // Clear the URL param
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const hostId = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const result = await createRoom({
        hostId,
        hostName: name.trim(),
        hostColor: selectedColor,
      });

      if (result) {
        const playerNames: Record<PlayerColor, string> = {
          red: "Player 1",
          green: "Player 2",
          yellow: "Player 3",
          blue: "Player 4",
        };
        playerNames[selectedColor] = name.trim();
        onRoomCreated(result.roomId, result.code, playerNames, true);
      }
    } catch (err) {
      setError("Failed to create room. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [name, selectedColor, createRoom, onRoomCreated]);

  const handleJoin = useCallback(async () => {
    if (!name.trim() || !code.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const guestId = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const result = await joinRoom({
        code: code.trim().toUpperCase(),
        guestId,
        guestName: name.trim(),
        guestColor: selectedColor,
      });

      if (result && "error" in result && result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result && "roomId" in result && result.roomId && result.code) {
        const roomId = result.roomId as Id<"rooms">;
        const joinCode = result.code as string;
        const hostColor = TWO_PLAYER_COLORS.find((c) => c !== selectedColor) ?? "red";
        const playerNames: Record<PlayerColor, string> = {
          red: "Player 1",
          green: "Player 2",
          yellow: "Player 3",
          blue: "Player 4",
        };
        playerNames[selectedColor] = name.trim();
        playerNames[hostColor] = "Host";
        onRoomCreated(roomId, joinCode, playerNames, false);
      }
    } catch (err) {
      setError("Failed to join room. Check the code and try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [name, code, selectedColor, joinRoom, onRoomCreated]);

  const availableColors = TWO_PLAYER_COLORS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-64 h-64 rounded-full opacity-[0.07]"
          style={{ backgroundColor: COLOR_HEX.red.base }}
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-10 w-80 h-80 rounded-full opacity-[0.07]"
          style={{ backgroundColor: COLOR_HEX.blue.base }}
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, 15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full opacity-[0.05]"
          style={{ backgroundColor: COLOR_HEX.yellow.base }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <AnimatePresence mode="wait">
          {view === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center gap-8 w-full"
            >
              {/* Hero */}
              <div className="flex flex-col items-center gap-5">
                <div className="flex items-center gap-3">
                  <HeroDice />
                  <MiniBoard />
                </div>

                <div className="text-center">
                  <h1 className="text-5xl font-black tracking-tight text-stone-800 mb-2">
                    Ludo
                  </h1>
                  <p className="text-stone-500 text-sm">
                    The classic board game, now online
                  </p>
                </div>
              </div>

              {/* Player avatars */}
              <div className="flex items-center gap-2">
                {TWO_PLAYER_COLORS.map((c, i) => (
                  <motion.div
                    key={c}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-bold"
                    style={{
                      backgroundColor: COLOR_HEX[c].base,
                      boxShadow: `0 4px 12px ${COLOR_HEX[c].base}40`,
                    }}
                  >
                    {PLAYER_NAMES[c].charAt(0)}
                  </motion.div>
                ))}
              </div>

              {/* CTA buttons */}
              <div className="w-full flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setView("create")}
                  className="w-full py-4 rounded-3xl text-white font-bold text-lg transition-all"
                  style={{
                    backgroundColor: COLOR_HEX.red.base,
                    boxShadow: `0 8px 24px ${COLOR_HEX.red.base}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
                  }}
                >
                  ✨ Create Room
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setView("join")}
                  className="w-full py-4 rounded-3xl font-bold text-lg transition-all bg-white text-stone-700"
                  style={{
                    boxShadow: "0 6px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
                  }}
                >
                  🔗 Join Room
                </motion.button>
              </div>

              <p className="text-xs text-stone-400 text-center max-w-[240px]">
                Share a room code with a friend to play together. 2 players, 4 tokens each.
              </p>
            </motion.div>
          )}

          {/* Create Room */}
          {view === "create" && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <button
                onClick={() => { setView("home"); setError(null); }}
                className="text-sm text-stone-500 hover:text-stone-700 mb-6 font-medium"
              >
                ← Back
              </button>

              <div
                className="w-full rounded-[2rem] p-6"
                style={{
                  backgroundColor: "rgba(255,255,255,0.85)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
                }}
              >
                <h2 className="text-2xl font-bold text-stone-800 mb-1">Create Room</h2>
                <p className="text-sm text-stone-500 mb-6">
                  Set up a private room for you and a friend.
                </p>

                {/* Error */}
                {error && (
                  <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                {/* Name */}
                <label className="block text-xs font-semibold text-stone-600 mb-2 uppercase tracking-wider">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800 text-sm font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-red-300 mb-5"
                />

                {/* Color selection */}
                <label className="block text-xs font-semibold text-stone-600 mb-2 uppercase tracking-wider">
                  Your Color
                </label>
                <div className="flex gap-3 mb-6">
                  {availableColors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`flex-1 py-3 rounded-2xl font-semibold text-sm transition-all ${
                        selectedColor === c ? "text-white" : "text-stone-600"
                      }`}
                      style={{
                        backgroundColor: selectedColor === c ? COLOR_HEX[c].base : COLOR_HEX[c].track,
                        boxShadow:
                          selectedColor === c
                            ? `0 4px 16px ${COLOR_HEX[c].base}40`
                            : "none",
                        border: `2px solid ${selectedColor === c ? COLOR_HEX[c].dark : "transparent"}`,
                      }}
                    >
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>

                <motion.button
                  whileHover={name.trim() ? { scale: 1.02 } : {}}
                  whileTap={name.trim() ? { scale: 0.98 } : {}}
                  onClick={handleCreate}
                  disabled={!name.trim() || loading}
                  className={`w-full py-4 rounded-3xl text-white font-bold text-lg transition-all ${
                    name.trim() && !loading ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
                  }`}
                  style={{
                    backgroundColor: COLOR_HEX[selectedColor].base,
                    boxShadow: name.trim()
                      ? `0 8px 24px ${COLOR_HEX[selectedColor].base}40`
                      : "none",
                  }}
                >
                  {loading ? "Creating..." : "🎮 Create Room"}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Join Room */}
          {view === "join" && (
            <motion.div
              key="join"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <button
                onClick={() => { setView("home"); setError(null); }}
                className="text-sm text-stone-500 hover:text-stone-700 mb-6 font-medium"
              >
                ← Back
              </button>

              <div
                className="w-full rounded-[2rem] p-6"
                style={{
                  backgroundColor: "rgba(255,255,255,0.85)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
                }}
              >
                <h2 className="text-2xl font-bold text-stone-800 mb-1">Join Room</h2>
                <p className="text-sm text-stone-500 mb-6">
                  Enter a room code from your friend.
                </p>

                {/* Error */}
                {error && (
                  <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                {/* Name */}
                <label className="block text-xs font-semibold text-stone-600 mb-2 uppercase tracking-wider">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800 text-sm font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-300 mb-5"
                />

                {/* Room code */}
                <label className="block text-xs font-semibold text-stone-600 mb-2 uppercase tracking-wider">
                  Room Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="LUDO-XXXX"
                  maxLength={9}
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800 text-sm font-medium font-mono tracking-widest placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-300 mb-5"
                />

                {/* Color selection */}
                <label className="block text-xs font-semibold text-stone-600 mb-2 uppercase tracking-wider">
                  Your Color
                </label>
                <div className="flex gap-3 mb-6">
                  {availableColors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`flex-1 py-3 rounded-2xl font-semibold text-sm transition-all ${
                        selectedColor === c ? "text-white" : "text-stone-600"
                      }`}
                      style={{
                        backgroundColor: selectedColor === c ? COLOR_HEX[c].base : COLOR_HEX[c].track,
                        boxShadow:
                          selectedColor === c
                            ? `0 4px 16px ${COLOR_HEX[c].base}40`
                            : "none",
                        border: `2px solid ${selectedColor === c ? COLOR_HEX[c].dark : "transparent"}`,
                      }}
                    >
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>

                <motion.button
                  whileHover={name.trim() && code.trim() ? { scale: 1.02 } : {}}
                  whileTap={name.trim() && code.trim() ? { scale: 0.98 } : {}}
                  onClick={handleJoin}
                  disabled={!name.trim() || !code.trim() || loading}
                  className={`w-full py-4 rounded-3xl text-white font-bold text-lg transition-all ${
                    name.trim() && code.trim() && !loading
                      ? "cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  style={{
                    backgroundColor: COLOR_HEX[selectedColor].base,
                    boxShadow:
                      name.trim() && code.trim()
                        ? `0 8px 24px ${COLOR_HEX[selectedColor].base}40`
                        : "none",
                  }}
                >
                  {loading ? "Joining..." : "🚀 Join Room"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
