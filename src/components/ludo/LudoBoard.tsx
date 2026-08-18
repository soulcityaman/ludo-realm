/**
 * LudoBoard — renders the 15×15 game board with tokens.
 * Claymorphism-styled: soft shadows, rounded surfaces, inflated depth.
 */
import { memo, useMemo } from "react";
import {
  BOARD_SIZE,
  type PlayerColor,
  COLOR_HEX,
  HOME_BASES,
  HOME_COLUMNS,
  PATH_COORDS,
  HOME_BASE_TOKEN_SLOTS,
  getCellType,
  getHomeColumnColor,
  getArmCellColor,
  getBoardPosition,
} from "@/lib/game/constants";
import type { PlayerState } from "@/lib/game/logic";

interface LudoBoardProps {
  players: PlayerState[];
  movableTokens: number[];
  currentPlayerColor: PlayerColor;
  onTokenClick: (playerIndex: number, tokenIndex: number) => void;
}

/** Inner dot decoration for home base cells */
const HomeBaseCell = memo(function HomeBaseCell({
  color,
  row,
  col,
}: {
  color: PlayerColor;
  row: number;
  col: number;
}) {
  const isCircleSlot = HOME_BASE_TOKEN_SLOTS[color].some(
    ([r, c]) => r === row && c === col,
  );
  const hex = COLOR_HEX[color];

  return (
    <div
      className="w-full h-full relative flex items-center justify-center"
      style={{ backgroundColor: hex.light }}
    >
      {isCircleSlot ? (
        <div
          className="w-[58%] h-[58%] rounded-full"
          style={{
            backgroundColor: "white",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.08)",
          }}
        />
      ) : (
        <div
          className="w-[32%] h-[32%] rounded-full opacity-30"
          style={{ backgroundColor: hex.dark }}
        />
      )}
    </div>
  );
});

/** Home column cell */
const HomeColumnCell = memo(function HomeColumnCell({
  color,
  index,
}: {
  color: PlayerColor;
  index: number;
}) {
  const hex = COLOR_HEX[color];
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        backgroundColor: index === 5 ? hex.dark : hex.base,
      }}
    >
      {index === 4 && (
        <svg
          viewBox="0 0 24 24"
          className="w-[45%] h-[45%] text-white"
          fill="currentColor"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )}
    </div>
  );
});

/** Center goal cell */
const CenterCell = memo(function CenterCell() {
  return (
    <div className="w-full h-full flex items-center justify-center rounded-sm"
      style={{
        background: "linear-gradient(135deg, #E8606A 0%, #FFD93D 33%, #6BCB77 66%, #6CB4EE 100%)",
      }}
    >
      <div className="w-[60%] h-[60%] rounded-full flex items-center justify-center bg-white/90">
        <svg viewBox="0 0 24 24" className="w-[60%] h-[60%] text-amber-400" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>
    </div>
  );
});

/** Colored arm cell */
const ArmCell = memo(function ArmCell({ color }: { color: PlayerColor }) {
  const hex = COLOR_HEX[color];
  return (
    <div
      className="w-full h-full"
      style={{ backgroundColor: hex.track }}
    />
  );
});

/** Outer track cell */
const TrackCell = memo(function TrackCell({
  isSafe,
  isStart,
  startColor,
}: {
  isSafe: boolean;
  isStart: boolean;
  startColor?: PlayerColor;
}) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-white rounded-[1px]"
      style={{
        border: "0.5px solid rgba(0,0,0,0.06)",
      }}
    >
      {isStart && startColor ? (
        <div
          className="w-[36%] h-[36%] rounded-full"
          style={{ backgroundColor: COLOR_HEX[startColor].base }}
        />
      ) : isSafe ? (
        <svg
          viewBox="0 0 24 24"
          className="w-[38%] h-[38%] text-amber-400"
          fill="currentColor"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ) : null}
    </div>
  );
});

