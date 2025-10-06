#!/bin/bash

# Multiplayer Game Platform - Stop Script
# Stops all running services

echo "🛑 Stopping Multiplayer Game Platform..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ $1${NC}"; }

# Stop backend
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        print_success "Backend stopped (PID: $BACKEND_PID)"
    fi
    rm .backend.pid
fi

# Stop frontend
if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        print_success "Frontend stopped (PID: $FRONTEND_PID)"
    fi
    rm .frontend.pid
fi

# Stop Redis if running
if pgrep redis-server >/dev/null; then
    print_info "Stopping Redis..."
    redis-cli shutdown 2>/dev/null || true
fi

# Kill any remaining node processes on ports 4000/4001
print_info "Cleaning up any remaining processes..."
lsof -ti:4000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:4001 2>/dev/null | xargs kill -9 2>/dev/null || true

print_success "All services stopped"
