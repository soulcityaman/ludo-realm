/**
 * Landing Page — premium Claymorphism + Glassmorphism Ludo game entry point.
 * Create or join a room to play. Uses Convex for room management.
 */
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { COLOR_HEX, TWO_PLAYER_COLORS, PLAYER_NAMES, type PlayerColor } from "@/lib/game/constants";

interface LandingProps {
  onRoomCreated: (roomId: Id<"rooms">, code: string, playerNames: Record<PlayerColor, string>, isHost: boolean) => void;
}

/** Premium decorative Ludo board for the hero section */
function MiniBoard() {
  return (
    <div
      className="w-28 h-28 rounded-3xl overflow-hidden relative"
      style={{
        boxShadow: `
          0 12px 40px rgba(0,0,0,0.12),
          inset 0 2px 0 rgba(255,255,255,0.5),
          0 0 0 1px rgba(255,255,255,0.3)
        `,
        background: "linear-gradient(145deg, #F8F4EC 0%, #F2EDE4 100%)",
      }}
    >
      {/* Glossy overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)",
        }}
      />
      <div className="absolute inset-0 grid grid-cols-5 grid-rows-5">
        <div className="col-span-2 row-span-2 rounded-tl-2xl relative overflow-hidden" style={{ backgroundColor: COLOR_HEX.red.light }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 100%)" }} />
        </div>
        <div className="col-span-1" />
        <div className="col-span-2 row-span-2 rounded-tr-2xl relative overflow-hidden" style={{ backgroundColor: COLOR_HEX.green.light }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 100%)" }} />
        </div>
        <div className="col-span-1" />
        <div className="col-span-1 flex items-center justify-center" style={{ backgroundColor: COLOR_HEX.red.track }} />
        <div className="col-span-1" />
        <div className="col-span-1 flex items-center justify-center" style={{ backgroundColor: COLOR_HEX.green.track }} />
        <div className="col-span-1" />
        <div className="col-span-1" />
        <div className="col-span-1 flex items-center justify-center" style={{ backgroundColor: COLOR_HEX.yellow.track }} />
        <div className="col-span-1 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(255,248,230,0.9) 0%, rgba(255,245,200,0.8) 100%)" }}>
          <span className="text-[8px]">⭐</span>
        </div>
        <div className="col-span-1 flex items-center justify-center" style={{ backgroundColor: COLOR_HEX.blue.track }} />
        <div className="col-span-1" />
        <div className="col-span-2 row-span-2 rounded-bl-2xl relative overflow-hidden" style={{ backgroundColor: COLOR_HEX.yellow.light }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 100%)" }} />
        </div>
        <div className="col-span-1" />
        <div className="col-span-2 row-span-2 rounded-br-2xl relative overflow-hidden" style={{ backgroundColor: COLOR_HEX.blue.light }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 100%)" }} />
        </div>
      </div>
    </div>
  );
}

/** Premium animated dice for hero */
function HeroDice() {
  return (
    <motion.div
      animate={{ rotate: [0, 10, -10, 5, 0], y: [0, -4, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="w-16 h-16 rounded-2xl relative overflow-hidden"
      style={{
        background: "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(248,248,248,0.95) 100%)",
        border: "1px solid rgba(255,255,255,0.95)",
        boxShadow: `
          0 10px 30px rgba(0,0,0,0.15),
          0 4px 12px rgba(0,0,0,0.08),
          inset 0 2px 0 rgba(255,255,255,0.9),
          inset 0 -2px 0 rgba(0,0,0,0.05)
        `,
      }}
    >
      {/* Glossy reflection */}
      <div
        className="absolute top-0 left-0 right-0 h-[50%] pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, transparent 100%)",
        }}
      />
      <div className="absolute inset-0 grid grid-cols-3 gap-[4px] p-3">
        <div className="flex justify-start items-start">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "radial-gradient(circle at 35% 35%, #555 0%, #333 50%, #222 100%)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)" }} />
        </div>
        <div />
        <div className="flex justify-end items-start">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "radial-gradient(circle at 35% 35%, #555 0%, #333 50%, #222 100%)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)" }} />
        </div>
        <div className="flex justify-start items-center">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "radial-gradient(circle at 35% 35%, #555 0%, #333 50%, #222 100%)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)" }} />
        </div>
        <div className="flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "radial-gradient(circle at 35% 35%, #555 0%, #333 50%, #222 100%)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)" }} />
        </div>
        <div className="flex justify-end items-center">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "radial-gradient(circle at 35% 35%, #555 0%, #333 50%, #222 100%)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)" }} />
        </div>
        <div className="flex justify-start items-end">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "radial-gradient(circle at 35% 35%, #555 0%, #333 50%, #222 100%)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)" }} />
        </div>
        <div />
        <div className="flex justify-end items-end">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "radial-gradient(circle at 35% 35%, #555 0%, #333 50%, #222 100%)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)" }} />
        </div>
      </div>
    </motion.div>
  );
}

