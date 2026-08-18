/**
 * Lobby — Waiting room for a Ludo game.
 * Shows room code, connected players, and host controls.
 * Claymorphism-styled for premium feel.
 */
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COLOR_HEX, TWO_PLAYER_COLORS, type PlayerColor } from "@/lib/game/constants";
import type { GameState } from "@/lib/game/logic";

interface LobbyProps {
  roomCode: string;
  hostName: string;
  hostColor: PlayerColor;
  guestName: string | null;
  guestColor: PlayerColor | null;
  isHost: boolean;
  onStartGame: (initialState: GameState) => void;
  onLeave: () => void;
}

/** Animated waiting dots */
function WaitingDots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          className="w-1.5 h-1.5 rounded-full bg-stone-400"
        />
      ))}
    </span>
  );
}

/** Player slot card */
function PlayerSlot({
  name,
  color,
  isReady,
  isHost,
  isEmpty,
}: {
  name: string | null;
  color: PlayerColor | null;
  isReady: boolean;
  isHost: boolean;
  isEmpty: boolean;
}) {
  const hex = color ? COLOR_HEX[color] : null;

  return (
    <motion.div
      layout
      className="w-full rounded-3xl p-4 transition-all"
      style={{
        backgroundColor: isEmpty ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.85)",
        boxShadow: isEmpty
          ? "inset 0 2px 8px rgba(0,0,0,0.04)"
          : `0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)`,
        border: isEmpty
          ? "2px dashed rgba(0,0,0,0.1)"
          : `2px solid ${hex?.light ?? "transparent"}`,
      }}
    >
      {isEmpty ? (
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-stone-400">Waiting for player</p>
            <WaitingDots />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{
              backgroundColor: hex?.base,
              boxShadow: `0 4px 12px ${hex?.base}40`,
            }}
          >
            {name?.charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-stone-800 truncate">{name}</p>
              {isHost && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  HOST
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 capitalize">{color} tokens</p>
          </div>

          {/* Ready indicator */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{
              backgroundColor: isReady ? "#6BCB77" : "#F5F0E8",
            }}
          >
            {isReady ? (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <div className="w-2 h-2 rounded-full bg-stone-300" />
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function Lobby({
  roomCode,
  hostName,
  hostColor,
  guestName,
  guestColor,
  isHost,
  onStartGame,
  onLeave,
}: LobbyProps) {
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);
  const bothJoined = guestName !== null;

  // Auto-ready for host when guest joins
  useEffect(() => {
    if (isHost && bothJoined && !ready) {
      setReady(true);
    }
  }, [isHost, bothJoined, ready]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement("textarea");
      el.value = roomCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [roomCode]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}?room=${roomCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my Ludo game!",
          text: `Come play Ludo with me! Room code: ${roomCode}`,
          url,
        });
      } catch {
        // User cancelled
      }
    } else {
      // Fallback: copy link
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Ignore
      }
    }
  }, [roomCode]);

  const handleStart = useCallback(() => {
    if (!bothJoined || !ready) return;

    // Import and create initial state
    import("@/lib/game/logic").then(({ createInitialState }) => {
      import("@/lib/game/constants").then(({ TWO_PLAYER_COLORS }) => {
        const playerNames: Record<PlayerColor, string> = {
          red: "Player 1",
          green: "Player 2",
          yellow: "Player 3",
          blue: "Player 4",
        };
        if (hostColor) playerNames[hostColor] = hostName;
        if (guestColor) playerNames[guestColor] = guestName ?? "Guest";

        const state = createInitialState(TWO_PLAYER_COLORS, playerNames);
        onStartGame(state);
      });
    });
  }, [bothJoined, ready, hostColor, hostName, guestColor, guestName, onStartGame]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100 flex flex-col items-center p-6 relative overflow-hidden">
      {/* Background decoration */}
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
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6">
        {/* Back button */}
        <div className="w-full">
          <button
            onClick={onLeave}
            className="text-sm text-stone-500 hover:text-stone-700 font-medium transition-colors"
          >
            ← Leave
          </button>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-black text-stone-800 mb-1">
            {isHost ? "Your Room" : "Joined Room"}
          </h1>
          <p className="text-sm text-stone-500">
            {isHost
              ? bothJoined
                ? "Both players are here!"
                : "Share the code with your friend"
              : `Playing as ${guestColor}`}
          </p>
        </motion.div>

        {/* Room Code Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full rounded-[2rem] p-6"
          style={{
            backgroundColor: "rgba(255,255,255,0.85)",
            boxShadow:
              "0 12px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider text-center mb-3">
            Room Code
          </p>

          {/* Code display */}
          <div
            className="flex items-center justify-center gap-3 py-4 rounded-2xl mb-4"
            style={{
              backgroundColor: "rgba(0,0,0,0.03)",
              border: "2px solid rgba(0,0,0,0.06)",
            }}
          >
            <span className="text-2xl font-mono font-black text-stone-800 tracking-[0.2em]">
              {roomCode}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopy}
              className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all"
              style={{
                backgroundColor: copied ? "#6BCB77" : COLOR_HEX.red.light,
                color: copied ? "white" : COLOR_HEX.red.dark,
              }}
            >
              {copied ? "✓ Copied!" : "📋 Copy Code"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShare}
              className="flex-1 py-3 rounded-2xl text-sm font-bold bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all"
            >
              🔗 Share Link
            </motion.button>
          </div>

          {/* Share URL hint */}
          <p className="text-[11px] text-stone-400 text-center mt-3 break-all">
            {`${window.location.origin}?room=${roomCode}`}
          </p>
        </motion.div>

        {/* Players */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full flex flex-col gap-3"
        >
          <PlayerSlot
            name={hostName}
            color={hostColor}
            isReady={ready}
            isHost={true}
            isEmpty={false}
          />

          <PlayerSlot
            name={guestName}
            color={guestColor}
            isReady={bothJoined}
            isHost={false}
            isEmpty={!bothJoined}
          />
        </motion.div>

        {/* Start button (host only, when guest has joined) */}
        {isHost && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full"
          >
            <motion.button
              whileHover={bothJoined ? { scale: 1.02 } : {}}
              whileTap={bothJoined ? { scale: 0.98 } : {}}
              onClick={handleStart}
              disabled={!bothJoined}
              className={`w-full py-4 rounded-3xl text-white font-bold text-lg transition-all ${
                bothJoined ? "cursor-pointer" : "opacity-40 cursor-not-allowed"
              }`}
              style={{
                backgroundColor: bothJoined ? COLOR_HEX[hostColor ?? "red"].base : "#ccc",
                boxShadow: bothJoined
                  ? `0 8px 24px ${COLOR_HEX[hostColor ?? "red"].base}40`
                  : "none",
              }}
            >
              {bothJoined ? "🎮 Start Game" : "Waiting for opponent..."}
            </motion.button>
          </motion.div>
        )}

        {/* Guest waiting message */}
        {!isHost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="flex items-center gap-2 text-stone-500 text-sm">
              <WaitingDots />
              <span>Waiting for host to start</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
