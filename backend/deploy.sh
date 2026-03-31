#!/bin/bash
# =============================================================================
# Koinonia TV — Namecheap Node.js Deployment Script
# Run this from the backend/ directory on your Namecheap server via SSH.
# Usage:  bash deploy.sh
# =============================================================================

set -e  # Exit immediately on any error

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()    { echo -e "${BLUE}[DEPLOY]${NC} $1"; }
success(){ echo -e "${GREEN}[OK]${NC}     $1"; }
warn()   { echo -e "${YELLOW}[WARN]${NC}   $1"; }
error()  { echo -e "${RED}[ERROR]${NC}  $1"; exit 1; }

# ── Config ────────────────────────────────────────────────────────────────────
APP_DIR="$(cd "$(dirname "$0")" && pwd)"   # absolute path to backend/
NODE_APP_NAME="koinonia-tv"                # name used in Namecheap Node.js app panel

log "=== Koinonia TV Deployment ==="
log "Directory: $APP_DIR"
log "Node: $(node -v)"
log "NPM:  $(npm -v)"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 — Verify .env exists
# ─────────────────────────────────────────────────────────────────────────────
log "STEP 1/7 — Checking .env..."
if [ ! -f "$APP_DIR/.env" ]; then
  error ".env file not found in $APP_DIR — copy .env.example and fill in your values first."
fi

# Quick sanity-check that critical vars are set
required_vars=(DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME JWT_SECRET YOUTUBE_API_KEY YOUTUBE_CHANNEL_ID)
for var in "${required_vars[@]}"; do
  if ! grep -q "^${var}=" "$APP_DIR/.env" 2>/dev/null; then
    warn "${var} not found in .env — this may cause startup failures"
  fi
done
success ".env present"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2 — Install / update dependencies (production only)
# ─────────────────────────────────────────────────────────────────────────────
log "STEP 2/7 — Installing dependencies..."
cd "$APP_DIR"
npm ci --omit=dev --prefer-offline 2>&1 | tail -5
# Reinstall dev tools needed for migrations (ts-node, tsconfig-paths)
npm install --save-dev ts-node tsconfig-paths typescript --prefer-offline 2>&1 | tail -3
success "Dependencies installed"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 3 — Build TypeScript → dist/
# ─────────────────────────────────────────────────────────────────────────────
log "STEP 3/7 — Building TypeScript..."
npm run build 2>&1
if [ ! -f "$APP_DIR/dist/main.js" ]; then
  error "Build failed — dist/main.js not found"
fi
success "Build complete → dist/"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 4 — Wait for MySQL to be reachable
# ─────────────────────────────────────────────────────────────────────────────
log "STEP 4/7 — Checking MySQL connection..."

# Load DB vars from .env
DB_HOST=$(grep  "^DB_HOST="  "$APP_DIR/.env" | cut -d= -f2 | tr -d '"' | tr -d "'")
DB_PORT=$(grep  "^DB_PORT="  "$APP_DIR/.env" | cut -d= -f2 | tr -d '"' | tr -d "'")
DB_USER=$(grep  "^DB_USER="  "$APP_DIR/.env" | cut -d= -f2 | tr -d '"' | tr -d "'")
DB_PASS=$(grep  "^DB_PASSWORD=" "$APP_DIR/.env" | cut -d= -f2 | tr -d '"' | tr -d "'")
DB_NAME=$(grep  "^DB_NAME="  "$APP_DIR/.env" | cut -d= -f2 | tr -d '"' | tr -d "'")

DB_PORT="${DB_PORT:-3306}"

MAX_TRIES=15
TRIES=0
until mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "SELECT 1" "$DB_NAME" &>/dev/null; do
  TRIES=$((TRIES+1))
  if [ $TRIES -ge $MAX_TRIES ]; then
    error "Cannot connect to MySQL at $DB_HOST:$DB_PORT after $MAX_TRIES attempts"
  fi
  warn "MySQL not ready yet ($TRIES/$MAX_TRIES) — retrying in 3s..."
  sleep 3
done
success "MySQL reachable at $DB_HOST:$DB_PORT/$DB_NAME"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 5 — Run TypeORM migrations
# ─────────────────────────────────────────────────────────────────────────────
log "STEP 5/7 — Running database migrations..."

# Show current migration status first
echo ""
log "  Current migration status:"
npx typeorm-ts-node-commonjs migration:show \
  -d "$APP_DIR/src/database/data-source.ts" 2>&1 || true
echo ""

# Run pending migrations
npx typeorm-ts-node-commonjs migration:run \
  -d "$APP_DIR/src/database/data-source.ts" 2>&1

success "Migrations complete"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 6 — Seed database (idempotent — safe to run multiple times)
# ─────────────────────────────────────────────────────────────────────────────
log "STEP 6/7 — Seeding database (categories, events)..."
npx ts-node -r tsconfig-paths/register \
  "$APP_DIR/src/database/seeds/seed-all.ts" 2>&1
success "Seed complete"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 7 — Restart the Node.js app
# Namecheap Shared/cPanel Node.js uses Passenger — restart via touch tmp/restart.txt
# ─────────────────────────────────────────────────────────────────────────────
log "STEP 7/7 — Restarting Node.js application..."

# Method A: Passenger (Namecheap cPanel Node.js apps use this)
if [ -d "$APP_DIR/../tmp" ] || [ -d "$APP_DIR/tmp" ]; then
  RESTART_FILE=""
  [ -d "$APP_DIR/../tmp" ] && RESTART_FILE="$APP_DIR/../tmp/restart.txt"
  [ -d "$APP_DIR/tmp"    ] && RESTART_FILE="$APP_DIR/tmp/restart.txt"
  touch "$RESTART_FILE"
  success "Passenger restart triggered via $RESTART_FILE"

# Method B: PM2 (if the app is managed by PM2)
elif command -v pm2 &>/dev/null; then
  if pm2 list | grep -q "$NODE_APP_NAME"; then
    pm2 restart "$NODE_APP_NAME" --update-env
    success "PM2 app '$NODE_APP_NAME' restarted"
  else
    warn "PM2 running but no app named '$NODE_APP_NAME' found"
    warn "Start it with: pm2 start dist/main.js --name $NODE_APP_NAME"
  fi

# Method C: Just warn — user needs to restart manually from cPanel
else
  warn "Could not auto-restart. Please restart your Node.js app from Namecheap cPanel:"
  warn "  cPanel → Setup Node.js App → click 'Restart'"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Done
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  DEPLOYMENT COMPLETE                                       ${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo "  Migrations : done"
echo "  Seed data  : done"
echo "  App restart: done"
echo ""
echo "  Verify your API is live:"
echo "  curl https://koinonia-tv.ontimemaritime.com/"
echo ""

# Show final migration state for confirmation
log "Final migration state:"
npx typeorm-ts-node-commonjs migration:show \
  -d "$APP_DIR/src/database/data-source.ts" 2>&1 || true
