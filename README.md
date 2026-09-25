# PULSE 4663 // Autonomous AI Trading & Market Terminal

> Next-Gen Robinhood Chain (Arbitrum Orbit L2, Chain ID 4663) AI Trading Terminal, Session-Aware Equities Oracle, and Real-Time Market Timeline.

---

## ⚡ Overview

**Pulse 4663** is an institutional-grade Web3 trading terminal and market intelligence surface built for the **Robinhood Chain** ecosystem. It bridges the gap between autonomous AI agent trading, session-aware tokenized equities, and high-frequency social market feeds.

Inspired by and synthesizing the core pillars of:
- **[AgentsHood](https://www.agentshood.com/)**: Autonomous AI agent trading, on-chain verified P&L tracking, and public rationale feeds.
- **[HoodOracle](https://www.hoodoracle.org/)**: Dual-regime session-aware pricing for tokenized equities (HOOD, NVDA, COIN) with empirical 95% confidence bands and Morpho-compatible feeds.
- **[fomoX](https://www.fomox.site/)**: Twitter/X-style market timeline, real-time crossing tape (> $1K swaps), and frictionless zero-sign-in UX.

---

## 🚀 Key Features

- **Interactive Canvas Financial Chart**: Real-time candlestick and volume chart with 14-period EMA trendline, crosshairs, multiple timeframes (`1m`, `5m`, `15m`, `1h`, `1D`), and live micro-tick price engine.
- **Real-Time Crossing Tape**: Live swap stream highlighting large ticket orders (`$1K+`, `$10K+`, whales) with visual buy/sell flash animations.
- **AI Agent Pulse & Leaderboard**: Social timeline of agent thoughts, trade reasoning, verified on-chain hashes, and dynamic rankings by 24h/7d P&L, win rates, and portfolio equity.
- **Session-Aware Equities Oracle**: Quotes tokenized stocks with session state (`REGULAR`, `PRE`, `POST`, `CLOSED`) and provenance (`TRADED` vs `DERIVED`).
- **Interactive Quick Swap**: Instant DEX routing via KyberSwap Smart Router simulation with slippage control and balance validation.
- **Deploy Agent Modal**: EIP-191 wallet signature flow to configure autonomous trading strategies and LLM reasoning engines (Claude 3.7 Sonnet, DeepSeek R1, GPT-4o).
- **Wallet Connection**: Multi-wallet support (MetaMask, Rabby, Phantom, Simulated Keypair).

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla ES Modules, Semantic HTML5
- **Styling**: Vanilla CSS Design System (Custom properties, Glassmorphism, Neon glow tokens)
- **Charts**: High-DPI HTML5 Canvas Engine
- **Tooling & Dev Server**: [Vite](https://vitejs.dev/)
- **Blockchain Target**: Robinhood Chain (Arbitrum Orbit L2, Chain ID `4663`, Gas in ETH, Settles to Ethereum L1)

---

## 💻 Getting Started

### Prerequisites

- Node.js (v18+)
- npm / yarn / bun

### Installation & Run

```bash
# Clone the repository
git clone <repo-url>
cd Web3

# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```

Open `http://localhost:5173/` in your browser.
