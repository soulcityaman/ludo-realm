import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";

import type { PlayerColor } from "@/lib/game/constants";
import { TWO_PLAYER_COLORS } from "@/lib/game/constants";

// Lazy load route components
const Landing = lazy(() => import("./pages/Landing.tsx"));
const GameView = lazy(() => import("./components/ludo/GameView.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

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

type AppView = "landing" | "game";

export default function App() {
  const [view, setView] = useState<AppView>("landing");
  const [playerNames, setPlayerNames] = useState<Record<PlayerColor, string>>({
    red: "Player 1",
    green: "Player 2",
    yellow: "Player 3",
    blue: "Player 4",
  });
  const [roomCode, setRoomCode] = useState<string | null>(null);

  const handleCreateRoom = useCallback((hostName: string, hostColor: PlayerColor) => {
    // For V1 local play, start game directly
    const names = { ...playerNames };
    names[hostColor] = hostName;
    // Assign opponent
    const opponentColor = TWO_PLAYER_COLORS.find((c) => c !== hostColor) ?? "yellow";
    if (hostColor === "red") {
      names.yellow = hostName + " (Guest)";
    } else {
      names.red = hostName + " (Guest)";
    }
    setPlayerNames(names);
    setRoomCode("LOCAL");
    setView("game");
  }, [playerNames]);

  const handleJoinRoom = useCallback((code: string, guestName: string, guestColor: PlayerColor) => {
    // For V1 local play, start game directly
    const names = { ...playerNames };
    names[guestColor] = guestName;
    const hostColor = TWO_PLAYER_COLORS.find((c) => c !== guestColor) ?? "red";
    if (guestColor === "yellow") {
      names.red = "Player 1";
    } else {
      names.yellow = "Player 1";
    }
    setPlayerNames(names);
    setRoomCode(code);
    setView("game");
  }, [playerNames]);

  const handleLeave = useCallback(() => {
    setView("landing");
    setRoomCode(null);
  }, []);

  return (
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <Suspense fallback={<RouteLoading />}>
          {view === "landing" && (
            <Landing
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
            />
          )}
          {view === "game" && (
            <GameView
              playerNames={playerNames}
              onLeave={handleLeave}
            />
          )}
        </Suspense>
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
