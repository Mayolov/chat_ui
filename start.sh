#!/usr/bin/env bash
set -e

# ─── Local Chat UI — Start Script ────────────────────────────────────────────
# Usage:
#   ./start.sh          Start in development mode (hot reload)
#   ./start.sh --prod   Build and start in production mode (single port)

cd "$(dirname "$0")"

# ── Detect Node.js ────────────────────────────────────────────────────────────
detect_node() {
  # Try nvm first
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
    if [ -f .nvmrc ]; then
      nvm use 2>/dev/null || nvm install 2>/dev/null
    fi
  fi

  # Try fnm
  if ! command -v node &>/dev/null && command -v fnm &>/dev/null; then
    eval "$(fnm env)"
  fi

  if ! command -v node &>/dev/null; then
    echo "ERROR: Node.js is not installed."
    echo ""
    echo "Install Node.js 20+ using one of these methods:"
    echo "  • nvm:   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
    echo "           nvm install 20"
    echo "  • fnm:   curl -fsSL https://fnm.vercel.app/install | bash && fnm install 20"
    echo "  • apt:   sudo apt install nodejs npm    (Ubuntu/Debian)"
    echo "  • brew:  brew install node@20            (macOS)"
    echo "  • https://nodejs.org/en/download"
    exit 1
  fi

  NODE_MAJOR=$(node -v | grep -oP '(?<=v)\d+')
  if [ "$NODE_MAJOR" -lt 18 ]; then
    echo "ERROR: Node.js v18+ is required (found $(node -v))."
    echo ""
    echo "Upgrade with:  nvm install 20 && nvm use 20"
    echo "Or download from https://nodejs.org"
    exit 1
  fi
}

detect_node

# ── Install dependencies if needed ───────────────────────────────────────────
if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

# ── Start ─────────────────────────────────────────────────────────────────────
if [ "$1" = "--prod" ] || [ "$1" = "--production" ]; then
  echo "Building for production..."
  npx vite build

  echo ""
  echo "╔══════════════════════════════════════════════════╗"
  echo "║  Local Chat UI running at http://localhost:3001  ║"
  echo "╚══════════════════════════════════════════════════╝"
  echo ""

  NODE_ENV=production node server.js
else
  echo ""
  echo "╔══════════════════════════════════════════════════╗"
  echo "║  Local Chat UI running at http://localhost:5173  ║"
  echo "║  API server at http://localhost:3001             ║"
  echo "╚══════════════════════════════════════════════════╝"
  echo ""

  npm run dev
fi
