/**
 * PlayerHUD — shows player info, captured tokens, and turn indicator.
 * Clean design with solid colors for performance.
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
    <div
      className="relative rounded-2xl p-3 overflow-hidden"
      style={{
        backgroundColor: isCurrentTurn ? hex.track : "#ffffff",
        border: `2px solid ${isCurrentTurn ? hex.base : "rgba(0,0,0,0.05)"}`,
        boxShadow: isCurrentTurn
          ? `0 4px 16px ${hex.base}20, 0 1px 4px rgba(0,0,0,0.04)`
          : "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Timer bar */}
      {isCurrentTurn && timerPercent > 0 && (
        <div className="absolute bottom-0 left-0 h-1 bg-black/5 w-full">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${timerPercent}%`,
              backgroundColor: timerPercent > 50
                ? hex.base
                : timerPercent > 25 ? "#F59E0B" : "#EF4444",
            }}
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{
            background: `linear-gradient(145deg, ${hex.light}, ${hex.base})`,
            boxShadow: `0 2px 8px ${hex.base}30`,
          }}
        >
          {player.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm truncate text-stone-800">
              {player.name}
            </span>
            {isMe && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500">
                YOU
              </span>
            )}
            {isCurrentTurn && (
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
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
              const done = isFinished(token.position);
              const home = token.position === -1;
              return (
                <span
                  key={i}
                  className="text-xs"
                  style={{
                    color: done ? hex.base : home ? "#D4D4D8" : hex.dark,
                    opacity: home ? 0.4 : 1,
                  }}
                >
                  {TOKEN_SHAPES[i]}
                </span>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="text-right shrink-0">
          {player.captures > 0 && (
            <div className="text-[10px] text-stone-500">🎯 {player.captures}</div>
          )}
          <div className="text-xs font-bold" style={{ color: hex.dark }}>
            {finishedCount}/{TOKENS_PER_PLAYER} 🏠
          </div>
        </div>
      </div>
    </div>
  );
}
