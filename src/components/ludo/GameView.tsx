/**
 * GameView — the complete game screen for an active Ludo game.
 * Optimized for performance: no backdrop-filter, no animated blobs, efficient timer.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import LudoBoard from "./LudoBoard";
import DiceRoller from "./DiceRoller";
import PlayerHUD from "./PlayerHUD";
import VictoryScreen from "./VictoryScreen";
import {
  type PlayerColor,
  TWO_PLAYER_COLORS,
  TURN_TIME_LIMIT,
} from "@/lib/game/constants";
import {
  createInitialState,
  rollDice,
  moveToken,
  autoSkipTurn,
  currentPlayer,
  type GameState,
} from "@/lib/game/logic";

interface GameViewProps {
  roomId: Id<"rooms">;
  roomCode: string;
  playerNames: Record<PlayerColor, string>;
  myColor: PlayerColor;
  isHost: boolean;
  onLeave: () => void;
}

export default function GameView({
  roomId,
  roomCode,
  playerNames,
  myColor,
  isHost,
  onLeave,
}: GameViewProps) {
  const room = useQuery(api.rooms.getById, { roomId });
  const updateGameState = useMutation(api.rooms.updateGameState);
  const endGame = useMutation(api.rooms.endGame);

  const [timerPercent, setTimerPercent] = useState(100);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [eventMessage, setEventMessage] = useState<string | null>(null);
  const [optimisticState, setOptimisticState] = useState<GameState | null>(null);
  const autoSkipRef = useRef<(() => void) | null>(null);

  const gameState: GameState | null = optimisticState ?? (room?.gameState as GameState | undefined) ?? null;

  // Sync optimistic state to server
  useEffect(() => {
    if (optimisticState && room?.status === "playing") {
      updateGameState({ roomId, gameState: optimisticState }).then(() => {
        setOptimisticState(null);
      }).catch(console.error);
    }
  }, [optimisticState, roomId, room?.status, updateGameState]);

  const activePlayer = gameState ? currentPlayer(gameState) : null;
  const isMyTurn = activePlayer?.color === myColor;

  const opponentColor = TWO_PLAYER_COLORS.find((c) => c !== myColor) ?? "yellow";
  const myPlayer = gameState
    ? gameState.players.find((p: { color: PlayerColor }) => p.color === myColor) ?? null
    : null;
  const opponentPlayer = gameState
    ? gameState.players.find((p: { color: PlayerColor }) => p.color === opponentColor) ?? null
    : null;
  const myPlayerIndex = gameState
    ? gameState.players.findIndex((p: { color: PlayerColor }) => p.color === myColor)
    : -1;
  const opponentPlayerIndex = gameState
    ? gameState.players.findIndex((p: { color: PlayerColor }) => p.color === opponentColor)
    : -1;

  // Stable auto-skip callback
  autoSkipRef.current = async () => {
    if (!gameState || !isMyTurn) return;
    const newState = autoSkipTurn(gameState);
    setOptimisticState(newState);
    try {
      await updateGameState({ roomId, gameState: newState });
      setOptimisticState(null);
    } catch (err) {
      console.error("Failed to auto-skip:", err);
    }
  };

  // Timer — use requestAnimationFrame for smooth countdown, update state at lower frequency
  useEffect(() => {
    if (!gameState || gameState.phase === "finished" || !isMyTurn) return;

    setTimerPercent(100);
    const startTime = Date.now();
    const durationMs = TURN_TIME_LIMIT * 1000;
    let lastTick = 0;
    let raf: number;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.max(0, 100 - (elapsed / durationMs) * 100);

      // Only update state every 500ms to avoid excessive re-renders
      const tickBucket = Math.floor(elapsed / 500);
      if (tickBucket !== lastTick) {
        lastTick = tickBucket;
        setTimerPercent(pct);
      }

      if (pct <= 0) {
        autoSkipRef.current?.();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gameState?.currentPlayerIndex, gameState?.phase, isMyTurn]);

  // Event messages
  useEffect(() => {
    if (gameState?.lastEvent) {
      setEventMessage(gameState.lastEvent);
      const timeout = setTimeout(() => setEventMessage(null), 2500);
      return () => clearTimeout(timeout);
    }
  }, [gameState?.lastEvent, gameState?.moveHistory.length]);

  // Sound effects
  const playSound = useCallback(
    (type: "roll" | "move" | "capture" | "win") => {
      if (!soundEnabled) return;
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        switch (type) {
          case "roll":
            osc.frequency.value = 440;
            gain.gain.value = 0.1;
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
            break;
          case "move":
            osc.frequency.value = 523;
            gain.gain.value = 0.08;
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
            break;
          case "capture":
            osc.frequency.value = 330;
            osc.type = "sawtooth";
            gain.gain.value = 0.1;
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
            break;
          case "win":
            osc.frequency.value = 659;
            gain.gain.value = 0.12;
            osc.start();
            osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.3);
            osc.stop(ctx.currentTime + 0.5);
            break;
        }
      } catch {
        // Audio not available
      }
    },
    [soundEnabled],
  );

  const handleRoll = useCallback(async () => {
    if (!gameState || !isMyTurn) return;
    playSound("roll");
    const newState = rollDice(gameState);
    setOptimisticState(newState);
    try {
      await updateGameState({ roomId, gameState: newState });
      setOptimisticState(null);
    } catch (err) {
      console.error("Failed to roll dice:", err);
      setOptimisticState(null);
    }
  }, [gameState, isMyTurn, roomId, updateGameState, playSound]);

  const handleTokenClick = useCallback(
    async (playerIndex: number, tokenIndex: number) => {
      if (!gameState || !isMyTurn) return;
      const player = gameState.players[playerIndex];
      if (player.color !== myColor) return;
      if (!gameState.movableTokens.includes(tokenIndex)) return;

      playSound("move");
      const newState = moveToken(gameState, tokenIndex);
      const lastMove = newState.moveHistory[newState.moveHistory.length - 1];
      if (lastMove?.captured) playSound("capture");
      if (newState.winner) {
        playSound("win");
        try { await endGame({ roomId, winnerColor: newState.winner }); } catch {}
      }
      setOptimisticState(newState);
      try {
        await updateGameState({ roomId, gameState: newState });
        setOptimisticState(null);
      } catch {
        setOptimisticState(null);
      }
    },
    [gameState, isMyTurn, myColor, roomId, updateGameState, endGame, playSound],
  );

  const handleRematch = useCallback(async () => {
    const newState = createInitialState(TWO_PLAYER_COLORS, playerNames);
    setOptimisticState(newState);
    setTimerPercent(100);
    try {
      await updateGameState({ roomId, gameState: newState });
      setOptimisticState(null);
    } catch {}
  }, [roomId, playerNames, updateGameState]);

  if (!gameState || !activePlayer || !myPlayer || !opponentPlayer) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="animate-pulse text-stone-400 text-sm">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center p-4">
      {/* Top bar */}
      <div className="w-full max-w-lg flex items-center justify-between mb-4">
        <button
          onClick={onLeave}
          className="text-sm text-stone-500 hover:text-stone-700 transition-colors font-medium"
        >
          ← Leave
        </button>
        <div className="flex flex-col items-center">
          <div className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            Room {roomCode}
          </div>
          <div className="text-[10px] text-stone-400">
            {isMyTurn ? "🎯 Your Turn" : `⏳ ${opponentPlayer.name}'s Turn`}
          </div>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="text-lg"
          title={soundEnabled ? "Mute" : "Unmute"}
        >
          {soundEnabled ? "🔊" : "🔇"}
        </button>
      </div>

      <div className="w-full max-w-lg flex flex-col items-center gap-3">
        {/* Opponent HUD */}
        <div className="w-full">
          <PlayerHUD
            player={opponentPlayer}
            isActive={gameState.currentPlayerIndex === opponentPlayerIndex}
            timerPercent={gameState.currentPlayerIndex === opponentPlayerIndex ? timerPercent : 0}
            isCurrentTurn={gameState.currentPlayerIndex === opponentPlayerIndex}
          />
        </div>

        {/* Board */}
        <div className="w-full max-w-[min(85vw,400px)]">
          <LudoBoard
            players={gameState.players}
            movableTokens={isMyTurn ? gameState.movableTokens : []}
            currentPlayerColor={activePlayer.color}
            onTokenClick={handleTokenClick}
          />
        </div>

        {/* My HUD */}
        <div className="w-full">
          <PlayerHUD
            player={myPlayer}
            isActive={gameState.currentPlayerIndex === myPlayerIndex}
            timerPercent={gameState.currentPlayerIndex === myPlayerIndex ? timerPercent : 0}
            isCurrentTurn={gameState.currentPlayerIndex === myPlayerIndex}
            isMe={true}
          />
        </div>

        {/* Dice & events */}
        <div className="w-full flex flex-col items-center gap-2">
          <AnimatePresence>
            {eventMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="text-sm font-medium text-stone-600 text-center"
              >
                {eventMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {!isMyTurn && gameState.phase !== "finished" && (
            <div className="flex items-center gap-2 text-stone-500 text-sm">
              <span className="animate-pulse">⏳</span>
              <span>Waiting for {opponentPlayer.name}...</span>
            </div>
          )}

          <DiceRoller
            diceValue={gameState.diceValue}
            canRoll={gameState.phase === "rolling" && !gameState.hasRolled && isMyTurn}
            playerColor={activePlayer.color}
            onRoll={handleRoll}
          />

          {gameState.phase === "moving" && gameState.movableTokens.length > 1 && isMyTurn && (
            <p className="text-xs text-stone-400">Tap a glowing token to move it</p>
          )}
        </div>
      </div>

      {gameState.winner && (
        <VictoryScreen
          winner={gameState.winner}
          gameState={gameState}
          onRematch={handleRematch}
          onLeave={onLeave}
        />
      )}
    </div>
  );
}
