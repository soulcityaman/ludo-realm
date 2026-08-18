import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { CSSProperties } from "react";
import type { PlayerColor } from "@/lib/game/constants";
import { COLOR_HEX } from "@/lib/game/constants";

interface DiceRollerProps {
  diceValue: number | null;
  canRoll: boolean;
  playerColor: PlayerColor;
  onRoll: () => void;
}

const DICE_DOTS: Record<
  number,
  [number, number][]
> = {
  1: [[1, 1]],
  2: [
    [0, 2],
    [2, 0],
  ],
  3: [
    [0, 2],
    [1, 1],
    [2, 0],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 2],
  ],
};

function DiceFace({
  value,
}: {
  value: number;
}) {
  return (
    <div
      className="premium-dice-face"
      aria-hidden="true"
    >
      {(DICE_DOTS[value] ?? DICE_DOTS[1]).map(
        ([row, col], i) => (
          <span
            key={i}
            className="premium-die-dot"
            style={{
              left: `${col * 50}%`,
              top: `${row * 50}%`,
            }}
          />
        ),
      )}
    </div>
  );
}

export default function DiceRoller({
  diceValue,
  canRoll,
  playerColor,
  onRoll,
}: DiceRollerProps) {
  const [rolling, setRolling] = useState(false);
  const [display, setDisplay] = useState(
    diceValue ?? 1,
  );

  const timeoutRef =
    useRef<number | null>(null);

  const settleRef =
    useRef<number | null>(null);

  const frameRef =
    useRef<number | null>(null);

  const rollStartRef = useRef(0);

  const hex = COLOR_HEX[playerColor];

  const finishRoll = useCallback(() => {
    if (diceValue !== null) {
      setDisplay(diceValue);
    }

    setRolling(false);
  }, [diceValue]);

  const handleRoll = useCallback(() => {
    if (!canRoll || rolling) return;

    setRolling(true);

    rollStartRef.current =
      performance.now();

    const tick = (now: number) => {
      if (
        now - rollStartRef.current <
        420
      ) {
        setDisplay(
          (prev) => (prev % 6) + 1,
        );

        frameRef.current =
          requestAnimationFrame(tick);
      }
    };

    frameRef.current =
      requestAnimationFrame(tick);

    timeoutRef.current =
      window.setTimeout(() => {
        onRoll();

        settleRef.current =
          window.setTimeout(
            () => setRolling(false),
            700,
          );
      }, 420);
  }, [canRoll, rolling, onRoll]);

  useEffect(() => {
    if (!rolling && diceValue !== null) {
      setDisplay(diceValue);
    }
  }, [diceValue, rolling]);

  useEffect(() => {
    if (rolling && diceValue !== null) {
      finishRoll();
    }
  }, [
    diceValue,
    rolling,
    finishRoll,
  ]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(
          timeoutRef.current,
        );
      }

      if (settleRef.current) {
        window.clearTimeout(
          settleRef.current,
        );
      }

      if (frameRef.current) {
        cancelAnimationFrame(
          frameRef.current,
        );
      }
    };
  }, []);

  return (
    <div className="dice-control">
      <button
        type="button"
        className={`dice-button ${
          canRoll && !rolling
            ? "dice-button-ready"
            : ""
        }`}
        style={
          {
            "--dice-accent": hex.base,
          } as CSSProperties
        }
        onClick={handleRoll}
        disabled={!canRoll || rolling}
        aria-label={
          canRoll
            ? "Roll dice"
            : "Waiting for turn"
        }
      >
        <span
          className={
            rolling
              ? "dice-stage dice-stage-rolling"
              : "dice-stage"
          }
        >
          <DiceFace value={display} />
        </span>
      </button>

      <div className="dice-meta">
        <span
          className="dice-value"
          style={{ color: hex.base }}
        >
          {rolling
            ? "ROLLING"
            : diceValue ?? "READY"}
        </span>

        <span className="dice-hint">
          {canRoll && !rolling
            ? "Tap the dice to roll"
            : rolling
              ? "Making your move…"
              : "Opponent's turn"}
        </span>
      </div>
    </div>
  );
}
