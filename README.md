# 🌐 Web Explorer

A modular website explorer that mimics human browsing behavior using [Playwright](https://playwright.dev/). Features multi-instance parallel execution, randomized identities, proxy rotation, automatic cookie consent handling, and 10+ human-like action types.

## 📋 Prerequisites

Choose **one** of the following:

| Option | Requirements | Quick Start |
|--------|-------------|-------------|
| **A. Node.js** | [Node.js 18+](https://nodejs.org/) (includes npm & npx) | `npm install` → `npm start` |
| **B. Docker** | [Docker](https://docker.com/) only (no Node.js needed) | `docker build -t web-explorer .` → `docker run --rm web-explorer` |

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎭 **Randomized Identity** | Desktop, mobile & tablet emulation with random user agents, viewports, and device scale |
| 🌍 **Locale Support** | Weighted locale selection (80% Spanish, 10% US English, 10% UK English) with matching timezone |
| 🍪 **Cookie Handler** | 3-layer auto-detection: known frameworks (OneTrust, Cookiebot, etc.) → multilingual text search → iframe scan |
| 🤖 **Stealth Mode** | Overrides `navigator.webdriver`, plugins, languages, and platform to avoid bot detection |
| 🔒 **Proxy Rotation** | Load from file, health-check, round-robin rotation, automatic dead-proxy replacement |
| 📊 **Session Reports** | Per-instance reports with duration, pages visited, action breakdown, and URL list |
| ⚡ **Multi-Instance** | Parallel browser instances with staggered launches and independent identities |

## 🎬 Action Modules

| Module | Actions | Probability |
|--------|---------|-------------|
| `scroll.ts` | Mouse wheel scrolling with reading pauses | 25% |
| `click.ts` | Random clickable element interaction | 18% |
| `idle.ts` | Reading, distraction, slow-scroll, mouse drift | 15% |
| `hover.ts` | Hover over images, links, buttons, cards | 12% |
| `type.ts` | Find search boxes, type with typo correction | 8% |
| `back.ts` | Browser back button with safety guards | 8% |
| `media.ts` | Play/pause/mute/seek/fullscreen video & audio | 7% |
| `zoom.ts` | Keyboard zoom, mobile pinch, image enlarge | 7% |
| `cookies.ts` | Cookie consent detection & acceptance | Always first |
| `navigate.ts` | Random internal link navigation | Fallback |

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/web-explorer.git
cd web-explorer

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

## ⚙️ Configuration

All settings are managed via `explorer.config.json`:

```json
{
  "url": "https://example.com",
  "instances": 3,
  "minPages": 5,
  "maxPages": 15,
  "minDuration": 60,
  "maxDuration": 180,
  "minActionsPerPage": 2,
  "maxActionsPerPage": 6,
  "headless": false,
  "browser": "chromium",
  "proxiesFile": "proxies.txt",
  "logLevel": "info"
}
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `url` | string | — | **Required.** Target URL to explore |
| `instances` | number | 2 | Parallel browser instances |
| `minPages` / `maxPages` | number | 5 / 10 | Page visit range per instance |
| `minDuration` / `maxDuration` | number | 60 / 120 | Duration range in seconds per instance |
| `minActionsPerPage` / `maxActionsPerPage` | number | 2 / 5 | Actions per page range |
| `headless` | boolean | true | Run without visible browser |
| `browser` | string | chromium | `chromium`, `firefox`, or `webkit` |
| `proxiesFile` | string | proxies.txt | Path to proxy list file |
| `logLevel` | string | info | `debug`, `info`, or `warn` |

## 🚀 Usage

```bash
# Run with config file (simplest)
npm start

# Override settings via CLI
npm start -- --url https://example.com --instances 2 --headless false

# All CLI flags
npm start -- \
  --url <url> \
  --instances <n> \
  --min-pages <n> --max-pages <n> \
  --min-duration <sec> --max-duration <sec> \
  --min-actions <n> --max-actions <n> \
  --headless <bool> \
  --browser <type> \
  --proxies <file> \
  --log-level <level>
```

## 🔒 Proxy Setup

Create a `proxies.txt` file with one proxy per line:

```
http://proxy1.example.com:8080
http://user:pass@proxy2.example.com:8080
socks5://proxy3.example.com:1080
```

Proxies are automatically health-checked on startup. Dead proxies are removed from rotation.

## 🐳 Docker

```bash
# Build
docker build -t web-explorer .

# Run
docker run --rm web-explorer

# With custom config
docker run --rm -v ./explorer.config.json:/app/explorer.config.json web-explorer
```

## 🏗️ Architecture

```
src/
├── index.ts              # Entry point — config loading, instance orchestration
├── config/index.ts       # Config from JSON file + CLI overrides
├── browser/
│   ├── index.ts          # Browser launcher & session management
│   ├── user-agents.ts    # User agent string pool
│   ├── devices.ts        # Mobile, tablet & desktop device pools
│   ├── locales.ts        # Locale profiles with weighted selection
│   ├── identity.ts       # Identity picker (UA + device + locale)
│   └── stealth.ts        # Anti-detection init scripts
├── actions/
│   ├── index.ts          # Barrel exports
│   ├── scroll.ts         # Mouse wheel scrolling
│   ├── click.ts          # Random element clicking
│   ├── hover.ts          # Element hovering
│   ├── type.ts           # Search box typing with typos
│   ├── navigate.ts       # Internal link navigation
│   ├── cookies.ts        # Cookie consent handler
│   ├── back.ts           # Browser back button
│   ├── media.ts          # Video/audio interaction
│   ├── zoom.ts           # Zoom in/out/image
│   └── idle.ts           # Idle behavior simulation
├── explorer/
│   ├── index.ts          # Explorer class — session lifecycle
│   ├── loop.ts           # Exploration loop & action selection
│   └── recovery.ts       # Proxy failure recovery
├── proxy/
│   ├── index.ts          # ProxyManager — rotation & lifecycle
│   ├── types.ts          # Proxy type definitions
│   ├── loader.ts         # File parser
│   └── checker.ts        # Health checker
├── humanizer/index.ts    # Delays, timing, randomization utilities
├── logger/index.ts       # Colored console logger
└── reporter/index.ts     # Session report generator
```

## 📄 License

ISC — Ifrahim IQBAL
