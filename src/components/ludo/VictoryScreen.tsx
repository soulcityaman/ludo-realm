/**
 * VictoryScreen — confetti celebration with game stats and rematch CTA.
 * Clean design without heavy blur effects.
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

  useEffect(() => {
    const end = Date.now() + 3000;
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
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [hex]);

  const totalMoves = gameState.moveHistory.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-sm w-full rounded-3xl p-7 text-center"
        style={{
          backgroundColor: "#ffffff",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)",
        }}
      >
        {/* Trophy */}
        <motion.div
          initial={{ rotate: -10, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
          className="text-7xl mb-3"
        >
          🏆
        </motion.div>

        <h2 className="text-2xl font-black mb-1" style={{ color: hex.dark }}>
          {winnerPlayer?.name} Wins!
        </h2>
        <p className="text-stone-500 text-sm mb-5">All tokens reached home! 🏠</p>

        {/* Stats row */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1 rounded-2xl p-3 bg-stone-50">
            <div className="text-xl font-bold text-stone-800">{totalMoves}</div>
            <div className="text-[10px] text-stone-500">Moves</div>
          </div>
          <div className="flex-1 rounded-2xl p-3 bg-stone-50">
            <div className="text-xl font-bold text-stone-800">
              {gameState.players.reduce((s, p) => s + p.captures, 0)}
            </div>
            <div className="text-[10px] text-stone-500">Captures</div>
          </div>
        </div>

        {/* Players */}
        <div className="flex gap-3 mb-5">
          {gameState.players.map((p) => {
            const pHex = COLOR_HEX[p.color];
            const done = p.tokens.filter((t) => isFinished(t.position)).length;
            return (
              <div
                key={p.color}
                className="flex-1 rounded-2xl p-3 relative"
                style={{
                  backgroundColor: p.color === winner ? `${hex.light}60` : "#f5f5f5",
                  border: p.color === winner ? `2px solid ${hex.base}40` : "2px solid transparent",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg mx-auto mb-1 flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: `linear-gradient(145deg, ${pHex.light}, ${pHex.base})` }}
                >
                  {p.name.charAt(0)}
                </div>
                <div className="text-[11px] font-bold text-stone-700 truncate">{p.name}</div>
                <div className="text-[9px] text-stone-400 mt-0.5">
                  🎯 {p.captures} · 🏠 {done}/4
                </div>
                {p.color === winner && <div className="absolute top-1.5 right-1.5 text-xs">👑</div>}
              </div>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onLeave}
            className="flex-1 py-3 rounded-2xl font-bold text-sm bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
          >
            Leave
          </button>
          <button
            onClick={onRematch}
            className="flex-1 py-3 rounded-2xl font-bold text-sm text-white"
            style={{
              background: `linear-gradient(135deg, ${hex.base}, ${hex.dark})`,
              boxShadow: `0 4px 12px ${hex.base}40`,
            }}
          >
            🔄 Rematch
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
