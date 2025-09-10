# Troubleshooting Guide

## Current Issues

### Backend (Port 4001): ✅ FIXED
- **Issue**: "Cannot GET /" 
- **Solution**: Added root route handler
- **Test**: Visit http://localhost:4001 - should show API info

### Frontend (Port 4000): Blank Page
**Diagnostic Steps:**

1. **Check if server is running:**
   ```bash
   cd frontend
   npm run dev
   ```
   Should show: `Local: http://localhost:4000/`

2. **Check browser console (F12):**
   - Look for JavaScript errors
   - Check Network tab for failed requests

3. **Verify files exist:**
   - `frontend/src/main.jsx` ✅
   - `frontend/src/App.jsx` ✅ 
   - `frontend/index.html` ✅
   - `frontend/package.json` ✅

4. **Common fixes:**
   ```bash
   # Install dependencies
   cd frontend
   npm install
   
   # Create environment file
   copy .env.example .env
   
   # Clear cache and restart
   npm run dev
   ```

5. **Check for port conflicts:**
   - Ensure port 4000 is not used by another service
   - Try different port: `npm run dev -- --port 4002`

## Quick Test Commands

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

## Expected Results
- Backend: http://localhost:4001 → API info JSON
- Frontend: http://localhost:4000 → Game homepage with dark theme
