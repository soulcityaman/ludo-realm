# 🎲 Ludo Online

A premium, production-quality web app of the classic **Ludo** board game, playable online with friends via shareable room codes. Built with **Claymorphism** design language — soft, tactile, inflated UI surfaces with pastel colors and playful depth.

## ✨ Features

- **Classic Ludo Rules** — 2-player gameplay with 4 tokens per player, dice rolling, captures, safe zones, and home columns
- **Real-time Multiplayer** — Create rooms with shareable codes (e.g., `LUDO-7XQ2`), join via link
- **Server-Authoritative** — All game logic validated server-side via Convex to prevent cheating
- **Premium Claymorphism UI** — Soft shadows, rounded surfaces, matte pastel colors, inflated depth
- **Animated Dice** — 3D-style dice with rolling animation
- **Turn Timer** — 20-second auto-skip to keep games moving
- **Sound Effects** — Satisfying audio cues for rolls, moves, captures, and wins (with mute toggle)
- **Victory Screen** — Confetti celebration with game stats
- **Responsive Design** — Works on mobile phones, tablets, and desktop from a single codebase
- **PWA Ready** — Installable on mobile home screen

## 🎮 Game Rules

- Roll a **6** to leave home and enter the track
- Rolling a **6** grants an **extra turn** (max 3 consecutive sixes = turn forfeited)
- **Capture** opponent tokens by landing on their square (sends them back home)
- **Safe zones** (⭐ star squares) protect tokens from capture
- **Exact roll** required to enter the final home column
- **Win** by getting all 4 tokens to the center home

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Tailwind CSS |
| Animations | Framer Motion + Canvas Confetti |
| Backend | Convex (real-time queries/mutations) |
| Styling | Claymorphism theme + shadcn/ui components |
| Build | Vite + Bun |

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- [Convex](https://convex.dev/) account (free tier works)

### Setup

```bash
# Install dependencies
bun install

# Start Convex dev server (generates types, pushes schema)
bunx convex dev --once

# Start the Vite dev server
bun run dev
```

The app will be available at `http://localhost:5173`.

### Environment Variables

Create a `.env.local` file with your Convex deployment URL:

```
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

## 📁 Project Structure

```
src/
├── components/
│   ├── ludo/
│   │   ├── LudoBoard.tsx      # 15×15 game board with token overlays
│   │   ├── DiceRoller.tsx     # Animated dice component
│   │   ├── PlayerHUD.tsx      # Player info, captures, timer
│   │   ├── VictoryScreen.tsx  # Win celebration with confetti
│   │   └── GameView.tsx       # Main game screen (ties everything together)
│   └── ui/                    # shadcn/ui components
├── lib/
│   └── game/
│       ├── constants.ts       # Board layout, paths, safe zones, colors
│       └── logic.ts           # Server-authoritative game engine
├── convex/
│   ├── schema.ts              # Database schema (rooms, users)
│   ├── rooms.ts               # Room CRUD mutations & queries
│   └── _generated/            # Auto-generated Convex types
├── pages/
│   └── Landing.tsx            # Landing page with Create/Join flow
├── index.css                  # Claymorphism theme tokens
└── main.tsx                   # App entry point
```

## 🎨 Design System

### Claymorphism Theme

The UI uses a **Claymorphism** design language:

- **Soft, inflated surfaces** with generous border-radius (1.5–2rem)
- **Matte pastel colors** for player tokens (Red, Green, Yellow, Blue)
- **Inflated shadows** combining outer and inner highlights
- **Tactile feedback** via hover states, scale animations, and pulse effects

### Color Palette

| Player | Base | Light | Dark |
|--------|------|-------|------|
| Red | `#E8606A` | `#F8A4AB` | `#C43A44` |
| Green | `#6BCB77` | `#A8E6B0` | `#3FA64E` |
| Yellow | `#FFD93D` | `#FFEB80` | `#E0B800` |
| Blue | `#6CB4EE` | `#A8D8F5` | `#3A8CC7` |

## 📱 Responsive Breakpoints

- **Small phones** (360px): Compact board, stacked layout
- **Large phones** (414px+): Full board, comfortable touch targets
- **Tablets** (768px+): Wider spacing, larger tokens
- **Desktop** (1280px+): Centered layout, hover states
- **Large monitors** (1920px+): Max-width constrained

## 🏗 Architecture Decisions

### Why Convex?

Convex provides real-time queries, mutations, and server-side validation out of the box — perfect for a multiplayer game where the server must be the source of truth. The reactive subscriptions ensure all connected players see the same game state instantly.

### Game State Model

Each token's position is encoded as:
- `-1` → At home base (not yet on the board)
- `0–51` → On the main 52-step track
- `52–57` → In the home column
- `58+` → Finished (reached center)

### Server-Authoritative Validation

All dice rolls and move validation happen in Convex mutations, not on the client. This prevents:
- Token manipulation
- Fake dice rolls
- Moving opponent tokens

## 🔧 Development

### Running Tests

```bash
bun tsc -b --noEmit    # Type checking
bun run lint            # Linting
```

### Building for Production

```bash
bun run build
```

## 📄 License

MIT
