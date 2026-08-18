/**
 * DiceRoller — animated dice with Claymorphism styling.
 * Shows a 3D-ish dice face and roll button.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

function DiceFace({ value, size = 64 }: { value: number; size?: number }) {
  const dots = DICE_DOTS[value] || DICE_DOTS[1];
  const cellSize = size / 3;

  return (
    <div
      className="relative rounded-2xl bg-white"
      style={{
        width: size,
        height: size,
        boxShadow:
          "0 6px 20px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
    >
      {dots.map(([row, col], i) => (
        <div
          key={i}
          className="absolute rounded-full bg-stone-700"
          style={{
            width: cellSize * 0.35,
            height: cellSize * 0.35,
            left: col * cellSize + cellSize * 0.325,
            top: row * cellSize + cellSize * 0.325,
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
  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number>(1);
  const hex = COLOR_HEX[playerColor];

  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 80);
      return () => clearInterval(interval);
    }
  }, [isRolling]);

  useEffect(() => {
    if (diceValue !== null && isRolling) {
      setTimeout(() => {
        setDisplayValue(diceValue);
        setIsRolling(false);
      }, 400);
    }
  }, [diceValue, isRolling]);

  const handleRoll = () => {
    if (!canRoll || isRolling) return;
    setIsRolling(true);
    setTimeout(() => onRoll(), 300);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={isRolling ? "rolling" : displayValue}
          initial={isRolling ? { rotateZ: 0, scale: 0.8 } : { rotateZ: 0, scale: 1 }}
          animate={
            isRolling
              ? { rotateZ: [0, 90, 180, 270, 360], scale: [0.8, 1.05, 0.95, 1] }
              : { rotateZ: 0, scale: 1 }
          }
          transition={
            isRolling
              ? { duration: 0.4, ease: "easeInOut" }
              : { duration: 0.2 }
          }
        >
          <DiceFace value={displayValue} size={72} />
        </motion.div>
      </AnimatePresence>

      <motion.button
        onClick={handleRoll}
        disabled={!canRoll || isRolling}
        whileHover={canRoll ? { scale: 1.05 } : {}}
        whileTap={canRoll ? { scale: 0.95 } : {}}
        className={`
          px-8 py-3 rounded-2xl text-white font-semibold text-lg
          transition-all duration-200
          ${canRoll && !isRolling
            ? "cursor-pointer"
            : "cursor-not-allowed opacity-50"
          }
        `}
        style={{
          backgroundColor: hex.base,
          boxShadow: canRoll
            ? `0 6px 20px ${hex.base}40, 0 2px 6px rgba(0,0,0,0.1)`
            : "0 2px 6px rgba(0,0,0,0.05)",
        }}
      >
        {isRolling ? "Rolling..." : canRoll ? "🎲 Roll" : "Wait..."}
      </motion.button>
    </div>
  );
}
