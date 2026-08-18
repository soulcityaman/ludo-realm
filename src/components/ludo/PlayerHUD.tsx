/**
 * PlayerHUD — shows player info, captured tokens, and turn indicator.
 * Premium glassmorphism card with glossy avatar and animated indicators.
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
      className="relative rounded-[1.75rem] p-4 overflow-hidden"
      style={{
        background: isCurrentTurn
          ? `linear-gradient(135deg, ${hex.track}ee 0%, ${hex.track}80 100%)`
          : "rgba(255, 255, 255, 0.55)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        border: isCurrentTurn
          ? `1.5px solid ${hex.base}50`
          : "1px solid rgba(255,255,255,0.5)",
        boxShadow: isCurrentTurn
          ? `0 8px 32px ${hex.base}20, 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)`
          : "0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.5)",
      }}
    >
      {/* Timer bar */}
      {isCurrentTurn && timerPercent > 0 && (
        <div className="absolute bottom-0 left-0 h-1.5 bg-black/5 w-full">
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${timerPercent}%`,
              background: timerPercent > 50
                ? `linear-gradient(90deg, ${hex.base} 0%, ${hex.dark} 100%)`
                : timerPercent > 25
                  ? "linear-gradient(90deg, #F59E0B 0%, #D97706 100%)"
                  : "linear-gradient(90deg, #EF4444 0%, #DC2626 100%)",
              boxShadow: timerPercent <= 25
                ? "0 0 8px rgba(239, 68, 68, 0.4)"
                : "none",
            }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Avatar circle — glossy */}
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0 relative overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${hex.light} 0%, ${hex.base} 40%, ${hex.dark} 100%)`,
            boxShadow: `0 4px 12px ${hex.base}40, inset 0 1px 0 rgba(255,255,255,0.3)`,
          }}
        >
          {/* Glossy highlight */}
          <div
            className="absolute top-0 left-0 right-0 h-[50%] pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)",
            }}
          />
          <span className="relative z-10">{player.name.charAt(0).toUpperCase()}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm truncate text-stone-800">
              {player.name}
            </span>
            {isMe && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(0,0,0,0.06)",
                  color: "#78716c",
                }}
              >
                YOU
              </span>
            )}
            {isCurrentTurn && (
              <motion.span
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white"
                style={{
                  background: `linear-gradient(135deg, ${hex.base} 0%, ${hex.dark} 100%)`,
                  boxShadow: `0 2px 8px ${hex.base}40`,
                }}
              >
                TURN
              </motion.span>
            )}
          </div>

          {/* Token indicators — premium */}
          <div className="flex items-center gap-1.5 mt-1.5">
            {Array.from({ length: TOKENS_PER_PLAYER }).map((_, i) => {
              const token = player.tokens[i];
              const finished = isFinished(token.position);
              const isHome = token.position === -1;
              return (
                <div
                  key={i}
                  className="relative flex items-center justify-center"
                  style={{
                    width: 18,
                    height: 18,
                  }}
                >
                  <span
                    className="text-xs leading-none"
                    style={{
                      color: finished
                        ? hex.base
                        : isHome
                          ? "#D4D4D8"
                          : hex.dark,
                      opacity: isHome ? 0.4 : 1,
                      filter: finished ? `drop-shadow(0 0 4px ${hex.base}60)` : "none",
                    }}
                  >
                    {TOKEN_SHAPES[i]}
                  </span>
                  {finished && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `${hex.light}40`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Captures & finished — premium */}
        <div className="text-right shrink-0">
          {player.captures > 0 && (
            <div className="text-[11px] text-stone-600 font-medium">
              🎯 {player.captures}
            </div>
          )}
          <div
            className="text-xs font-bold"
            style={{ color: hex.dark }}
          >
            {finishedCount}/{TOKENS_PER_PLAYER} 🏠
          </div>
        </div>
      </div>
    </motion.div>
  );
}
