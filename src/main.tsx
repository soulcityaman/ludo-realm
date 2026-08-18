import "@vly-ai/integrations";
import { Toaster } from "@/components/ui/sonner";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, lazy, Suspense, useState, useCallback, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import "./index.css";

import type { PlayerColor } from "@/lib/game/constants";
import { TWO_PLAYER_COLORS } from "@/lib/game/constants";

// Lazy load route components
const Landing = lazy(() => import("./pages/Landing.tsx"));
const Lobby = lazy(() => import("./components/ludo/Lobby.tsx"));
const GameView = lazy(() => import("./components/ludo/GameView.tsx"));

function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="animate-pulse text-stone-400 text-sm">Loading...</div>
    </div>
  );
}

class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: "" };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || "Unknown error" };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
          <div className="max-w-md text-center">
            <p className="text-sm font-semibold text-stone-800">Something went wrong</p>
            <p className="mt-2 text-xs text-stone-500 break-words">{this.state.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

type AppView = "landing" | "lobby" | "game";

interface RoomState {
  roomId: Id<"rooms">;
  code: string;
  playerNames: Record<PlayerColor, string>;
  isHost: boolean;
  myColor: PlayerColor;
}

/** Inner app that uses Convex hooks */
function AppInner() {
  const [view, setView] = useState<AppView>("landing");
  const [roomState, setRoomState] = useState<RoomState | null>(null);

  // Subscribe to room data for lobby
  const room = useQuery(
    api.rooms.getById,
    roomState?.roomId ? { roomId: roomState.roomId } : "skip"
  );

  const startGame = useMutation(api.rooms.startGame);

  // Check for room code in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get("room");
    if (roomCode) {
      // The Landing component handles joining via URL
      // Clear the URL param
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Handle room creation from Landing
  const handleRoomCreated = useCallback((
    roomId: Id<"rooms">,
    code: string,
    playerNames: Record<PlayerColor, string>,
    isHost: boolean,
  ) => {
    const myColor = isHost
      ? TWO_PLAYER_COLORS.find((c) => playerNames[c] !== "Player 1" && playerNames[c] !== "Player 2" && playerNames[c] !== "Player 3" && playerNames[c] !== "Player 4") ?? "red"
      : TWO_PLAYER_COLORS.find((c) => playerNames[c] !== "Host" && playerNames[c] !== "Player 1" && playerNames[c] !== "Player 2" && playerNames[c] !== "Player 3" && playerNames[c] !== "Player 4") ?? "yellow";

    setRoomState({
      roomId,
      code,
      playerNames,
      isHost,
      myColor,
    });
    setView("lobby");
  }, []);

  // Handle game start from Lobby
  const handleStartGame = useCallback(async (initialState: Parameters<typeof startGame>[0]["initialState"]) => {
    if (!roomState) return;

    try {
      const result = await startGame({
        roomId: roomState.roomId,
        initialState,
      });

      if (result && "error" in result && result.error) {
        console.error("Failed to start game:", result.error);
        return;
      }

      setView("game");
    } catch (err) {
      console.error("Failed to start game:", err);
    }
  }, [roomState, startGame]);

  // Handle leaving
  const handleLeave = useCallback(() => {
    setRoomState(null);
    setView("landing");
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  // Auto-transition to game if room status changes to playing
  useEffect(() => {
    if (room?.status === "playing" && view === "lobby" && roomState) {
      setView("game");
    }
  }, [room?.status, view, roomState]);

  return (
    <Suspense fallback={<RouteLoading />}>
      {view === "landing" && (
        <Landing onRoomCreated={handleRoomCreated} />
      )}
      {view === "lobby" && roomState && room && (
        <Lobby
          roomCode={roomState.code}
          hostName={room.hostName}
          hostColor={room.hostColor as PlayerColor}
          guestName={room.guestName ?? null}
          guestColor={room.guestColor as PlayerColor | null}
          isHost={roomState.isHost}
          onStartGame={handleStartGame}
          onLeave={handleLeave}
        />
      )}
      {view === "game" && roomState && (
        <GameView
          roomId={roomState.roomId}
          roomCode={roomState.code}
          playerNames={roomState.playerNames}
          myColor={roomState.myColor}
          isHost={roomState.isHost}
          onLeave={handleLeave}
        />
      )}
    </Suspense>
  );
}

export default function App() {
  return (
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <AppInner />
        <Toaster />
      </ConvexAuthProvider>
    </RootErrorBoundary>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
