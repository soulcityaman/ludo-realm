/**
 * Ludo Game Constants
 * All board layout, path, and rule definitions live here.
 * V1 scope: 2-player private rooms (Red vs Yellow).
 */

// ─── Player Colors ───────────────────────────────────────────────────
export const PLAYER_COLORS = ["red", "green", "yellow", "blue"] as const;
export type PlayerColor = (typeof PLAYER_COLORS)[number];

export const COLOR_HEX: Record<PlayerColor, { base: string; light: string; dark: string; track: string }> = {
  red:    { base: "#E8606A", light: "#F8A4AB", dark: "#C43A44", track: "#FDDFE2" },
  green:  { base: "#6BCB77", light: "#A8E6B0", dark: "#3FA64E", track: "#D6F5DA" },
  yellow: { base: "#FFD93D", light: "#FFEB80", dark: "#E0B800", track: "#FFF5CC" },
  blue:   { base: "#6CB4EE", light: "#A8D8F5", dark: "#3A8CC7", track: "#D4ECFB" },
};

export const PLAYER_NAMES: Record<PlayerColor, string> = {
  red: "Player 1",
  green: "Player 2",
  yellow: "Player 3",
  blue: "Player 4",
};

/** Colors active in a 2-player game */
export const TWO_PLAYER_COLORS: PlayerColor[] = ["red", "yellow"];

// ─── Board Geometry ──────────────────────────────────────────────────
export const BOARD_SIZE = 15;
export const TOKENS_PER_PLAYER = 4;
export const TOTAL_PATH_STEPS = 52;
export const HOME_COL_LENGTH = 6;
/** Total positions including path (0-51) + home column (52-57) + finished (58) */
export const FINISHED_POSITION = TOTAL_PATH_STEPS + HOME_COL_LENGTH; // 58

// ─── Turn Rules ──────────────────────────────────────────────────────
export const TURN_TIME_LIMIT = 20; // seconds
export const MAX_CONSECUTIVE_SIXES = 3;

// ─── Home Bases (6×6 corner regions on the 15×15 board) ──────────────
// Each corner: [rowStart..rowEnd, colStart..colEnd] (0-indexed, inclusive)
export const HOME_BASES: Record<PlayerColor, [number, number, number, number]> = {
  red:    [0,  0,  5,  5],
  green:  [0,  9,  5, 14],
  yellow: [9,  9, 14, 14],
  blue:   [9,  0, 14,  5],
};

// ─── Home Columns (5 cells leading to center) ────────────────────────
// Each is [row, col] for positions 52..56; position 57 is always center (7,7).
export const HOME_COLUMNS: Record<PlayerColor, [number, number][]> = {
  red:    [[ 7, 1], [ 7, 2], [ 7, 3], [ 7, 4], [ 7, 5]],
  green:  [[ 1, 7], [ 2, 7], [ 3, 7], [ 4, 7], [ 5, 7]],
  yellow: [[ 7,13], [7, 12], [7, 11], [7, 10], [7,  9]],
  blue:   [[13, 7], [12, 7], [11, 7], [10, 7], [ 9, 7]],
};

// ─── Token Start Positions (the path index where each token begins) ──
export const START_POSITIONS: Record<PlayerColor, number> = {
  red: 1,
  green: 14,
  yellow: 27,
  blue: 40,
};

// ─── Last Steps (the path index before entering home column) ─────────
export const LAST_STEPS: Record<PlayerColor, number> = {
  red: 51,
  green: 12,
  yellow: 25,
  blue: 38,
};

// ─── Safe Squares (tokens here cannot be captured) ───────────────────
// Each safe is identified by its path index.
export const SAFE_PATH_INDICES = new Set<number>([
  0,   // Blue start
  8,   // Star square
  13,  // Green start
  21,  // Star square
  26,  // Yellow start
  34,  // Star square
  39,  // Red start
  47,  // Star square
]);

// ─── Outer Track Path (step index → [row, col]) ──────────────────────
// 52 steps forming the ring around the board.
export const PATH_COORDS: [number, number][] = [
  // 0-11  Blue arm → Red column bottom → Red base right
  [7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],
  [14,2],[14,3],[14,4],[14,5],
  // 12-23 Blue base top → Green row left → Green base bottom
  [14,6],[14,7],[14,8],[14,9],[14,10],[14,11],[14,12],[14,13],[14,14],
  [13,14],[12,14],[11,14],
  // 24-35 Green arm → Yellow column top → Yellow base left
  [10,14],[9,14],[8,14],[7,14],[6,14],[5,14],[4,14],[3,14],[2,14],[1,14],
  [1,13],[1,12],[1,11],
  // 36-47 Green base right → Red row bottom → Red base top
  [1,10],[1,9],[1,8],[1,7],[1,6],[1,5],[1,4],[1,3],[1,2],[1,1],
  [2,1],[3,1],[4,1],
  // 48-51 Red arm → Yellow row left (→ back to 0)
  [5,1],[6,1],
];

// ─── Home Base Cell Positions (for rendering tokens at home) ──────────
// Each is [row, col] for a single token slot inside the 6×6 home base.
export const HOME_BASE_TOKEN_SLOTS: Record<PlayerColor, [number, number][]> = {
  red:    [[1,1],[1,4],[4,1],[4,4]],
  green:  [[1,10],[1,13],[4,10],[4,13]],
  yellow: [[10,10],[10,13],[13,10],[13,13]],
  blue:   [[10,1],[10,4],[13,1],[13,4]],
};

