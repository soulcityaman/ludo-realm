/**
 * Targeted tests for core Ludo game logic.
 * Covers: calculateLandingPosition (circular track), isFinished/isInHomeColumn,
 * getMovableTokens, rollDice, moveToken, autoSkipTurn.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createInitialState,
  currentPlayer,
  calculateLandingPosition,
  getMovableTokens,
  isSafeSquare,
  isOnTrack,
  isInHomeColumn,
  isFinished,
  rollDice,
  moveToken,
  autoSkipTurn,
  type GameState,
} from "./logic";
import {
  TWO_PLAYER_COLORS,
  TOTAL_PATH_STEPS,
  FINISHED_POSITION,
  HOME_COL_LENGTH,
  START_POSITIONS,
  LAST_STEPS,
  TOKENS_PER_PLAYER,
  type PlayerColor,
} from "./constants";

// ─── Constant sanity checks ─────────────────────────────────────────
describe("constants", () => {
  it("FINISHED_POSITION = TOTAL_PATH_STEPS + HOME_COL_LENGTH = 57", () => {
    expect(FINISHED_POSITION).toBe(TOTAL_PATH_STEPS + HOME_COL_LENGTH);
    expect(FINISHED_POSITION).toBe(57);
  });

  it("HOME_COL_LENGTH = 5 (5 colored cells before home)", () => {
    expect(HOME_COL_LENGTH).toBe(5);
  });

  it("TOTAL_PATH_STEPS = 52", () => {
    expect(TOTAL_PATH_STEPS).toBe(52);
  });
});

// ─── Position predicates ─────────────────────────────────────────────
describe("position predicates", () => {
  it("isOnTrack: 0-51 are on track", () => {
    expect(isOnTrack(0)).toBe(true);
    expect(isOnTrack(51)).toBe(true);
    expect(isOnTrack(52)).toBe(false);
    expect(isOnTrack(-1)).toBe(false);
  });

  it("isInHomeColumn: 52-56 are in home column", () => {
    expect(isInHomeColumn(52)).toBe(true);
    expect(isInHomeColumn(56)).toBe(true);
    expect(isInHomeColumn(57)).toBe(false); // 57 = finished
    expect(isInHomeColumn(51)).toBe(false);
  });

  it("isFinished: >= 57 is finished", () => {
    expect(isFinished(57)).toBe(true);
    expect(isFinished(58)).toBe(true);
    expect(isFinished(56)).toBe(false);
    expect(isFinished(-1)).toBe(false);
  });
});

// ─── calculateLandingPosition ────────────────────────────────────────
describe("calculateLandingPosition", () => {
  // ── Home base entry ──
  describe("entering from home base", () => {
    it("requires a 6 to leave home", () => {
      expect(calculateLandingPosition("red", -1, 6)).toBe(START_POSITIONS.red);
      expect(calculateLandingPosition("red", -1, 1)).toBe(-1);
      expect(calculateLandingPosition("green", -1, 5)).toBe(-1);
    });

    it("each color enters at their own start position", () => {
      for (const color of TWO_PLAYER_COLORS) {
        expect(calculateLandingPosition(color, -1, 6)).toBe(START_POSITIONS[color]);
      }
    });
  });

  // ── On-track movement ──
  describe("on-track movement", () => {
    it("red advances normally on the track", () => {
      // Red at position 1, rolling 3 → position 4
      expect(calculateLandingPosition("red", 1, 3)).toBe(4);
    });

    it("red wraps around the circular track (past 51 → wraps to 0+)", () => {
      // Red lastStep = 51. From position 49, rolling 4:
      // remainingSteps = (51-49+52)%52 + 1 = 3. dice(4) >= 3 → enter home column.
      // Actually from 49, rolling 2 → should still be on track
      expect(calculateLandingPosition("red", 49, 2)).toBe(51);
    });

    it("green wraps around the circular track correctly", () => {
      // Green at position 48, lastStep = 12
      // remainingSteps = (12-48+52)%52 + 1 = 17. dice(6) < 17 → on track.
      // newPos = (48+6)%52 = 2
      expect(calculateLandingPosition("green", 48, 6)).toBe(2);
    });

    it("green at position 50, rolling 3 → wraps to position 1", () => {
      // remainingSteps = (12-50+52)%52 + 1 = 15. 3 < 15 → on track.
      // newPos = (50+3)%52 = 1
      expect(calculateLandingPosition("green", 50, 3)).toBe(1);
    });

    it("blue wraps correctly", () => {
      // Blue lastStep = 38. At position 36, rolling 4:
      // remainingSteps = (38-36+52)%52 + 1 = 3. dice(4) >= 3 → enter home column.
      // homeSteps = 4 - 3 = 1. Position = 52 + 1 = 53.
      expect(calculateLandingPosition("blue", 36, 4)).toBe(53);
    });

    it("yellow wraps correctly", () => {
      // Yellow lastStep = 25. At position 23, rolling 4:
      // remainingSteps = (25-23+52)%52 + 1 = 3. dice(4) >= 3 → enter home column.
      // homeSteps = 4 - 3 = 1. Position = 52 + 1 = 53.
      expect(calculateLandingPosition("yellow", 23, 4)).toBe(53);
    });
  });

  // ── Entering home column from track ──
  describe("entering home column from track", () => {
    it("red at lastStep (51), rolling 1 → first home column cell (52)", () => {
      expect(calculateLandingPosition("red", 51, 1)).toBe(52);
    });

    it("red at lastStep (51), rolling 5 → position 56", () => {
      expect(calculateLandingPosition("red", 51, 5)).toBe(56);
    });

    it("red at lastStep (51), rolling 6 → position 57 (home/finished)", () => {
      // remainingSteps = 1, homeSteps = 5, position = 52 + 5 = 57
      expect(calculateLandingPosition("red", 51, 6)).toBe(57);
    });

    it("red at position 49, rolling 4 → enters home column at 53", () => {
      // remainingSteps = (51-49+52)%52 + 1 = 3. homeSteps = 1. Position = 53.
      expect(calculateLandingPosition("red", 49, 4)).toBe(53);
    });

    it("red at position 46, rolling 6 → enters home column at 52", () => {
      // remainingSteps = (51-46+52)%52 + 1 = 6. homeSteps = 0. Position = 52.
      expect(calculateLandingPosition("red", 46, 6)).toBe(52);
    });

    it("green at position 10, rolling 5 → enters home column at 54", () => {
      // Green lastStep = 12. remainingSteps = (12-10+52)%52 + 1 = 3.
      // homeSteps = 5 - 3 = 2. Position = 52 + 2 = 54.
      expect(calculateLandingPosition("green", 10, 5)).toBe(54);
    });

    it("green at position 10, rolling 6 → enters home column at 55", () => {
      // homeSteps = 6 - 3 = 3. Position = 52 + 3 = 55.
      expect(calculateLandingPosition("green", 10, 6)).toBe(55);
    });

    it("green at lastStep (12), rolling 6 → home (57)", () => {
      // remainingSteps = 1, homeSteps = 5, position = 57.
      expect(calculateLandingPosition("green", 12, 6)).toBe(57);
    });

    it("overshooting home column stays put", () => {
      // Red at position 55 (home col index 3), rolling 4:
      // newPos = 55 + 4 = 59 > 57 → stay at 55
      expect(calculateLandingPosition("red", 55, 4)).toBe(55);
    });

    it("exactly reaching home (57) is valid", () => {
      // Red at position 56 (home col index 4), rolling 1: 56+1 = 57 ≤ 57 → 57
      expect(calculateLandingPosition("red", 56, 1)).toBe(57);
    });
  });

  // ── Home column movement ──
  describe("home column movement", () => {
    it("advances within the home column", () => {
      expect(calculateLandingPosition("red", 52, 3)).toBe(55);
      expect(calculateLandingPosition("red", 53, 2)).toBe(55);
    });

    it("clamps at home (57) — cannot overshoot", () => {
      expect(calculateLandingPosition("red", 56, 2)).toBe(56);
      expect(calculateLandingPosition("red", 55, 3)).toBe(55);
    });

    it("reaching exactly 57 (home) works", () => {
      expect(calculateLandingPosition("red", 54, 3)).toBe(57);
      expect(calculateLandingPosition("red", 56, 1)).toBe(57);
    });
  });

  // ── Finished token ──
  describe("finished token", () => {
    it("cannot move from position 57", () => {
      expect(calculateLandingPosition("red", 57, 6)).toBe(57);
    });

    it("cannot move from position 58+", () => {
      expect(calculateLandingPosition("red", 58, 6)).toBe(58);
    });
  });
});

// ─── getMovableTokens ────────────────────────────────────────────────
describe("getMovableTokens", () => {
  function stateWithTokens(
    color: PlayerColor,
    positions: number[],
    dice: number,
  ): GameState {
    const s = createInitialState([color]);
    s.diceValue = dice;
    s.hasRolled = true;
    s.phase = "moving";
    s.players[0].tokens = positions.map((p) => ({ position: p }));
    return s;
  }

  it("returns empty when dice is null", () => {
    const s = createInitialState(["red"]);
    s.diceValue = null;
    expect(getMovableTokens(s)).toEqual([]);
  });

  it("home tokens only movable on a 6", () => {
    const s = stateWithTokens("red", [-1, -1, -1, -1], 6);
    expect(getMovableTokens(s)).toEqual([0, 1, 2, 3]);

    const s2 = stateWithTokens("red", [-1, -1, -1, -1], 3);
    expect(getMovableTokens(s2)).toEqual([]);
  });

  it("finished tokens are never movable", () => {
    const s = stateWithTokens("red", [57, 57, 57, 57], 6);
    expect(getMovableTokens(s)).toEqual([]);
  });

  it("on-track token that can enter home column is movable", () => {
    // Red at 51 (lastStep), rolling 1 → 52
    const s = stateWithTokens("red", [51], 1);
    expect(getMovableTokens(s)).toEqual([0]);
  });

  it("on-track token that would overshoot home stays put (not movable)", () => {
    // Red at 55 (home col), rolling 4 → stays
    const s = stateWithTokens("red", [55], 4);
    expect(getMovableTokens(s)).toEqual([]);
  });

  it("green token wrapping the track is movable", () => {
    // Green at 50, rolling 3 → wraps to position 1
    const s = stateWithTokens("green", [50], 3);
    expect(getMovableTokens(s)).toEqual([0]);
  });
});

// ─── isSafeSquare ────────────────────────────────────────────────────
describe("isSafeSquare", () => {
  it("start positions are safe", () => {
    expect(isSafeSquare(0)).toBe(true);  // Blue start
    expect(isSafeSquare(13)).toBe(true); // Green start
    expect(isSafeSquare(26)).toBe(true); // Yellow start
    expect(isSafeSquare(39)).toBe(true); // Red start
  });

  it("star squares are safe", () => {
    expect(isSafeSquare(8)).toBe(true);
    expect(isSafeSquare(21)).toBe(true);
    expect(isSafeSquare(34)).toBe(true);
    expect(isSafeSquare(47)).toBe(true);
  });

  it("non-safe positions are not safe", () => {
    expect(isSafeSquare(1)).toBe(false);
    expect(isSafeSquare(5)).toBe(false);
    expect(isSafeSquare(20)).toBe(false);
  });
});

// ─── rollDice ────────────────────────────────────────────────────────
describe("rollDice", () => {
  it("returns state unchanged if not in rolling phase", () => {
    const s = createInitialState();
    s.phase = "moving";
    expect(rollDice(s)).toBe(s);
  });

  it("returns state unchanged if already rolled", () => {
    const s = createInitialState();
    s.hasRolled = true;
    expect(rollDice(s)).toBe(s);
  });

  it("returns state unchanged if game is finished", () => {
    const s = createInitialState();
    s.winner = "red";
    expect(rollDice(s)).toBe(s);
  });

  it("rolls a value between 1 and 6 and auto-moves single token", () => {
    // With exactly 1 movable token, rollDice auto-moves it and advances turn.
    // diceValue gets reset to null by advanceTurn in moveToken path.
    vi.spyOn(Math, "random").mockReturnValue(0.5); // floor(0.5*6)+1 = 4
    const s = createInitialState();
    s.players[0].tokens[0] = { position: 10 }; // On track, 3 other tokens at home
    const result = rollDice(s);
    // Token moved from 10 to 14 (10+4), turn advanced, diceValue reset
    expect(result.players[0].tokens[0].position).toBe(14);
    expect(result.currentPlayerIndex).toBe(1); // Turn advanced
    vi.restoreAllMocks();
  });

  it("rolls a 6 with multiple home tokens → stays in moving phase", () => {
    // With 4 home tokens and a 6, all 4 are movable → returns state (no auto-move)
    vi.spyOn(Math, "random").mockReturnValue(0.99); // 6
    const s = createInitialState();
    const result = rollDice(s);
    expect(result.diceValue).toBe(6);
    expect(result.phase).toBe("moving");
    expect(result.movableTokens).toEqual([0, 1, 2, 3]);
    vi.restoreAllMocks();
  });

  it("advances turn when no moves available", () => {
    // All tokens finished → no moves on any roll
    const s = createInitialState();
    s.players[0].tokens = [{ position: 57 }, { position: 57 }, { position: 57 }, { position: 57 }];
    // Roll any non-6 value → no moves → auto-advance
    vi.spyOn(Math, "random").mockReturnValue(0); // yields 1
    const result = rollDice(s);
    expect(result.currentPlayerIndex).toBe(1); // Turn advanced to player 2
    vi.restoreAllMocks();
  });

  it("forfeits turn after 3+ consecutive sixes", () => {
    const s = createInitialState();
    s.players[0].consecutiveSixes = 3; // Already at max
    vi.spyOn(Math, "random").mockReturnValue(0.99); // yields 6
    const result = rollDice(s);
    expect(result.currentPlayerIndex).toBe(1); // Turn advanced
    expect(result.players[0].consecutiveSixes).toBe(0); // Reset
    vi.restoreAllMocks();
  });
});

// ─── moveToken ───────────────────────────────────────────────────────
describe("moveToken", () => {
  it("does nothing if phase is not 'moving'", () => {
    const s = createInitialState();
    s.phase = "rolling";
    expect(moveToken(s, 0)).toBe(s);
  });

  it("does nothing if game is finished", () => {
    const s = createInitialState();
    s.phase = "moving";
    s.winner = "red";
    expect(moveToken(s, 0)).toBe(s);
  });

  it("does nothing if token is not in movableTokens", () => {
    const s = createInitialState();
    s.phase = "moving";
    s.diceValue = 6;
    s.movableTokens = [0];
    expect(moveToken(s, 1)).toBe(s);
  });

  it("moves a home token onto the board with dice 6", () => {
    const s = createInitialState();
    s.phase = "moving";
    s.diceValue = 6;
    s.movableTokens = [0];
    const result = moveToken(s, 0);
    expect(result.players[0].tokens[0].position).toBe(START_POSITIONS.red);
  });

  it("auto-advances turn after moving (non-6 roll)", () => {
    const s = createInitialState();
    s.phase = "moving";
    s.diceValue = 3;
    s.movableTokens = [0];
    s.players[0].tokens = [{ position: 0 }, { position: -1 }, { position: -1 }, { position: -1 }];
    const result = moveToken(s, 0);
    expect(result.players[0].tokens[0].position).toBe(3);
    expect(result.currentPlayerIndex).toBe(1); // Turn advanced
  });

  it("gives extra turn on rolling a 6", () => {
    const s = createInitialState();
    s.phase = "moving";
    s.diceValue = 6;
    s.movableTokens = [0];
    const result = moveToken(s, 0);
    expect(result.players[0].tokens[0].position).toBe(START_POSITIONS.red);
    expect(result.currentPlayerIndex).toBe(0); // Same player's turn
    expect(result.phase).toBe("rolling");
    expect(result.hasRolled).toBe(false);
  });

  it("detects capture and sends enemy home", () => {
    const s = createInitialState(["red", "yellow"]);
    s.phase = "moving";
    s.diceValue = 1;
    s.movableTokens = [0];
    s.players[0].tokens = [
      { position: 2 }, // Red at position 2
      { position: -1 },
      { position: -1 },
      { position: -1 },
    ];
    s.players[1].tokens = [
      { position: 3 }, // Yellow at position 3 (will be captured)
      { position: -1 },
      { position: -1 },
      { position: -1 },
    ];

    const result = moveToken(s, 0);
    expect(result.players[0].tokens[0].position).toBe(3);
    expect(result.players[1].tokens[0].position).toBe(-1); // Sent home
    expect(result.players[0].captures).toBe(1);
    expect(result.lastEvent).toContain("captured");
  });

  it("does not capture on safe squares", () => {
    const s = createInitialState(["red", "yellow"]);
    s.phase = "moving";
    s.diceValue = 1;
    s.movableTokens = [0];
    s.players[0].tokens = [
      { position: 7 }, // Red at 7, rolling 1 → 8 (safe square)
      { position: -1 },
      { position: -1 },
      { position: -1 },
    ];
    s.players[1].tokens = [
      { position: 8 }, // Yellow at 8 (safe square)
      { position: -1 },
      { position: -1 },
      { position: -1 },
    ];

    const result = moveToken(s, 0);
    expect(result.players[0].tokens[0].position).toBe(8);
    // Yellow token should NOT be captured (safe square)
    expect(result.players[1].tokens[0].position).toBe(8);
  });

  it("detects winner when all 4 tokens reach home", () => {
    const s = createInitialState(["red"]);
    s.phase = "moving";
    s.diceValue = 3;
    s.movableTokens = [0];
    s.players[0].tokens = [
      { position: 54 }, // Will move to 57 (home)
      { position: 57 },
      { position: 57 },
      { position: 57 },
    ];

    const result = moveToken(s, 0);
    expect(result.winner).toBe("red");
    expect(result.phase).toBe("finished");
  });

  it("token entering home column from track records correct from/to", () => {
    const s = createInitialState();
    s.phase = "moving";
    s.diceValue = 3;
    s.movableTokens = [0];
    s.players[0].tokens = [
      { position: 50 },
      { position: -1 },
      { position: -1 },
      { position: -1 },
    ];

    const result = moveToken(s, 0);
    // Red at 50, lastStep=51, remainingSteps=2, dice=3, homeSteps=1, pos=53
    expect(result.players[0].tokens[0].position).toBe(53);
    expect(result.moveHistory).toHaveLength(1);
    expect(result.moveHistory[0]).toEqual({
      color: "red",
      from: 50,
      to: 53,
      captured: false,
    });
  });
});

// ─── autoSkipTurn ────────────────────────────────────────────────────
describe("autoSkipTurn", () => {
  it("does nothing if game is finished", () => {
    const s = createInitialState();
    s.winner = "red";
    s.phase = "finished";
    expect(autoSkipTurn(s)).toBe(s);
  });

  it("advances turn when player hasn't rolled", () => {
    const s = createInitialState();
    s.hasRolled = false;
    const result = autoSkipTurn(s);
    expect(result.currentPlayerIndex).toBe(1);
    expect(result.lastEvent).toContain("timed out");
  });

  it("advances turn when player rolled but didn't move", () => {
    const s = createInitialState();
    s.hasRolled = true;
    s.diceValue = 3;
    const result = autoSkipTurn(s);
    expect(result.currentPlayerIndex).toBe(1);
    expect(result.lastEvent).toContain("out of time");
  });
});

// ─── Full game flow ──────────────────────────────────────────────────
describe("full game flow", () => {
  it("createInitialState produces valid starting state", () => {
    const s = createInitialState();
    expect(s.players).toHaveLength(2);
    expect(s.players[0].color).toBe("red");
    expect(s.players[1].color).toBe("yellow");
    expect(s.phase).toBe("rolling");
    expect(s.winner).toBeNull();
    expect(s.players[0].tokens.every((t) => t.position === -1)).toBe(true);
  });

  it("red can roll 6, enter board, then advance", () => {
    const s = createInitialState(); // 2 players: red + yellow

    // Step 1: Roll a 6
    vi.spyOn(Math, "random").mockReturnValue(0.99); // 6
    let state = rollDice(s);
    expect(state.diceValue).toBe(6);
    expect(state.movableTokens).toEqual([0, 1, 2, 3]); // All 4 at home

    // Step 2: Move token 0 — with 4 movable tokens, rollDice doesn't auto-move
    state = moveToken(state, 0);
    expect(state.players[0].tokens[0].position).toBe(START_POSITIONS.red);
    // Extra turn because dice was 6
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.phase).toBe("rolling");

    // Step 3: Roll a non-6 — single movable token → auto-move → advances turn
    vi.spyOn(Math, "random").mockReturnValue(0.33); // floor(1.98)+1 = 2
    state = rollDice(state);
    // Token at START_POSITIONS.red (1), rolling 2 → position 3
    expect(state.players[0].tokens[0].position).toBe(3);
    // Turn advanced to player 2 since dice wasn't 6
    expect(state.currentPlayerIndex).toBe(1);

    vi.restoreAllMocks();
  });

  it("game plays through to completion (fast path)", () => {
    // This tests that tokens can reach home via the home column
    const s = createInitialState(["red"]);

    // Place red token at lastStep (51)
    s.players[0].tokens = [
      { position: 51 },
      { position: 57 },
      { position: 57 },
      { position: 57 },
    ];
    s.phase = "moving";
    s.diceValue = 6;
    s.movableTokens = [0];

    // Move: should land on 57 (home) and win
    const result = moveToken(s, 0);
    expect(result.players[0].tokens[0].position).toBe(57);
    expect(result.winner).toBe("red");
    expect(result.phase).toBe("finished");
  });
});
