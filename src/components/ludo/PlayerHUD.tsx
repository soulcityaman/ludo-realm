/**
 * PlayerHUD — shows player info, captured tokens, and turn indicator.
 * Claymorphism card styling with soft shadows.
 */
import { motion } from "framer-motion";
import type { PlayerColor } from "@/lib/game/constants";
import { COLOR_HEX, TOKENS_PER_PLAYER } from "@/lib/game/constants";
import type { PlayerState } from "@/lib/game/logic";
import { isFinished } from "@/lib/game/logic";

interface PlayerHUDProps {
  player: PlayerState;
  isActive: boolean;
  timerPercent: number;
  isCurrentTurn: boolean;
  isMe?: boolean;
}

/** Token indicator shapes for accessibility */
const TOKEN_SHAPES = ["●", "◆", "▲", "■"];

export default function PlayerHUD({
  player,
  isActive,
  timerPercent,
  isCurrentTurn,
  isMe = false,
}: PlayerHUDProps) {
  const hex = COLOR_HEX[player.color];
  const finishedCount = player.tokens.filter((t) => isFinished(t.position)).length;

  return (
    <motion.div
      animate={{
        scale: isCurrentTurn ? 1.02 : 1,
      }}
      transition={{ duration: 0.3 }}
      className="relative rounded-3xl p-4 overflow-hidden"
      style={{
        backgroundColor: isActive ? hex.track : "rgba(255,255,255,0.7)",
        boxShadow: isCurrentTurn
          ? `0 8px 24px ${hex.base}30, 0 2px 8px rgba(0,0,0,0.06)`
          : "0 4px 12px rgba(0,0,0,0.04)",
        border: `2px solid ${isCurrentTurn ? hex.base : "transparent"}`,
      }}
    >
      {/* Timer bar */}
      {isCurrentTurn && timerPercent > 0 && (
        <div className="absolute bottom-0 left-0 h-1 bg-stone-200/50 w-full">
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${timerPercent}%`,
              backgroundColor:
                timerPercent > 50 ? hex.base : timerPercent > 25 ? "#F59E0B" : "#EF4444",
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Avatar circle */}
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{
            backgroundColor: hex.base,
            boxShadow: `0 3px 10px ${hex.base}40`,
          }}
        >
          {player.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate text-stone-800">
              {player.name}
            </span>
            {isMe && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-600">
                YOU
              </span>
            )}
            {isCurrentTurn && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: hex.base }}
              >
                TURN
              </span>
            )}
          </div>

          {/* Token indicators */}
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: TOKENS_PER_PLAYER }).map((_, i) => {
              const token = player.tokens[i];
              const finished = isFinished(token.position);
              const isHome = token.position === -1;
              return (
                <span
                  key={i}
                  className="text-xs"
                  style={{
                    color: finished
                      ? hex.base
                      : isHome
                        ? "#D4D4D8"
                        : hex.dark,
                    opacity: isHome ? 0.4 : 1,
                  }}
                >
                  {TOKEN_SHAPES[i]}
                </span>
              );
            })}
          </div>
        </div>

        {/* Captures & finished */}
        <div className="text-right shrink-0">
          {player.captures > 0 && (
            <div className="text-[10px] text-stone-500">
              🎯 {player.captures}
            </div>
          )}
          <div className="text-xs font-semibold" style={{ color: hex.dark }}>
            {finishedCount}/{TOKENS_PER_PLAYER} 🏠
          </div>
        </div>
      </div>
    </motion.div>
  );
}
