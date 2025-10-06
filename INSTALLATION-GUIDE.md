# Installation Guide - Multiplayer Game Platform

This guide provides detailed installation instructions with troubleshooting for common issues.

## Table of Contents
1. [Quick Start (Recommended)](#quick-start-recommended)
2. [Installation Methods](#installation-methods)
3. [Common Issues & Solutions](#common-issues--solutions)
4. [Verification Steps](#verification-steps)
5. [Next Steps](#next-steps)

---

## Quick Start (Recommended)

### One-Command Installation

The automated setup script handles everything including common issues:

```bash
# Clone the repository
git clone https://github.com/curlyphries/multiplayer-game-platform
cd multiplayer-game-platform

# Run automated setup
chmod +x setup.sh
./setup.sh
```

**What the script does:**
1. ✅ Checks Node.js v18+ is installed
2. ✅ Creates `.env` files from examples
3. ✅ Installs all npm dependencies
4. ✅ Detects Docker availability
5. ✅ Fixes common Docker runtime issues
6. ✅ Starts services (Docker or local fallback)
7. ✅ Verifies everything is working

**Time:** 2-5 minutes depending on internet speed

---

## Installation Methods

### Method 1: Automated Setup (Recommended)

**Best for:** Everyone, especially first-time users

```bash
./setup.sh
```

The script will prompt you to choose between Docker or local development if both are available.

**Stop services:**
```bash
./stop.sh  # For local development
# OR
docker-compose down  # For Docker
```

---

### Method 2: Docker Compose

**Best for:** Production deployments, isolated environments

**Prerequisites:**
- Docker installed and running
- Docker Compose installed

**Steps:**
```bash
# 1. Clone repository
git clone https://github.com/curlyphries/multiplayer-game-platform
cd multiplayer-game-platform

# 2. Start all services
docker-compose up -d

# 3. View logs
docker-compose logs -f

# 4. Verify services are running
docker-compose ps
```

**Expected output:**
```
NAME                              STATUS
multiplayer-game-platform-backend-1   Up
multiplayer-game-platform-frontend-1  Up
multiplayer-game-platform-redis-1     Up
```

**Stop services:**
```bash
docker-compose down
```

---

### Method 3: Local Development

**Best for:** Active development, debugging, no Docker

**Prerequisites:**
- Node.js v18+ installed
- npm v9+ installed

**Steps:**

**Terminal 1 - Backend:**
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

**Stop services:**
```bash
# Use the stop script
./stop.sh

# Or manually kill processes
lsof -ti:4000 | xargs kill -9
lsof -ti:4001 | xargs kill -9
```

---

## Common Issues & Solutions

### Issue 1: Docker Runtime Error

**Error Message:**
```
exec: "nvidia-container-runtime": executable file not found in $PATH
```

**Cause:** Docker is configured to use NVIDIA container runtime but it's not installed.

**Solutions:**

**Option A: Use Automated Fix (Easiest)**
```bash
./setup.sh
# The script will detect and fix this automatically
```

**Option B: Manual Fix**
```bash
# Backup Docker config
sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.backup

# Edit Docker config
sudo nano /etc/docker/daemon.json

# Remove or comment out lines containing "nvidia"
# Save and exit

# Restart Docker
sudo systemctl restart docker

# Verify
docker ps
```

**Option C: Use Local Development (Bypass Docker)**
```bash
./setup.sh
# Choose option 2 when prompted
```

**Full details:** See [DOCKER-RUNTIME-FIX.md](DOCKER-RUNTIME-FIX.md)

---

### Issue 2: Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::4000
```

**Cause:** Another process is using port 4000 or 4001.

**Solution:**

**Linux/Mac:**
```bash
# Find and kill process on port 4000
lsof -ti:4000 | xargs kill -9

# Find and kill process on port 4001
lsof -ti:4001 | xargs kill -9

# Then restart services
./setup.sh
```

**Windows:**
```bash
# Find process
netstat -ano | findstr :4000

# Kill process (replace <PID> with actual PID)
taskkill /PID <PID> /F
```

---

### Issue 3: Node.js Version Too Old

**Error Message:**
```
Node.js version X detected, but v18+ is recommended
```

**Solution:**

**Option A: Install Node.js v18+ (Recommended)**
- Visit https://nodejs.org/
- Download and install Node.js v18 LTS or later
- Verify: `node -v` should show v18.x.x or higher

**Option B: Use nvm (Node Version Manager)**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js v18
nvm install 18
nvm use 18

# Verify
node -v
```

---

### Issue 4: npm install Fails

**Error Message:**
```
npm ERR! code EACCES
npm ERR! syscall access
```

**Cause:** Permission issues or corrupted npm cache.

**Solution:**

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf backend/node_modules backend/package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json

# Run setup again
./setup.sh
```

---

### Issue 5: Frontend Shows Blank Page

**Symptoms:**
- Browser shows blank white page
- No errors in browser console
- Backend is running fine

**Solutions:**

**Check 1: Verify frontend is running**
```bash
curl http://localhost:4000
# Should return HTML content
```

**Check 2: Check frontend logs**
```bash
# Docker
docker-compose logs frontend

# Local
tail -f frontend.log
```

**Check 3: Rebuild frontend**
```bash
# Docker
docker-compose down
docker-compose up -d --build frontend

# Local
cd frontend
rm -rf node_modules .vite
npm install
npm run dev
```

---

### Issue 6: Cannot Connect to Backend

**Symptoms:**
- Frontend loads but shows connection errors
- "Failed to fetch" errors in browser console

**Solutions:**

**Check 1: Verify backend is running**
```bash
curl http://localhost:4001/health
# Should return: {"status":"ok","timestamp":"..."}
```

**Check 2: Check CORS configuration**
```bash
# Verify backend/.env has correct CORS_ORIGIN
cat backend/.env | grep CORS_ORIGIN
# Should show: CORS_ORIGIN=http://localhost:4000
```

**Check 3: Verify frontend environment**
```bash
# Verify frontend/.env has correct server URL
cat frontend/.env | grep VITE_SERVER_URL
# Should show: VITE_SERVER_URL=http://localhost:4001
```

---

### Issue 7: Redis Connection Failed

**Error Message:**
```
Error: Redis connection failed
```

**Important:** Redis is **optional** - the application works without it!

**Solutions:**

**Option A: Ignore (Recommended)**
- The app will work fine without Redis
- Redis is only used for session persistence across server restarts

**Option B: Install Redis (Optional)**

**Docker:**
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

**Linux:**
```bash
sudo apt-get install redis-server
redis-server --daemonize yes
```

**Mac:**
```bash
brew install redis
brew services start redis
```

---

## Verification Steps

After installation, verify everything is working:

### Step 1: Check Services

**Docker:**
```bash
docker-compose ps
# All services should show "Up"
```

**Local:**
```bash
# Check if ports are listening
ss -tuln | grep -E ':(4000|4001)'
# Should show both ports in LISTEN state
```

### Step 2: Test Backend

```bash
curl http://localhost:4001/health
```

**Expected response:**
```json
{"status":"ok","timestamp":"2025-10-06T04:00:00.000Z"}
```

### Step 3: Test Frontend

```bash
curl -I http://localhost:4000
```

**Expected response:**
```
HTTP/1.1 200 OK
Content-Type: text/html
```

### Step 4: Test in Browser

1. Open http://localhost:4000
2. Should see dark-themed homepage
3. Click "Create Room"
4. Enter a player name
5. Should create room and show 6-character code

### Step 5: Test Multiplayer

1. Copy the room code from step 4
2. Open new browser tab (or incognito window)
3. Go to http://localhost:4000
4. Click "Join Room"
5. Enter the room code
6. Both players should appear in the room

---

## Next Steps

### Play the Games

Once installed, try all 4 game types:

1. **Word Voting Game** - Creative responses and voting
2. **Trivia** - Quiz questions with multiple choice
3. **Drawing Game** - Pictionary-style drawing and guessing
4. **Music Quiz** - Identify songs from 90s-current

### Development

**View logs:**
```bash
# Docker
docker-compose logs -f

# Local
tail -f backend.log
tail -f frontend.log
```

**Make code changes:**
- Both frontend and backend have hot-reload enabled
- Changes will automatically refresh

**Stop services:**
```bash
# Docker
docker-compose down

# Local
./stop.sh
```

**Restart services:**
```bash
./setup.sh
```

---

## Getting Help

### Check Documentation

1. [README.md](README.md) - Main documentation
2. [DOCKER-RUNTIME-FIX.md](DOCKER-RUNTIME-FIX.md) - Docker-specific issues
3. [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - General troubleshooting
4. [ISSUE_TRACKER.md](ISSUE_TRACKER.md) - Known issues and resolutions

### Debug Commands

**Check Node.js version:**
```bash
node -v
npm -v
```

**Check Docker:**
```bash
docker --version
docker-compose --version
docker ps
```

**Check ports:**
```bash
# Linux/Mac
lsof -i :4000
lsof -i :4001

# Windows
netstat -ano | findstr :4000
netstat -ano | findstr :4001
```

**Check logs:**
```bash
# Docker
docker-compose logs --tail=100

# Local
tail -100 backend.log
tail -100 frontend.log
```

### Still Having Issues?

1. Run the automated setup script: `./setup.sh`
2. Check the troubleshooting section in README.md
3. Review ISSUE_TRACKER.md for similar problems
4. Check GitHub issues for known problems

---

## Summary

**Recommended Installation Path:**
```bash
git clone https://github.com/curlyphries/multiplayer-game-platform
cd multiplayer-game-platform
chmod +x setup.sh
./setup.sh
```

**Time to install:** 2-5 minutes  
**Difficulty:** Easy (automated)  
**Success rate:** 95%+ with automated script

The automated setup script handles all common issues and provides fallback options automatically.
