import { memo, useMemo } from "react";
import type { PlayerColor } from "@/lib/game/constants";
import { COLOR_HEX } from "@/lib/game/constants";
import type { GameState } from "@/lib/game/logic";

interface Props {
  gameState: GameState;
  playerNames: Record<PlayerColor, string>;
}

const GameStatusPanel = memo(function GameStatusPanel({ gameState, playerNames }: Props) {
  const recentMoves = useMemo(() => gameState.moveHistory.slice(-5).reverse(), [gameState.moveHistory]);
  const current = gameState.players[gameState.currentPlayerIndex];

  return (
    <aside className="game-status-panel" aria-label="Game status">
      <div className="status-heading">
        <div>
          <span className="eyebrow">LIVE MATCH</span>
          <h2>Game feed</h2>
        </div>
        <span className="live-dot" aria-label="Live" />
      </div>

      <div className="turn-card" style={{ "--turn-color": COLOR_HEX[current.color].base } as React.CSSProperties}>
        <span>NOW PLAYING</span>
        <strong>{current.name}</strong>
        <small>{gameState.phase === "rolling" ? "Roll the dice" : gameState.phase === "moving" ? "Choose a glowing token" : "Match complete"}</small>
      </div>

      <div className="feed-list">
        {recentMoves.length === 0 ? (
          <div className="feed-empty">Your first move will appear here.</div>
        ) : (
          recentMoves.map((move, index) => (
            <div className="feed-item" key={`${move.color}-${move.from}-${move.to}-${index}`}>
              <span className="feed-avatar" style={{ background: COLOR_HEX[move.color].base }}>
                {(playerNames[move.color] ?? move.color).charAt(0).toUpperCase()}
              </span>
              <div>
                <strong>{playerNames[move.color] ?? move.color}</strong>
                <span>moved {move.to >= 57 ? "home" : `to ${move.to}`}{move.captured ? " • captured" : ""}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
});

export default GameStatusPanel;