// ─── Board Cell Types (for rendering) ────────────────────────────────
export type CellType =
  | "empty"
  | "home_base"
  | "track"
  | "track_safe"
  | "home_column"
  | "center"
  | "colored_arm";

export const PLAYER_ARM_ROWS: Record<PlayerColor, number[]> = {
  red:    [5, 6],
  green:  [8, 9],
  yellow: [5, 6],
  blue:   [8, 9],
};

export const PLAYER_ARM_COLS: Record<PlayerColor, number[]> = {
  red:    [5, 6],
  green:  [5, 6],
  yellow: [8, 9],
  blue:   [8, 9],
};

/** Determine which color's home column row/column a given cell belongs to */
export function getHomeColumnColor(row: number, col: number): PlayerColor | null {
  if (row === 7 && col >= 1 && col <= 6) return "red";
  if (col === 7 && row >= 1 && row <= 6) return "green";
  if (row === 7 && col >= 9 && col <= 13) return "yellow";
  if (col === 7 && row >= 9 && row <= 13) return "blue";
  return null;
}

/** Determine which color's arm row a cell belongs to */
export function getArmColor(row: number, col: number): PlayerColor | null {
  if ((row === 5 || row === 6) && col >= 6 && col <= 8) return "red";
  if ((row === 8 || row === 9) && col >= 6 && col <= 8) return "green";
  if ((row === 5 || row === 6) && col >= 6 && col <= 8) return "yellow";
  if ((row === 8 || row === 9) && col >= 6 && col <= 8) return "blue";
  return null;
}

/** Determine what type of cell a board coordinate is */
export function getCellType(row: number, col: number): CellType {
  // Center goal
  if (row === 7 && col === 7) return "center";

  // Home columns
  if (getHomeColumnColor(row, col)) return "home_column";

  // Home bases (6×6 corners)
  for (const color of PLAYER_COLORS) {
    const [r1, c1, r2, c2] = HOME_BASES[color];
    if (row >= r1 && row <= r2 && col >= c1 && col <= c2) return "home_base";
  }

  // Colored arm cells (connecting home base to track)
  // Red arm: rows 5-6, cols 6-8
  // Green arm: rows 8-9, cols 6-8
  // Yellow arm: rows 6-7, cols 8-9 (right side)
  // Blue arm: rows 6-7, cols 6-7 (bottom side)
  // Actually these are part of the track intersection — treat as track
  // The cells at (5,6),(5,7),(5,8),(6,6),(6,7),(6,8) etc. are track cells

  // Check if this cell is on the outer track path
  for (let i = 0; i < PATH_COORDS.length; i++) {
    if (PATH_COORDS[i][0] === row && PATH_COORDS[i][1] === col) {
      return SAFE_PATH_INDICES.has(i) ? "track_safe" : "track";
    }
  }

  // Colored arm cells (the middle 2×3 sections connecting bases to center)
  // These are cells that are adjacent to the track but not on it
  // Red arm: (5,5),(6,5) → these are where red tokens enter the track
  // Actually the colored arms are the cells between the home base and the center
  // They're special colored cells:
  //   Top-left (Red): (5,6),(5,7),(5,8),(6,6),(6,7),(6,8)
  //   Top-right (Green): same row range but col 6-8
  // Wait, these are track intersection cells. Let me just check if they're colored.

  // Colored arms (the filled-color cells connecting bases to center columns)
  if (row >= 5 && row <= 6 && col >= 5 && col <= 6) return "colored_arm"; // Red arm
  if (row >= 5 && row <= 6 && col >= 8 && col <= 9) return "colored_arm"; // Green arm
  if (row >= 8 && row <= 9 && col >= 5 && col <= 6) return "colored_arm"; // Blue arm
  if (row >= 8 && row <= 9 && col >= 8 && col <= 9) return "colored_arm"; // Yellow arm

  return "empty";
}

/** Get the color of a colored arm cell */
export function getArmCellColor(row: number, col: number): PlayerColor | null {
  if (row >= 5 && row <= 6 && col >= 5 && col <= 6) return "red";
  if (row >= 5 && row <= 6 && col >= 8 && col <= 9) return "green";
  if (row >= 8 && row <= 9 && col >= 5 && col <= 6) return "blue";
  if (row >= 8 && row <= 9 && col >= 8 && col <= 9) return "yellow";
  return null;
}

/** Convert a token's logical position to a board [row, col] */
export function getBoardPosition(
  color: PlayerColor,
  position: number,
): [number, number] | null {
  if (position === -1) return null; // At home
  if (position >= FINISHED_POSITION) return [7, 7]; // Finished → center
  if (position >= TOTAL_PATH_STEPS) {
    // In home column (52-57)
    const homeIndex = position - TOTAL_PATH_STEPS; // 0-5
    if (homeIndex < HOME_COLUMNS[color].length) {
      return HOME_COLUMNS[color][homeIndex];
    }
    return [7, 7]; // Position 57 → center
  }
  // On main path (0-51)
  return PATH_COORDS[position];
}
