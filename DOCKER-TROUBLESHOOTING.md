# Docker Troubleshooting Guide

## Current Status
- ✅ **Backend (Port 4001)**: Working correctly
- ❌ **Frontend (Port 4000)**: Blank page

## Frontend Blank Page in Docker - Diagnostic Steps

### 1. Check Container Logs
```bash
# View frontend container logs
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f frontend

# Check for build errors
docker-compose logs frontend | grep -i error
```

### 2. Verify Container is Running
```bash
# List running containers
docker-compose ps

# Expected output should show frontend container as "Up"
```

### 3. Check Vite Development Server
The frontend uses Vite which needs specific configuration for Docker:

```bash
# Execute into the frontend container
docker-compose exec frontend sh

# Inside container, check if Vite is running
ps aux | grep vite

# Check if port 4000 is listening
netstat -tlnp | grep 4000
```

### 4. Common Docker + Vite Issues

#### Issue A: Vite Host Binding
**Problem**: Vite only binds to localhost inside container
**Solution**: Already fixed with `host: true` in vite.config.js

#### Issue B: Environment Variables
**Problem**: VITE_SERVER_URL not accessible
**Fix**:
```bash
# Check environment inside container
docker-compose exec frontend env | grep VITE
```

#### Issue C: Node Modules Volume
**Problem**: Dependencies not properly mounted
**Fix**:
```bash
# Rebuild without cache
docker-compose build --no-cache frontend
docker-compose up -d
```

### 5. Manual Container Debugging
```bash
# Stop current containers
docker-compose down

# Start only backend and redis
docker-compose up -d backend redis

# Run frontend manually for debugging
docker run -it --rm \
  -p 4000:4000 \
  -v "$(pwd)/frontend:/app" \
  -w /app \
  node:18-alpine \
  sh -c "npm install && npm run dev"
```

### 6. Network Connectivity Test
```bash
# Test backend connectivity from frontend container
docker-compose exec frontend wget -qO- http://backend:4001

# Should return the API JSON response
```

### 7. Browser-Specific Issues
- **Clear browser cache** (Ctrl+F5)
- **Try incognito/private mode**
- **Check browser console** (F12) for errors
- **Disable browser extensions**

### 8. Alternative: Local Development
If Docker issues persist, run locally:
```bash
# Terminal 1 - Backend
cd backend
copy .env.example .env
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
copy .env.example .env
npm install
npm run dev
```

## Expected Docker Logs

### Healthy Frontend Container:
```
frontend_1  | npm install
frontend_1  | added 1000+ packages
frontend_1  | npm run dev
frontend_1  | 
frontend_1  |   VITE v4.4.5  ready in 500ms
frontend_1  | 
frontend_1  |   ➜  Local:   http://localhost:4000/
frontend_1  |   ➜  Network: http://0.0.0.0:4000/
```

### Problem Indicators:
- Build errors during npm install
- Port binding failures
- Vite not starting
- Network connectivity issues

## Quick Fixes

### Fix 1: Rebuild Everything
```bash
docker-compose down --volumes --remove-orphans
docker-compose build --no-cache
docker-compose up -d
```

### Fix 2: Check Port Conflicts
```bash
# Windows
netstat -ano | findstr :4000

# Kill process if needed
taskkill /PID <PID> /F
```

### Fix 3: Reset Docker
```bash
docker system prune -a
docker-compose up -d
```
