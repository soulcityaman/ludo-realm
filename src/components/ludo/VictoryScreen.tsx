/**
 * VictoryScreen — Premium confetti celebration with glassmorphism overlay.
 * Shows game stats, winner announcement, and rematch CTA.
 */
import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import type { PlayerColor } from "@/lib/game/constants";
import { COLOR_HEX } from "@/lib/game/constants";
import type { GameState } from "@/lib/game/logic";
import { isFinished } from "@/lib/game/logic";

interface VictoryScreenProps {
  winner: PlayerColor;
  gameState: GameState;
  onRematch: () => void;
  onLeave: () => void;
}

export default function VictoryScreen({
  winner,
  gameState,
  onRematch,
  onLeave,
}: VictoryScreenProps) {
  const hex = COLOR_HEX[winner];
  const winnerPlayer = gameState.players.find((p) => p.color === winner);

  // Fire confetti on mount
  useEffect(() => {
    const duration = 4000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors: [hex.base, hex.light, "#FFD93D", "#6BCB77", "#6CB4EE"],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors: [hex.base, hex.light, "#FFD93D", "#6BCB77", "#6CB4EE"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [hex]);

  const totalTime = gameState.moveHistory.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{
        background: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(12px) saturate(150%)",
        WebkitBackdropFilter: "blur(12px) saturate(150%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-sm w-full rounded-[2.5rem] p-8 text-center relative overflow-hidden"
        style={{
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(24px) saturate(200%)",
          WebkitBackdropFilter: "blur(24px) saturate(200%)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          boxShadow: `
            0 32px 80px rgba(0,0,0,0.2),
            0 12px 32px rgba(0,0,0,0.1),
            0 0 0 1px rgba(255,255,255,0.3),
            inset 0 1px 0 rgba(255,255,255,0.8)
          `,
        }}
      >
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 20%, ${hex.light}30 0%, transparent 60%)`,
          }}
        />

        {/* Trophy */}
        <motion.div
          initial={{ rotate: -15, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.7, type: "spring", stiffness: 150 }}
          className="text-8xl mb-4 relative"
        >
          🏆
          {/* Trophy glow */}
          <div
            className="absolute inset-0 blur-2xl opacity-30"
            style={{ background: `radial-gradient(circle, ${hex.base} 0%, transparent 70%)` }}
          />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-3xl font-black mb-2 relative"
          style={{ color: hex.dark }}
        >
          {winnerPlayer?.name} Wins!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-stone-500 text-sm mb-6 relative"
        >
          All tokens reached home! 🏠
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-2 gap-3 mb-6 relative"
        >
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.5)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
            }}
          >
            <div className="text-2xl font-bold text-stone-800">{totalTime}</div>
            <div className="text-xs text-stone-500">Moves</div>
          </div>
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.5)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
            }}
          >
            <div className="text-2xl font-bold text-stone-800">
              {gameState.players.reduce((sum, p) => sum + p.captures, 0)}
            </div>
            <div className="text-xs text-stone-500">Captures</div>
          </div>
        </motion.div>

        {/* Player stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex gap-3 mb-6 relative"
        >
          {gameState.players.map((p) => {
            const pHex = COLOR_HEX[p.color];
            const finished = p.tokens.filter((t) => isFinished(t.position)).length;
            return (
              <div
                key={p.color}
                className="flex-1 rounded-2xl p-3 relative overflow-hidden"
                style={{
                  background: p.color === winner
                    ? `linear-gradient(135deg, ${hex.light}80 0%, ${hex.light}40 100%)`
                    : "rgba(255,255,255,0.5)",
                  border: p.color === winner
                    ? `2px solid ${hex.base}60`
                    : "1px solid rgba(255,255,255,0.4)",
                  boxShadow: p.color === winner
                    ? `0 4px 16px ${hex.base}20`
                    : "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold relative overflow-hidden"
                  style={{
                    background: `linear-gradient(145deg, ${pHex.light} 0%, ${pHex.base} 40%, ${pHex.dark} 100%)`,
                    boxShadow: `0 3px 10px ${pHex.base}40`,
                  }}
                >
                  {/* Glossy highlight */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[50%] pointer-events-none"
                    style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)",
                    }}
                  />
                  <span className="relative z-10">{p.name.charAt(0)}</span>
                </div>
                <div className="text-xs font-bold text-stone-700 truncate">
                  {p.name}
                </div>
                <div className="text-[10px] text-stone-500 mt-1">
                  🎯 {p.captures} · 🏠 {finished}/4
                </div>
                {p.color === winner && (
                  <div className="absolute top-2 right-2 text-sm">👑</div>
                )}
              </div>
            );
          })}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex gap-3 relative"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLeave}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all"
            style={{
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.5)",
              color: "#57534e",
              boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
            }}
          >
            Leave
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRematch}
            className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${hex.base} 0%, ${hex.dark} 100%)`,
              boxShadow: `0 6px 20px ${hex.base}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            {/* Button shine */}
            <div
              className="absolute top-0 left-0 right-0 h-[50%] pointer-events-none"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)",
                borderRadius: "inherit",
              }}
            />
            <span className="relative z-10">🔄 Rematch</span>
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
