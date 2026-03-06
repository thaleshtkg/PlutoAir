# Windows Deployment Guide

## ⚠️ Your Current Issues

1. ❌ **PowerShell `&&` syntax error** - PowerShell uses `;` not `&&`
2. ❌ **Docker not installed** - Must install Docker Desktop for Windows
3. ❌ **Running npm at root** - Need to `cd backend` or `cd frontend` first
4. ❌ **`lsof` command not found** - That's a Linux/Mac tool

---

## 🔧 STEP 1: Install Required Tools

### 1.1 Install Docker Desktop for Windows

**Download**: https://www.docker.com/products/docker-desktop

**Steps**:
1. Download "Docker Desktop for Windows"
2. Run installer
3. Follow installation wizard
4. **RESTART YOUR COMPUTER** (important!)
5. Verify installation:

```powershell
docker --version
docker-compose --version
```

**Expected output**:
```
Docker version 20.10.0+
Docker Compose version 2.0.0+
```

### 1.2 Verify Node.js & npm

```powershell
node --version
npm --version
```

**Expected**: v18+ and npm 8+

---

## 🚀 STEP 2: Deploy Backend (Windows PowerShell)

**Open PowerShell and run these commands** (one at a time):

```powershell
# Step 1: Go to backend folder
cd backend

# Step 2: Install dependencies
npm install

# Step 3: Start Docker containers (do this in another PowerShell window)
# Open a NEW PowerShell window and run:
docker-compose up -d
```

**Wait for Docker to finish (look for this output):**
```
[+] Running 2/2
 ✓ Network flight_booking_default  Created
 ✓ Container flight_db              Started
 ✓ Container redis                  Started
```

**Back in backend PowerShell, run:**

```powershell
# Step 4: Setup database (one command at a time)
npm run migrate

# Step 5: Seed sample data
npm run seed

# Step 6: Start backend server
npm run dev
```

**Expected Backend Output:**
```
✓ Database connection established
✓ Server running on http://localhost:5000
✓ Environment: development
```

**✅ Backend is ready when you see these messages!**

---

## 🚀 STEP 3: Deploy Frontend (New PowerShell Window)

**Open a NEW PowerShell window** and run:

```powershell
# Step 1: Go to frontend folder
cd frontend

# Step 2: Install dependencies
npm install

# Step 3: Start development server
npm run dev
```

**Expected Frontend Output:**
```
VITE v5.0.8  dev server running at:

➜  Local:   http://localhost:5173/
➜  press h to show help
```

**✅ Frontend is ready when you see this!**

---

## ✅ STEP 4: Verify Everything Works

### In Browser:
1. Go to **http://localhost:5173**
2. You should see the Login page
3. Click "Use These Credentials" button
4. Click "Sign In"
5. Should see the home page

### Check All Services:

**Terminal 1 (Docker):**
```powershell
docker ps
```

**Expected output:**
```
CONTAINER ID   IMAGE           PORTS                    STATUS
xxxxx          postgres:16     0.0.0.0:5432->5432/tcp   Up 2 minutes
xxxxx          redis:7         0.0.0.0:6379->6379/tcp   Up 2 minutes
```

**Terminal 2 (Backend):**
- Should be running on port 5000
- Should show "Server running..." message

**Terminal 3 (Frontend):**
- Should be running on port 5173
- Should show "VITE dev server running..."

---

## 🐛 Windows-Specific Troubleshooting

### Issue: `docker-compose` command not found

**Solution**: Use `docker compose` instead (modern Docker)

```powershell
# Old way (may not work)
docker-compose up -d

# New way (use this)
docker compose up -d
```

### Issue: Port already in use (5000, 5173, 5432, 6379)

**Solution**: Check what's using the port and kill it

```powershell
# Check ports (Windows way)
netstat -ano | findstr :5000

# Example output:
# TCP    0.0.0.0:5000           LISTENING       12345

# Kill the process (replace 12345 with actual PID)
taskkill /PID 12345 /F
```

### Issue: "npm" command not found

**Solution**:
1. Reinstall Node.js from https://nodejs.org/
2. Restart PowerShell after installation
3. Verify: `node --version`

### Issue: Docker containers won't start

**Solution**:
```powershell
# Stop and remove old containers
docker compose down -v

# Start fresh
docker compose up -d

# Wait 30 seconds, then check
docker ps
```

---

## 📋 Complete Windows PowerShell Commands

**Copy-paste these commands into PowerShell** (one window for each section):

### Window 1: Start Docker

```powershell
cd c:\Projects\QualititudeAI-Demo
docker compose up -d
timeout 30
docker ps
```

### Window 2: Setup & Start Backend

```powershell
cd c:\Projects\QualititudeAI-Demo\backend
npm install
npm run migrate
npm run seed
npm run dev
```

### Window 3: Setup & Start Frontend

```powershell
cd c:\Projects\QualititudeAI-Demo\frontend
npm install
npm run dev
```

---

## 🪟 PowerShell vs Bash Syntax Reference

| Task | Bash | PowerShell |
|------|------|-----------|
| Run 2 commands | `cmd1 && cmd2` | `cmd1; cmd2` |
| Check if running | `lsof -i :5000` | `netstat -ano \| findstr :5000` |
| Kill process | `kill PID` | `taskkill /PID PID /F` |
| Remove folder | `rm -rf folder` | `Remove-Item -Recurse -Force folder` |
| List files | `ls` | `dir` or `Get-ChildItem` |
| Environment vars | `export VAR=value` | `$env:VAR="value"` |

---

## ✅ Deployment Checklist (Windows)

- [ ] Docker Desktop installed and running
- [ ] Node.js v18+ installed
- [ ] `docker ps` shows 2 containers (PostgreSQL + Redis)
- [ ] Backend: `npm install` completed without errors
- [ ] Backend: `npm run migrate` shows "Ran 7 migrations"
- [ ] Backend: `npm run seed` completes successfully
- [ ] Backend: `npm run dev` shows "Server running on http://localhost:5000"
- [ ] Frontend: `npm install` completed without errors
- [ ] Frontend: `npm run dev` shows "Local: http://localhost:5173/"
- [ ] Browser: http://localhost:5173 loads Login page
- [ ] Login page displays with credentials button

---

## 🚨 If You're Still Having Issues

**Provide these details:**

```powershell
# Run these commands and copy the output

# 1. Check Docker
docker --version
docker ps

# 2. Check Node/npm
node --version
npm --version

# 3. Check ports
netstat -ano | findstr :5000
netstat -ano | findstr :5173
netstat -ano | findstr :5432
netstat -ano | findstr :6379

# 4. Last 20 lines of backend error
# (from the backend PowerShell window)
# Copy-paste what you see

# 5. Last 20 lines of frontend error
# (from the frontend PowerShell window)
# Copy-paste what you see
```

---

## 📞 Windows-Specific Help

If you get stuck:

1. **Docker issues?** → Uninstall and reinstall Docker Desktop, restart PC
2. **Node issues?** → Uninstall and reinstall from nodejs.org, restart PowerShell
3. **Port conflicts?** → Run `netstat -ano | findstr :PORT` to find process, then `taskkill /PID XXX /F`
4. **Still stuck?** → Share the error message from the PowerShell terminal

---

**Success looks like this:**

```
✅ Docker: 2 containers running (postgres + redis)
✅ Backend: npm run dev shows "Server running on http://localhost:5000"
✅ Frontend: npm run dev shows "http://localhost:5173"
✅ Browser: http://localhost:5173 loads and shows Login page
✅ Click "Use These Credentials" → Enter → See home page
```

---

**You're almost there!** 🎉 Just install Docker and follow the Windows steps above.