/** Map path index to start color */
const PATH_INDEX_TO_START_COLOR: Record<number, PlayerColor> = {
  0: "blue",
  13: "green",
  26: "yellow",
  39: "red",
};

/** A single token overlay on the board */
function BoardToken({
  color,
  boardPos,
  cellSize,
  isSelectable,
  onClick,
  label,
  size = 0.68,
}: {
  color: PlayerColor;
  boardPos: [number, number];
  cellSize: string;
  isSelectable: boolean;
  onClick: () => void;
  label: string;
  size?: number;
}) {
  const hex = COLOR_HEX[color];
  const [row, col] = boardPos;
  const tokenSize = `calc(${cellSize} * ${size})`;

  return (
    <div
      className="absolute flex items-center justify-center transition-all duration-300 ease-out pointer-events-none"
      style={{
        width: tokenSize,
        height: tokenSize,
        left: `calc(${col} * ${cellSize} + (${cellSize} - ${tokenSize}) / 2)`,
        top: `calc(${row} * ${cellSize} + (${cellSize} - ${tokenSize}) / 2)`,
        zIndex: isSelectable ? 30 : 20,
      }}
    >
      <button
        onClick={onClick}
        disabled={!isSelectable}
        className={`
          pointer-events-auto w-full h-full rounded-full
          flex items-center justify-center
          transition-all duration-200
          ${isSelectable
            ? "cursor-pointer hover:scale-110 active:scale-95"
            : "cursor-default"
          }
        `}
        style={{
          backgroundColor: hex.base,
          border: "2.5px solid rgba(255,255,255,0.85)",
          boxShadow: isSelectable
            ? `0 0 0 3px ${hex.light}, 0 4px 14px rgba(0,0,0,0.3)`
            : `0 2px 6px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.4)`,
          animation: isSelectable ? "token-pulse 1.5s ease-in-out infinite" : "none",
        }}
        aria-label={label}
      >
        <div
          className="w-[38%] h-[38%] rounded-full bg-white/45"
          style={{ marginTop: "-10%", marginLeft: "-10%" }}
        />
      </button>
    </div>
  );
}

