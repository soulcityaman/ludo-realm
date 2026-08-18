/**
 * DiceRoller — Premium 3D dice with glassmorphism and satisfying roll animation.
 * Claymorphism + Glassmorphism hybrid design.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PlayerColor } from "@/lib/game/constants";
import { COLOR_HEX } from "@/lib/game/constants";

interface DiceRollerProps {
  diceValue: number | null;
  canRoll: boolean;
  playerColor: PlayerColor;
  onRoll: () => void;
}

/** Premium dice face dots layout */
const DICE_DOTS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 2], [2, 0]],
  3: [[0, 2], [1, 1], [2, 0]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

/** Premium 3D Dice Face */
function PremiumDiceFace({ value, size = 80 }: { value: number; size?: number }) {
  const dots = DICE_DOTS[value] || DICE_DOTS[1];
  const cellSize = size / 3;
  const dotSize = cellSize * 0.32;

  return (
    <div
      className="relative rounded-2xl"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(248,248,248,0.95) 50%, rgba(240,240,240,0.9) 100%)",
        border: "1px solid rgba(255,255,255,0.95)",
        boxShadow: `
          0 10px 30px rgba(0,0,0,0.18),
          0 4px 12px rgba(0,0,0,0.1),
          inset 0 2px 0 rgba(255,255,255,0.95),
          inset 0 -2px 0 rgba(0,0,0,0.05),
          inset 2px 0 0 rgba(255,255,255,0.6),
          inset -2px 0 0 rgba(0,0,0,0.03)
        `,
      }}
    >
      {/* Glossy reflection */}
      <div
        className="absolute top-0 left-0 right-0 h-[45%] rounded-t-2xl pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)",
        }}
      />

      {/* Dots */}
      {dots.map(([row, col], i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: dotSize,
            height: dotSize,
            left: col * cellSize + (cellSize - dotSize) / 2,
            top: row * cellSize + (cellSize - dotSize) / 2,
            background: "radial-gradient(circle at 35% 35%, #555 0%, #333 50%, #222 100%)",
            boxShadow: `
              inset 0 1px 2px rgba(0,0,0,0.4),
              0 1px 2px rgba(0,0,0,0.2)
            `,
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
  const [rollCount, setRollCount] = useState(0);
  const hex = COLOR_HEX[playerColor];

  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 70);
      return () => clearInterval(interval);
    }
  }, [isRolling]);

  useEffect(() => {
    if (diceValue !== null && isRolling) {
      setTimeout(() => {
        setDisplayValue(diceValue);
        setIsRolling(false);
      }, 500);
    }
  }, [diceValue, isRolling]);

  const handleRoll = useCallback(() => {
    if (!canRoll || isRolling) return;
    setIsRolling(true);
    setRollCount((c) => c + 1);
    setTimeout(() => onRoll(), 350);
  }, [canRoll, isRolling, onRoll]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Dice container with glassmorphism background */}
      <div
        className="relative p-6 rounded-[2rem]"
        style={{
          background: "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.5)",
          boxShadow: `
            0 12px 40px rgba(0,0,0,0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.6)
          `,
        }}
      >
        {/* Decorative ring */}
        <div
          className="absolute inset-0 rounded-[2rem] pointer-events-none"
          style={{
            border: `2px solid ${hex.base}20`,
          }}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={isRolling ? `rolling-${rollCount}` : `static-${displayValue}`}
            initial={isRolling ? { rotateX: 0, rotateY: 0, scale: 0.7 } : { rotateX: 0, rotateY: 0, scale: 1 }}
            animate={
              isRolling
                ? {
                    rotateX: [0, 180, 360, 540],
                    rotateY: [0, 90, 270, 450],
                    scale: [0.7, 1.1, 0.9, 1.05, 1],
                  }
                : { rotateX: 0, rotateY: 0, scale: 1 }
            }
            transition={
              isRolling
                ? { duration: 0.5, ease: "easeInOut" }
                : { duration: 0.3, type: "spring", stiffness: 200 }
            }
            style={{ perspective: 800, transformStyle: "preserve-3d" }}
          >
            <PremiumDiceFace value={displayValue} size={80} />
          </motion.div>
        </AnimatePresence>

        {/* Value indicator */}
        {diceValue !== null && !isRolling && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{
              backgroundColor: hex.base,
              boxShadow: `0 2px 8px ${hex.base}60`,
            }}
          >
            {diceValue}
          </motion.div>
        )}
      </div>

      {/* Roll button with glassmorphism */}
      <motion.button
        onClick={handleRoll}
        disabled={!canRoll || isRolling}
        whileHover={canRoll && !isRolling ? { scale: 1.05, y: -2 } : {}}
        whileTap={canRoll && !isRolling ? { scale: 0.95, y: 0 } : {}}
        className={`
          relative px-10 py-4 rounded-2xl font-bold text-lg
          transition-all duration-200 overflow-hidden
          ${canRoll && !isRolling
            ? "cursor-pointer"
            : "cursor-not-allowed opacity-50"
          }
        `}
        style={{
          background: canRoll && !isRolling
            ? `linear-gradient(135deg, ${hex.base} 0%, ${hex.dark} 100%)`
            : "rgba(200, 200, 200, 0.5)",
          color: "white",
          border: "1px solid rgba(255,255,255,0.3)",
          boxShadow: canRoll && !isRolling
            ? `
              0 8px 24px ${hex.base}50,
              0 2px 8px rgba(0,0,0,0.1),
              inset 0 1px 0 rgba(255,255,255,0.3),
              inset 0 -1px 0 rgba(0,0,0,0.1)
            `
            : "0 2px 6px rgba(0,0,0,0.05)",
        }}
      >
        {/* Button shine */}
        {canRoll && !isRolling && (
          <div
            className="absolute top-0 left-0 right-0 h-[50%] pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)",
              borderRadius: "inherit",
            }}
          />
        )}

        <span className="relative z-10 flex items-center gap-2">
          {isRolling ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
              >
                🎲
              </motion.span>
              Rolling...
            </>
          ) : canRoll ? (
            <>
              🎲 Roll
            </>
          ) : (
            "⏳ Wait..."
          )}
        </span>
      </motion.button>
    </div>
  );
}
