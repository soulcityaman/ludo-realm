/**
 * Core Ludo Game Logic — Server-authoritative model.
 * All validation lives here; the UI just renders state and dispatches actions.
 *
 * Position encoding:
 *   -1        → at home base (not yet entered the board)
 *   0 … 51   → on the main 52-step track
 *   52 … 57  → in the player's home column (57 = finished)
 *   58+      → finished (equivalent to 57; kept as sentinel)
 */

import {
  type PlayerColor,
  TWO_PLAYER_COLORS,
  TOKENS_PER_PLAYER,
  TOTAL_PATH_STEPS,
  FINISHED_POSITION,
  HOME_COL_LENGTH,
  START_POSITIONS,
  LAST_STEPS,
  SAFE_PATH_INDICES,
  MAX_CONSECUTIVE_SIXES,
  TURN_TIME_LIMIT,
} from "./constants";

// ─── Types ───────────────────────────────────────────────────────────

export interface TokenState {
  position: number;
}

export interface PlayerState {
  color: PlayerColor;
  name: string;
  tokens: TokenState[];
  consecutiveSixes: number;
  captures: number;
}

export type GamePhase = "waiting" | "rolling" | "moving" | "finished";

export interface GameState {
  players: PlayerState[];
  currentPlayerIndex: number;
  diceValue: number | null;
  hasRolled: boolean;
  movableTokens: number[];
  phase: GamePhase;
  winner: PlayerColor | null;
  turnStartTime: number;
  turnTimeLimit: number;
  lastEvent: string | null;
  moveHistory: { color: PlayerColor; from: number; to: number; captured: boolean }[];
}

// ─── Factory ─────────────────────────────────────────────────────────