/** Form card wrapper */
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`w-full rounded-[2rem] p-6 ${className}`}
      style={{
        backgroundColor: "rgba(255,255,255,0.85)",
        border: "1px solid rgba(0,0,0,0.04)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
    >
      {children}
    </div>
  );
}

/** Premium input */
function GlassInput({
  value,
  onChange,
  placeholder,
  maxLength,
  type = "text",
  mono = false,
  focusColor = "#E8606A",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLength: number;
  type?: string;
  mono?: boolean;
  focusColor?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`w-full px-4 py-3.5 rounded-2xl text-stone-800 text-sm font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 transition-all ${mono ? "font-mono tracking-widest" : ""}`}
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04), inset 0 2px 4px rgba(0,0,0,0.03)",
        // @ts-expect-error CSS custom property
        "--tw-ring-color": `${focusColor}40`,
      }}
    />
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
      {/* Background — simple static blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-20 left-10 w-64 h-64 rounded-full opacity-[0.05]"
          style={{ background: `radial-gradient(circle, ${COLOR_HEX.red.base}, transparent 70%)` }}
        />
        <div
          className="absolute bottom-20 right-10 w-72 h-72 rounded-full opacity-[0.05]"
          style={{ background: `radial-gradient(circle, ${COLOR_HEX.blue.base}, transparent 70%)` }}
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
                <div className="flex items-center gap-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <HeroDice />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <MiniBoard />
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <h1 className="text-5xl font-black tracking-tight mb-2" style={{
                    background: "linear-gradient(135deg, #44403c 0%, #292524 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}>
                    Ludo
                  </h1>
                  <p className="text-stone-500 text-sm">
                    The classic board game, now online
                  </p>
                </motion.div>
              </div>

              {/* Player avatars — glossy */}
              <div className="flex items-center gap-3">
                {TWO_PLAYER_COLORS.map((c, i) => (
                  <motion.div
                    key={c}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.1, type: "spring", stiffness: 200 }}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-sm font-bold relative overflow-hidden"
                    style={{
                      background: `linear-gradient(145deg, ${COLOR_HEX[c].light} 0%, ${COLOR_HEX[c].base} 40%, ${COLOR_HEX[c].dark} 100%)`,
                      boxShadow: `0 4px 14px ${COLOR_HEX[c].base}40, inset 0 1px 0 rgba(255,255,255,0.3)`,
                    }}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-[50%] pointer-events-none"
                      style={{
                        background: "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)",
                      }}
                    />
                    <span className="relative z-10">{PLAYER_NAMES[c].charAt(0)}</span>
                  </motion.div>
                ))}
              </div>

              {/* CTA buttons — premium */}
              <div className="w-full flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98, y: 0 }}
                  onClick={() => setView("create")}
                  className="w-full py-4.5 rounded-3xl text-white font-bold text-lg transition-all relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${COLOR_HEX.red.base} 0%, ${COLOR_HEX.red.dark} 100%)`,
                    boxShadow: `
                      0 8px 28px ${COLOR_HEX.red.base}40,
                      inset 0 1px 0 rgba(255,255,255,0.25),
                      inset 0 -1px 0 rgba(0,0,0,0.1)
                    `,
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-[50%] pointer-events-none"
                    style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)",
                      borderRadius: "inherit",
                    }}
                  />
                  <span className="relative z-10">✨ Create Room</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98, y: 0 }}
                  onClick={() => setView("join")}
                  className="w-full py-4.5 rounded-3xl font-bold text-lg transition-all relative overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.7)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    color: "#57534e",
                    border: "1px solid rgba(255,255,255,0.6)",
                    boxShadow: `
                      0 6px 20px rgba(0,0,0,0.05),
                      inset 0 1px 0 rgba(255,255,255,0.8)
                    `,
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-[50%] pointer-events-none"
                    style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)",
                      borderRadius: "inherit",
                    }}
                  />
                  <span className="relative z-10">🔗 Join Room</span>
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
                className="text-sm text-stone-500 hover:text-stone-700 mb-6 font-medium transition-colors"
              >
                ← Back
              </button>

              <GlassCard>
                <h2 className="text-2xl font-black text-stone-800 mb-1">Create Room</h2>
                <p className="text-sm text-stone-500 mb-6">
                  Set up a private room for you and a friend.
                </p>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-2xl text-sm font-medium"
                    style={{
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      color: "#dc2626",
                    }}
                  >
                    {error}
                  </motion.div>
                )}

                {/* Name */}
                <label className="block text-xs font-bold text-stone-600 mb-2 uppercase tracking-wider">
                  Your Name
                </label>
                <GlassInput
                  value={name}
                  onChange={setName}
                  placeholder="Enter your name"
                  maxLength={20}
                  focusColor={COLOR_HEX[selectedColor].base}
                />

                <div className="h-4" />

                {/* Color selection */}
                <label className="block text-xs font-bold text-stone-600 mb-2 uppercase tracking-wider">
                  Your Color
                </label>
                <div className="flex gap-3 mb-6">
                  {availableColors.map((c) => (
                    <motion.button
                      key={c}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedColor(c)}
                      className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all relative overflow-hidden ${
                        selectedColor === c ? "text-white" : "text-stone-600"
                      }`}
                      style={{
                        background: selectedColor === c
                          ? `linear-gradient(135deg, ${COLOR_HEX[c].base} 0%, ${COLOR_HEX[c].dark} 100%)`
                          : `${COLOR_HEX[c].track}`,
                        boxShadow: selectedColor === c
                          ? `0 4px 16px ${COLOR_HEX[c].base}40, inset 0 1px 0 rgba(255,255,255,0.2)`
                          : "none",
                        border: selectedColor === c
                          ? `1px solid rgba(255,255,255,0.2)`
                          : "1px solid transparent",
                      }}
                    >
                      {selectedColor === c && (
                        <div
                          className="absolute top-0 left-0 right-0 h-[50%] pointer-events-none"
                          style={{
                            background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)",
                          }}
                        />
                      )}
                      <span className="relative z-10">{c.charAt(0).toUpperCase() + c.slice(1)}</span>
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  whileHover={name.trim() ? { scale: 1.02, y: -1 } : {}}
                  whileTap={name.trim() ? { scale: 0.98, y: 0 } : {}}
                  onClick={handleCreate}
                  disabled={!name.trim() || loading}
                  className={`w-full py-4 rounded-3xl text-white font-bold text-lg transition-all relative overflow-hidden ${
                    name.trim() && !loading ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
                  }`}
                  style={{
                    background: name.trim()
                      ? `linear-gradient(135deg, ${COLOR_HEX[selectedColor].base} 0%, ${COLOR_HEX[selectedColor].dark} 100%)`
                      : "#ccc",
                    boxShadow: name.trim()
                      ? `0 8px 28px ${COLOR_HEX[selectedColor].base}40, inset 0 1px 0 rgba(255,255,255,0.2)`
                      : "none",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  {name.trim() && (
                    <div
                      className="absolute top-0 left-0 right-0 h-[50%] pointer-events-none"
                      style={{
                        background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)",
                        borderRadius: "inherit",
                      }}
                    />
                  )}
                  <span className="relative z-10">{loading ? "Creating..." : "🎮 Create Room"}</span>
                </motion.button>
              </GlassCard>
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
                className="text-sm text-stone-500 hover:text-stone-700 mb-6 font-medium transition-colors"
              >
                ← Back
              </button>

              <GlassCard>
                <h2 className="text-2xl font-black text-stone-800 mb-1">Join Room</h2>
                <p className="text-sm text-stone-500 mb-6">
                  Enter a room code from your friend.
                </p>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-2xl text-sm font-medium"
                    style={{
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      color: "#dc2626",
                    }}
                  >
                    {error}
                  </motion.div>
                )}

                {/* Name */}
                <label className="block text-xs font-bold text-stone-600 mb-2 uppercase tracking-wider">
                  Your Name
                </label>
                <GlassInput
                  value={name}
                  onChange={setName}
                  placeholder="Enter your name"
                  maxLength={20}
                  focusColor={COLOR_HEX[selectedColor].base}
                />

                <div className="h-4" />

                {/* Room code */}
                <label className="block text-xs font-bold text-stone-600 mb-2 uppercase tracking-wider">
                  Room Code
                </label>
                <GlassInput
                  value={code}
                  onChange={(v) => setCode(v.toUpperCase())}
                  placeholder="LUDO-XXXX"
                  maxLength={9}
                  mono={true}
                  focusColor={COLOR_HEX[selectedColor].base}
                />

                <div className="h-4" />

                {/* Color selection */}
                <label className="block text-xs font-bold text-stone-600 mb-2 uppercase tracking-wider">
                  Your Color
                </label>
                <div className="flex gap-3 mb-6">
                  {availableColors.map((c) => (
                    <motion.button
                      key={c}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedColor(c)}
                      className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all relative overflow-hidden ${
                        selectedColor === c ? "text-white" : "text-stone-600"
                      }`}
                      style={{
                        background: selectedColor === c
                          ? `linear-gradient(135deg, ${COLOR_HEX[c].base} 0%, ${COLOR_HEX[c].dark} 100%)`
                          : `${COLOR_HEX[c].track}`,
                        boxShadow: selectedColor === c
                          ? `0 4px 16px ${COLOR_HEX[c].base}40, inset 0 1px 0 rgba(255,255,255,0.2)`
                          : "none",
                        border: selectedColor === c
                          ? `1px solid rgba(255,255,255,0.2)`
                          : "1px solid transparent",
                      }}
                    >
                      {selectedColor === c && (
                        <div
                          className="absolute top-0 left-0 right-0 h-[50%] pointer-events-none"
                          style={{
                            background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)",
                          }}
                        />
                      )}
                      <span className="relative z-10">{c.charAt(0).toUpperCase() + c.slice(1)}</span>
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  whileHover={name.trim() && code.trim() ? { scale: 1.02, y: -1 } : {}}
                  whileTap={name.trim() && code.trim() ? { scale: 0.98, y: 0 } : {}}
                  onClick={handleJoin}
                  disabled={!name.trim() || !code.trim() || loading}
                  className={`w-full py-4 rounded-3xl text-white font-bold text-lg transition-all relative overflow-hidden ${
                    name.trim() && code.trim() && !loading
                      ? "cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  style={{
                    background: name.trim() && code.trim()
                      ? `linear-gradient(135deg, ${COLOR_HEX[selectedColor].base} 0%, ${COLOR_HEX[selectedColor].dark} 100%)`
                      : "#ccc",
                    boxShadow: name.trim() && code.trim()
                      ? `0 8px 28px ${COLOR_HEX[selectedColor].base}40, inset 0 1px 0 rgba(255,255,255,0.2)`
                      : "none",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  {name.trim() && code.trim() && (
                    <div
                      className="absolute top-0 left-0 right-0 h-[50%] pointer-events-none"
                      style={{
                        background: "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)",
                        borderRadius: "inherit",
                      }}
                    />
                  )}
                  <span className="relative z-10">{loading ? "Joining..." : "🚀 Join Room"}</span>
                </motion.button>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
