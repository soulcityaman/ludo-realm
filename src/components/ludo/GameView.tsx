/**
 * GameView — the complete game screen for an active Ludo game.
 * Combines board, dice, HUDs, turn timer, and victory overlay.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LudoBoard from "./LudoBoard";
import DiceRoller from "./DiceRoller";
import PlayerHUD from "./PlayerHUD";
import VictoryScreen from "./VictoryScreen";
import {
  type PlayerColor,
  TWO_PLAYER_COLORS,
  TURN_TIME_LIMIT,
  COLOR_HEX,
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
  playerNames: Record<PlayerColor, string>;
  onLeave: () => void;
}

export default function GameView({ playerNames, onLeave }: GameViewProps) {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialState(TWO_PLAYER_COLORS, playerNames),
  );
  const [timerPercent, setTimerPercent] = useState(100);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [eventMessage, setEventMessage] = useState<string | null>(null);

  const activePlayer = currentPlayer(gameState);
  const isMyTurn = true; // In local play, both players share the device

  // ─── Timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState.phase === "finished") return;

    setTimerPercent(100);

    timerRef.current = setInterval(() => {
      setTimerPercent((prev) => {
        const next = prev - 100 / (TURN_TIME_LIMIT * 10); // Update every 100ms
        if (next <= 0) {
          // Auto-skip
          setGameState((prev) => autoSkipTurn(prev));
          return 100;
        }
        return next;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.currentPlayerIndex, gameState.phase]);

  // ─── Event messages ──────────────────────────────────────────────
  useEffect(() => {
    if (gameState.lastEvent) {
      setEventMessage(gameState.lastEvent);
      const timeout = setTimeout(() => setEventMessage(null), 2500);
      return () => clearTimeout(timeout);
    }
  }, [gameState.lastEvent, gameState.moveHistory.length]);

  // ─── Sound effects ───────────────────────────────────────────────
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
            osc.type = "sine";
            gain.gain.value = 0.1;
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
            break;
          case "move":
            osc.frequency.value = 523;
            osc.type = "sine";
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
            osc.type = "sine";
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

  // ─── Actions ─────────────────────────────────────────────────────
  const handleRoll = useCallback(() => {
    playSound("roll");
    setGameState((prev) => rollDice(prev));
  }, [playSound]);

  const handleTokenClick = useCallback(
    (playerIndex: number, tokenIndex: number) => {
      const player = gameState.players[playerIndex];
      if (player.color !== activePlayer.color) return;
      if (!gameState.movableTokens.includes(tokenIndex)) return;

      const token = gameState.players[playerIndex].tokens[tokenIndex];
      const wasOnBoard = token.position >= 0 && token.position < 58;

      playSound("move");
      setGameState((prev) => {
        const newState = moveToken(prev, tokenIndex);
        // Check if a capture happened
        const lastMove = newState.moveHistory[newState.moveHistory.length - 1];
        if (lastMove?.captured) {
          playSound("capture");
        }
        if (newState.winner) {
          playSound("win");
        }
        return newState;
      });
    },
    [gameState, activePlayer, playSound],
  );

  const handleRematch = useCallback(() => {
    setGameState(createInitialState(TWO_PLAYER_COLORS, playerNames));
    setTimerPercent(100);
  }, [playerNames]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-orange-50/30 to-stone-100 flex flex-col items-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: COLOR_HEX.red.light }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ backgroundColor: COLOR_HEX.yellow.light }}
        />
      </div>

      {/* Top bar */}
      <div className="w-full max-w-lg flex items-center justify-between mb-4 relative z-10">
        <button
          onClick={onLeave}
          className="text-sm text-stone-500 hover:text-stone-700 transition-colors font-medium"
        >
          ← Leave
        </button>
        <div className="text-xs font-medium text-stone-400 uppercase tracking-wider">
          Ludo
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="text-lg"
          title={soundEnabled ? "Mute sounds" : "Enable sounds"}
        >
          {soundEnabled ? "🔊" : "🔇"}
        </button>
      </div>

      <div className="w-full max-w-lg flex flex-col items-center gap-4 relative z-10">
        {/* Top player HUD */}
        <div className="w-full">
          <PlayerHUD
            player={gameState.players[0]}
            isActive={gameState.currentPlayerIndex === 0}
            timerPercent={gameState.currentPlayerIndex === 0 ? timerPercent : 0}
            isCurrentTurn={gameState.currentPlayerIndex === 0}
          />
        </div>

        {/* Board */}
        <div className="w-full max-w-[min(85vw,420px)]">
          <LudoBoard
            players={gameState.players}
            movableTokens={gameState.movableTokens}
            currentPlayerColor={activePlayer.color}
            onTokenClick={handleTokenClick}
          />
        </div>

        {/* Bottom player HUD */}
        <div className="w-full">
          <PlayerHUD
            player={gameState.players[1]}
            isActive={gameState.currentPlayerIndex === 1}
            timerPercent={gameState.currentPlayerIndex === 1 ? timerPercent : 0}
            isCurrentTurn={gameState.currentPlayerIndex === 1}
          />
        </div>

        {/* Dice & event area */}
        <div className="w-full flex flex-col items-center gap-3">
          {/* Event message */}
          <AnimatePresence>
            {eventMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-sm font-medium text-stone-600 text-center"
              >
                {eventMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dice roller */}
          <DiceRoller
            diceValue={gameState.diceValue}
            canRoll={gameState.phase === "rolling" && !gameState.hasRolled}
            playerColor={activePlayer.color}
            onRoll={handleRoll}
          />

          {/* Instruction */}
          {gameState.phase === "moving" && gameState.movableTokens.length > 1 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-stone-400"
            >
              Tap a glowing token to move it
            </motion.p>
          )}
        </div>
      </div>

      {/* Victory overlay */}
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