export function createInitialState(
  playerColors: PlayerColor[] = TWO_PLAYER_COLORS,
  playerNames?: Record<PlayerColor, string>,
): GameState {
  return {
    players: playerColors.map((color) => ({
      color,
      name: playerNames?.[color] ?? color,
      tokens: Array.from({ length: TOKENS_PER_PLAYER }, () => ({ position: -1 })),
      consecutiveSixes: 0,
      captures: 0,
    })),
    currentPlayerIndex: 0,
    diceValue: null,
    hasRolled: false,
    movableTokens: [],
    phase: "rolling",
    winner: null,
    turnStartTime: Date.now(),
    turnTimeLimit: TURN_TIME_LIMIT,
    lastEvent: null,
    moveHistory: [],
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────

export function currentPlayer(state: GameState): PlayerState {
  return state.players[state.currentPlayerIndex];
}

function findTokensAtPosition(
  state: GameState,
  position: number,
): { playerIndex: number; tokenIndex: number }[] {
  const results: { playerIndex: number; tokenIndex: number }[] = [];
  for (let pi = 0; pi < state.players.length; pi++) {
    const p = state.players[pi];
    for (let ti = 0; ti < p.tokens.length; ti++) {
      if (p.tokens[ti].position === position) {
        results.push({ playerIndex: pi, tokenIndex: ti });
      }
    }
  }
  return results;
}

export function isSafeSquare(position: number): boolean {
  return SAFE_PATH_INDICES.has(position);
}

export function isOnTrack(position: number): boolean {
  return position >= 0 && position <= TOTAL_PATH_STEPS - 1;
}

export function isInHomeColumn(position: number): boolean {
  return position >= TOTAL_PATH_STEPS && position < FINISHED_POSITION;
}

export function isFinished(position: number): boolean {
  return position >= FINISHED_POSITION;
}

// ─── Move Calculation ────────────────────────────────────────────────

export function calculateLandingPosition(
  color: PlayerColor,
  currentPosition: number,
  diceValue: number,
): number {
  if (currentPosition === -1) {
    return diceValue === 6 ? START_POSITIONS[color] : -1;
  }

  if (isFinished(currentPosition)) {
    return currentPosition;
  }

  if (isInHomeColumn(currentPosition)) {
    const newPos = currentPosition + diceValue;
    if (newPos > FINISHED_POSITION) {
      return currentPosition; // Can't overshoot home
    }
    return newPos;
  }

  if (isOnTrack(currentPosition)) {
    const lastStep = LAST_STEPS[color];

    // Compute remaining steps to reach the lastStep cell, then 1 more to enter home column
    const remainingSteps =
      ((lastStep - currentPosition + TOTAL_PATH_STEPS) % TOTAL_PATH_STEPS) + 1;

    if (diceValue < remainingSteps) {
      // Still on the main track — advance (wrapping around the circular path)
      return (currentPosition + diceValue) % TOTAL_PATH_STEPS;
    }

    // Entering or already in the home column
    const homeSteps = diceValue - remainingSteps; // 0 = land on first home column cell
    if (homeSteps <= HOME_COL_LENGTH) {
      return TOTAL_PATH_STEPS + homeSteps;
    }

    // Would overshoot home — stay put
    return currentPosition;
  }

  return currentPosition;
}

export function getMovableTokens(state: GameState): number[] {
  const player = currentPlayer(state);
  const dice = state.diceValue;
  if (dice === null) return [];

  const movable: number[] = [];

  for (let i = 0; i < player.tokens.length; i++) {
    const pos = player.tokens[i].position;

    if (pos === -1) {
      if (dice === 6) movable.push(i);
      continue;
    }

    if (isFinished(pos)) continue;

    const landing = calculateLandingPosition(player.color, pos, dice);
    if (landing !== pos) {
      movable.push(i);
    }
  }

  return movable;
}

// ─── Actions ─────────────────────────────────────────────────────────

export function rollDice(state: GameState): GameState {
  if (state.phase !== "rolling" || state.hasRolled || state.winner) {
    return state;
  }

  const diceValue = Math.floor(Math.random() * 6) + 1;
  const player = currentPlayer(state);

  let newConsecutiveSixes = player.consecutiveSixes;
  if (diceValue === 6) {
    newConsecutiveSixes += 1;
  } else {
    newConsecutiveSixes = 0;
  }

  // Three consecutive sixes → forfeit turn
  if (newConsecutiveSixes > MAX_CONSECUTIVE_SIXES) {
    return advanceTurn({
      ...state,
      diceValue,
      hasRolled: true,
      movableTokens: [],
      phase: "rolling",
      players: state.players.map((p, i) =>
        i === state.currentPlayerIndex
          ? { ...p, consecutiveSixes: 0 }
          : p,
      ),
      lastEvent: `${player.name} rolled three 6s in a row — turn forfeited!`,
    });
  }

  const newState: GameState = {
    ...state,
    diceValue,
    hasRolled: true,
    phase: "moving",
    turnStartTime: Date.now(),
    lastEvent: null,
  };

  // Update the player's consecutiveSixes
  newState.players = newState.players.map((p, i) =>
    i === state.currentPlayerIndex
      ? { ...p, consecutiveSixes: newConsecutiveSixes }
      : p,
  );

  const movable = getMovableTokens(newState);
  newState.movableTokens = movable;

  if (movable.length === 0) {
    return advanceTurn({
      ...newState,
      lastEvent: `${player.name} has no valid moves`,
    });
  }

  if (movable.length === 1) {
    return moveToken(newState, movable[0]);
  }

  return newState;
}

export function moveToken(state: GameState, tokenIndex: number): GameState {
  if (state.phase !== "moving" || state.winner) return state;

  const playerIdx = state.currentPlayerIndex;
  const player = state.players[playerIdx];
  const token = player.tokens[tokenIndex];
  const dice = state.diceValue;

  if (dice === null || !state.movableTokens.includes(tokenIndex)) return state;

  const fromPos = token.position;
  const toPos = calculateLandingPosition(player.color, fromPos, dice);

  if (toPos === fromPos) return state;

  let captured = false;
  let lastEvent = "";
  let currentState = { ...state };

  // Check for capture (only on main track, not safe squares)
  if (isOnTrack(toPos) && !isSafeSquare(toPos)) {
    const occupants = findTokensAtPosition(currentState, toPos);
    const enemyOccupants = occupants.filter(
      (o) => currentState.players[o.playerIndex].color !== player.color,
    );

    if (enemyOccupants.length > 0) {
      captured = true;
      lastEvent = `${player.name} captured a token!`;

      currentState = {
        ...currentState,
        players: currentState.players.map((p, pi) => {
          if (pi === playerIdx) return p;
          return {
            ...p,
            tokens: p.tokens.map((t, ti) => {
              if (enemyOccupants.some((e) => e.playerIndex === pi && e.tokenIndex === ti)) {
                return { position: -1 };
              }
              return t;
            }),
          };
        }),
      };

      currentState = {
        ...currentState,
        players: currentState.players.map((p, pi) =>
          pi === playerIdx ? { ...p, captures: p.captures + enemyOccupants.length } : p,
        ),
      };
    }
  }

  // Apply the move
  const newTokens = player.tokens.map((t, i) =>
    i === tokenIndex ? { ...t, position: toPos } : t,
  );

  const newPlayers = currentState.players.map((p, i) =>
    i === playerIdx ? { ...p, tokens: newTokens } : p,
  );

  const newState: GameState = {
    ...currentState,
    players: newPlayers,
    movableTokens: [],
    moveHistory: [
      ...currentState.moveHistory,
      { color: player.color, from: fromPos, to: toPos, captured },
    ],
    lastEvent: lastEvent || `${player.name} moved a token`,
  };

  if (newTokens.every((t) => isFinished(t.position))) {
    return {
      ...newState,
      phase: "finished",
      winner: player.color,
      lastEvent: `🎉 ${player.name} wins!`,
    };
  }

  if (dice === 6 && player.consecutiveSixes < MAX_CONSECUTIVE_SIXES) {
    return {
      ...newState,
      hasRolled: false,
      diceValue: null,
      phase: "rolling",
      turnStartTime: Date.now(),
    };
  }

  return advanceTurn(newState);
}

export function autoSkipTurn(state: GameState): GameState {
  if (state.phase === "finished" || state.winner) return state;

  if (!state.hasRolled) {
    return advanceTurn({
      ...state,
      lastEvent: `${currentPlayer(state).name}'s turn timed out`,
    });
  }

  return advanceTurn({
    ...state,
    lastEvent: `${currentPlayer(state).name} ran out of time`,
  });
}

function advanceTurn(state: GameState): GameState {
  const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;

  return {
    ...state,
    currentPlayerIndex: nextIndex,
    diceValue: null,
    hasRolled: false,
    movableTokens: [],
    phase: "rolling",
    turnStartTime: Date.now(),
  };
}
