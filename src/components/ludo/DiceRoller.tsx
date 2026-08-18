/**
 * DiceRoller — clean, fast dice with satisfying roll animation.
 * Timing: click → cycle faces 400ms → call onRoll → diceValue prop updates → stop.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import type { PlayerColor } from "@/lib/game/constants";
import { COLOR_HEX } from "@/lib/game/constants";

interface DiceRollerProps {
  diceValue: number | null;
  canRoll: boolean;
  playerColor: PlayerColor;
  onRoll: () => void;
}

/** Dice face dots layout */
const DICE_DOTS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 2], [2, 0]],
  3: [[0, 2], [1, 1], [2, 0]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

/** Simple dice face */
function DiceFace({ value }: { value: number }) {
  const dots = DICE_DOTS[value] || DICE_DOTS[1];
  return (
    <div
      className="w-20 h-20 rounded-2xl relative"
      style={{
        background: "linear-gradient(145deg, #fff 0%, #f5f5f5 50%, #eee 100%)",
        boxShadow: "0 6px 20px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.08), inset 0 2px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.05)",
      }}
    >
      {dots.map(([row, col], i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 14,
            height: 14,
            left: col * 26.67 + 6,
            top: row * 26.67 + 6,
            background: "radial-gradient(circle at 35% 35%, #555, #222)",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)",
          }}
        />
      ))}
    </div>
  );
}

export default function DiceRoller({
  diceValue,
  canRoll,
  playerColor,
  onRoll,
}: DiceRollerProps) {
  const [rolling, setRolling] = useState(false);
  const [display, setDisplay] = useState(1);
  const didRollRef = useRef(false);
  const hex = COLOR_HEX[playerColor];

  // Start rolling animation
  const handleRoll = useCallback(() => {
    if (!canRoll || rolling) return;
    setRolling(true);
    didRollRef.current = false;
  }, [canRoll, rolling]);

  // Cycle faces while rolling
  useEffect(() => {
    if (!rolling) return;
    const id = setInterval(() => {
      setDisplay(Math.floor(Math.random() * 6) + 1);
    }, 60);
    return () => clearInterval(id);
  }, [rolling]);

  // After a short delay, fire onRoll to get the real dice value
  useEffect(() => {
    if (!rolling || didRollRef.current) return;
    didRollRef.current = true;
    const id = setTimeout(() => {
      onRoll();
    }, 400);
    return () => clearTimeout(id);
  }, [rolling, onRoll]);

  // When diceValue arrives, show it and stop rolling
  useEffect(() => {
    if (diceValue !== null && rolling) {
      setDisplay(diceValue);
      setRolling(false);
    }
  }, [diceValue, rolling]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Dice */}
      <motion.div
        animate={rolling ? {
          rotateX: [0, 360],
          rotateY: [0, 180],
          scale: [1, 1.1, 0.9, 1],
        } : {
          rotateX: 0,
          rotateY: 0,
          scale: 1,
        }}
        transition={rolling
          ? { duration: 0.4, ease: "easeInOut" }
          : { duration: 0.2, type: "spring", stiffness: 200 }
        }
      >
        <DiceFace value={display} />
      </motion.div>

      {/* Value badge */}
      {!rolling && diceValue !== null && (
        <div
          className="px-3 py-1 rounded-full text-xs font-bold text-white"
          style={{
            backgroundColor: hex.base,
            boxShadow: `0 2px 8px ${hex.base}50`,
          }}
        >
          {diceValue}
        </div>
      )}

      {/* Roll button */}
      <button
        onClick={handleRoll}
        disabled={!canRoll || rolling}
        className="px-8 py-3 rounded-2xl font-bold text-lg text-white transition-all duration-200"
        style={{
          background: canRoll && !rolling
            ? `linear-gradient(135deg, ${hex.base}, ${hex.dark})`
            : "rgba(180,180,180,0.5)",
          boxShadow: canRoll && !rolling
            ? `0 4px 16px ${hex.base}40, inset 0 1px 0 rgba(255,255,255,0.2)`
            : "none",
          opacity: canRoll && !rolling ? 1 : 0.5,
          cursor: canRoll && !rolling ? "pointer" : "not-allowed",
        }}
      >
        {rolling ? "🎲 Rolling..." : canRoll ? "🎲 Roll" : "⏳ Wait..."}
      </button>
    </div>
  );
}
