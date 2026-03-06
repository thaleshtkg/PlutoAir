# Windows Quick Setup Checklist

## Step 0: Install Docker Desktop (CRITICAL!)

Your main issue: **Docker is not installed**

**Action**: Download and install Docker Desktop for Windows
- **Link**: https://www.docker.com/products/docker-desktop
- **After install**: **RESTART YOUR COMPUTER**
- **Verify**: Open PowerShell and run:
  ```powershell
  docker --version
  docker compose version
  ```
  Should show: `Docker version 20.10.0+` and `Docker Compose version 2.0.0+`

---

## Step 1: Open 3 PowerShell Windows

You'll need **3 separate PowerShell windows** for:
1. Docker containers
2. Backend server
3. Frontend server

---

## Step 2: Window 1 - Start Docker Containers

**Run these commands** (in PowerShell Window 1):

```powershell
cd c:\Projects\QualititudeAI-Demo
docker compose up -d
```

**Wait for output like:**
```
[+] Running 2/2
 ✓ Network flight_booking_default  Created
 ✓ Container flight_db              Started
 ✓ Container redis                  Started
```

**Verify**: Run this in same window:
```powershell
docker ps
```

Should show 2 containers running.

✅ **Window 1 is done** - Leave it running

---

## Step 3: Window 2 - Start Backend

**Run these commands** (in PowerShell Window 2):

```powershell
cd c:\Projects\QualititudeAI-Demo\backend
npm install
npm run migrate
npm run seed
npm run dev
```

**Expected output after all commands:**
```
✓ Database connection established
✓ Server running on http://localhost:5000
✓ Environment: development
```

✅ **Window 2 is done** - Leave it running

---

## Step 4: Window 3 - Start Frontend

**Run these commands** (in PowerShell Window 3):

```powershell
cd c:\Projects\QualititudeAI-Demo\frontend
npm install
npm run dev
```

**Expected output:**
```
VITE v5.0.8  dev server running at:

➜  Local:   http://localhost:5173/
➜  press h to show help
```

✅ **Window 3 is done** - Leave it running

---

## Step 5: Test in Browser

1. Open browser
2. Go to: **http://localhost:5173**
3. You should see the **Login Page**
4. Click **"Use These Credentials"** button
5. The form should auto-fill with:
   - Username: `admin`
   - Password: `admin@123`
6. Click **"Sign In"**
7. You should see the home page

✅ **Success!** App is running!

---

## If Something Goes Wrong

### Error: "Docker is not recognized"
- You didn't install Docker Desktop
- **Solution**: Download from https://www.docker.com/products/docker-desktop
- **Important**: Restart your computer after installation

### Error: "Port 5000 is already in use"
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace 12345 with the actual PID)
taskkill /PID 12345 /F
```

### Error: "npm: The term 'npm' is not recognized"
- Node.js not installed
- **Solution**: Download from https://nodejs.org/ (v18 or higher)
- **After install**: Restart PowerShell

### Error: "Cannot open c:\Projects\QualititudeAI-Demo\backend\package.json"
- You're not in the backend folder
- **Solution**: Make sure the path is correct and run:
  ```powershell
  cd c:\Projects\QualititudeAI-Demo\backend
  ```

### Error: "Database connection refused"
- Docker containers aren't running
- **Solution**: Check Window 1, make sure both containers are running
  ```powershell
  docker ps
  ```

---

## ✅ Success Indicators

All 3 windows should show:

**Window 1 (Docker):**
```
✓ Network flight_booking_default  Created
✓ Container flight_db              Started
✓ Container redis                  Started
```

**Window 2 (Backend):**
```
✓ Database connection established
✓ Server running on http://localhost:5000
```

**Window 3 (Frontend):**
```
➜  Local:   http://localhost:5173/
```

**Browser (http://localhost:5173):**
- Login page loads
- Credentials button works
- Sign in redirects to home page

---

## 📞 Still Having Issues?

Copy-paste this in PowerShell and share the output:

```powershell
echo "=== Node & NPM ==="
node --version
npm --version

echo "=== Docker ==="
docker version
docker ps

echo "=== Ports in Use ==="
netstat -ano | findstr :5000
netstat -ano | findstr :5173
netstat -ano | findstr :5432
netstat -ano | findstr :6379

echo "=== Backend Directory ==="
dir c:\Projects\QualititudeAI-Demo\backend\package.json

echo "=== Frontend Directory ==="
dir c:\Projects\QualititudeAI-Demo\frontend\package.json
```

Share this output and I'll help diagnose the issue!

---

**You're almost there!** 🎉 Just install Docker and follow these steps.