export default function LudoBoard({
  players,
  movableTokens,
  currentPlayerColor,
  onTokenClick,
}: LudoBoardProps) {
  // Map board positions to tokens
  const tokenMap = useMemo(() => {
    const map = new Map<string, { playerIndex: number; tokenIndex: number; color: PlayerColor; isMovable: boolean }[]>();
    for (let pi = 0; pi < players.length; pi++) {
      const p = players[pi];
      for (let ti = 0; ti < p.tokens.length; ti++) {
        const pos = p.tokens[ti].position;
        if (pos === -1 || pos >= 58) continue;
        const boardPos = getBoardPosition(p.color, pos);
        if (!boardPos) continue;
        const key = `${boardPos[0]},${boardPos[1]}`;
        const isMovable = p.color === currentPlayerColor && movableTokens.includes(ti);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({ playerIndex: pi, tokenIndex: ti, color: p.color, isMovable });
      }
    }
    return map;
  }, [players, movableTokens, currentPlayerColor]);

  // Tokens at home
  const homeTokens = useMemo(() => {
    const homeMap = new Map<string, { playerIndex: number; tokenIndex: number; color: PlayerColor; isMovable: boolean }[]>();
    for (let pi = 0; pi < players.length; pi++) {
      const p = players[pi];
      for (let ti = 0; ti < p.tokens.length; ti++) {
        if (p.tokens[ti].position !== -1) continue;
        const slots = HOME_BASE_TOKEN_SLOTS[p.color];
        const [row, col] = slots[ti];
        const key = `${row},${col}`;
        const isMovable = p.color === currentPlayerColor && movableTokens.includes(ti);
        if (!homeMap.has(key)) homeMap.set(key, []);
        homeMap.get(key)!.push({ playerIndex: pi, tokenIndex: ti, color: p.color, isMovable });
      }
    }
    return homeMap;
  }, [players, movableTokens, currentPlayerColor]);

  // Build cells
  const cells = useMemo(() => {
    const result: { row: number; col: number; type: string; color?: PlayerColor }[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const cellType = getCellType(row, col);
        let color: PlayerColor | undefined;

        if (cellType === "home_base") {
          for (const c of ["red", "green", "yellow", "blue"] as PlayerColor[]) {
            const [r1, c1, r2, c2] = HOME_BASES[c];
            if (row >= r1 && row <= r2 && col >= c1 && col <= c2) {
              color = c;
              break;
            }
          }
        } else if (cellType === "home_column") {
          color = getHomeColumnColor(row, col) ?? undefined;
        } else if (cellType === "colored_arm") {
          color = getArmCellColor(row, col) ?? undefined;
        }

        result.push({ row, col, type: cellType, color });
      }
    }
    return result;
  }, []);

  const cellSize = `calc(100% / ${BOARD_SIZE})`;

  return (
    <div
      className="relative w-full aspect-square rounded-3xl overflow-hidden"
      style={{
        boxShadow:
          "0 12px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08), inset 0 2px 0 rgba(255,255,255,0.5)",
      }}
    >
      {/* Board background */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "#F5F0E8" }}
      />

      {/* Grid */}
      <div
        className="absolute inset-0"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
        }}
      >
        {cells.map(({ row, col, type, color }) => (
          <div
            key={`${row}-${col}`}
            className="relative"
            style={{ gridRow: row + 1, gridColumn: col + 1 }}
          >
            {type === "empty" && <div className="w-full h-full bg-stone-100" />}
            {type === "home_base" && color && (
              <HomeBaseCell color={color} row={row} col={col} />
            )}
            {type === "track" && <TrackCell isSafe={false} isStart={false} />}
            {type === "track_safe" && (
              <TrackCell
                isSafe={true}
                isStart={PATH_INDEX_TO_START_COLOR[
                  PATH_COORDS.findIndex((c) => c[0] === row && c[1] === col)
                ] !== undefined}
                startColor={PATH_INDEX_TO_START_COLOR[
                  PATH_COORDS.findIndex((c) => c[0] === row && c[1] === col)
                ]}
              />
            )}
            {type === "home_column" && color && (() => {
              const homeIdx = HOME_COLUMNS[color].findIndex(
                (c) => c[0] === row && c[1] === col,
              );
              return <HomeColumnCell color={color} index={homeIdx >= 0 ? homeIdx : 0} />;
            })()}
            {type === "colored_arm" && color && <ArmCell color={color} />}
            {type === "center" && <CenterCell />}
          </div>
        ))}
      </div>

      {/* On-track tokens */}
      {Array.from(tokenMap.entries()).map(([key, tokens]) =>
        tokens.map((t) => (
          <BoardToken
            key={`track-${t.playerIndex}-${t.tokenIndex}`}
            color={t.color}
            boardPos={getBoardPosition(t.color, players[t.playerIndex].tokens[t.tokenIndex].position)!}
            cellSize={cellSize}
            isSelectable={t.isMovable}
            onClick={() => onTokenClick(t.playerIndex, t.tokenIndex)}
            label={`Token ${t.tokenIndex + 1}`}
          />
        )),
      )}

      {/* Home tokens */}
      {Array.from(homeTokens.entries()).map(([key, tokens]) =>
        tokens.map((t) => {
          const slots = HOME_BASE_TOKEN_SLOTS[t.color];
          const boardPos = slots[t.tokenIndex];
          return (
            <BoardToken
              key={`home-${t.playerIndex}-${t.tokenIndex}`}
              color={t.color}
              boardPos={boardPos}
              cellSize={cellSize}
              isSelectable={t.isMovable}
              onClick={() => onTokenClick(t.playerIndex, t.tokenIndex)}
              label={`Token ${t.tokenIndex + 1} at home`}
              size={0.52}
            />
          );
        }),
      )}

      {/* Keyframe for token pulse */}
      <style>{`
        @keyframes token-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}
