/**
 * VictoryScreen — confetti celebration with game stats and rematch CTA.
 */
import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import type { PlayerColor } from "@/lib/game/constants";
import { COLOR_HEX } from "@/lib/game/constants";
import type { GameState } from "@/lib/game/logic";

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
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: [hex.base, hex.light, "#FFD93D"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: [hex.base, hex.light, "#FFD93D"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [hex]);

  const totalTime = gameState.moveHistory.length; // Approximate

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "backOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="max-w-sm w-full rounded-[2rem] p-8 text-center"
        style={{
          backgroundColor: "rgba(255,255,255,0.95)",
          boxShadow: `0 24px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.3)`,
        }}
      >
        {/* Trophy */}
        <motion.div
          initial={{ rotate: -10, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
          className="text-7xl mb-4"
        >
          🏆
        </motion.div>

        <h2
          className="text-3xl font-bold mb-2"
          style={{ color: hex.dark }}
        >
          {winnerPlayer?.name} Wins!
        </h2>

        <p className="text-stone-500 text-sm mb-6">
          All tokens reached home!
        </p>

        {/* Stats */}
        <div
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {gameState.players.map((p) => {
            const pHex = COLOR_HEX[p.color];
            return (
              <div
                key={p.color}
                className="rounded-2xl p-3"
                style={{
                  backgroundColor: p.color === winner ? hex.track : "#F5F5F5",
                  border: p.color === winner ? `2px solid ${hex.base}` : "2px solid transparent",
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl mx-auto mb-1 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: pHex.base }}
                >
                  {p.name.charAt(0)}
                </div>
                <div className="text-xs font-medium text-stone-700 truncate">
                  {p.name}
                </div>
                <div className="text-[10px] text-stone-400 mt-0.5">
                  🎯 {p.captures} · 🏠 {p.tokens.filter((t) => t.position >= 58).length}/4
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onLeave}
            className="flex-1 py-3 rounded-2xl font-semibold text-sm text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            Leave
          </button>
          <button
            onClick={onRematch}
            className="flex-1 py-3 rounded-2xl font-semibold text-sm text-white transition-colors"
            style={{
              backgroundColor: hex.base,
              boxShadow: `0 4px 16px ${hex.base}40`,
            }}
          >
            🔄 Rematch
          </button>
        </div>
      </div>
    </motion.div>
  );
}
