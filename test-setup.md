# Quick Test Setup

## 1. Test Backend (Port 4001)
Visit: http://localhost:4001
Should show: API info with endpoints

Visit: http://localhost:4001/health  
Should show: {"status":"ok","timestamp":"..."}

## 2. Test Frontend (Port 4000)
Visit: http://localhost:4000
Should show: Game platform homepage

## 3. Common Issues & Fixes

### Backend "Cannot GET /"
- ✅ Fixed: Added root route handler

### Frontend Blank Page
Possible causes:
1. Dependencies not installed: `npm install` in frontend folder
2. Environment file missing: `copy .env.example .env` in frontend folder
3. Port conflict: Check if port 4000 is free
4. Build errors: Check console for React/Vite errors

### Quick Commands
```bash
# Backend
cd backend
copy .env.example .env
npm install
npm run dev

# Frontend (new terminal)
cd frontend  
copy .env.example .env
npm install
npm run dev
```

## 4. Expected Console Output

### Backend Console:
```
🎮 Game server running on port 4001
🌐 CORS enabled for: http://localhost:4000
```

### Frontend Console:
```
Local:   http://localhost:4000/
Network: use --host to expose
```
