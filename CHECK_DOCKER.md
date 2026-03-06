# Docker Installation Check Guide

## Check if Docker is Already Installed

Run these commands one by one in PowerShell and share the output:

### Command 1: Check Docker Installation

```powershell
docker --version
```

**Expected outputs:**
- ✅ `Docker version 20.10.0` (or higher) = **Docker IS installed**
- ❌ `docker : The term 'docker' is not recognized` = **Docker NOT installed**

---

### Command 2: Check if Docker is Running

```powershell
docker ps
```

**Expected outputs:**
- ✅ `CONTAINER ID   IMAGE   STATUS` (with list of containers or empty list) = **Docker daemon IS running**
- ❌ `Cannot connect to Docker daemon` = **Docker installed but not running**
- ❌ `docker : The term 'docker' is not recognized` = **Docker NOT installed**

---

### Command 3: Check Docker Compose

```powershell
docker compose version
```

**Expected outputs:**
- ✅ `Docker Compose version 2.0.0` (or higher) = **Docker Compose IS installed**
- ⚠️ `docker: 'compose' is not a docker command` = **Docker Compose NOT installed (old Docker)**
- ❌ `docker : The term 'docker' is not recognized` = **Docker NOT installed**

---

### Command 4: Check Docker Desktop App Status

```powershell
# Check if Docker Desktop is running
Get-Process | Select-String -Pattern "docker|Desktop" | Get-Unique
```

**Expected outputs:**
- Shows processes like `DockerDesktop` = **Docker Desktop IS running**
- No output = **Docker Desktop NOT running or not installed**

---

## Quick Summary Check

Run all 4 commands and tell me:

```powershell
# Copy-paste all at once
docker --version
docker ps
docker compose version
Get-Process | Select-String -Pattern "docker" | Get-Unique
```

---

## What the Output Means

| Output | Meaning | Next Step |
|--------|---------|-----------|
| All commands return version numbers | ✅ Docker is fully installed and running | **Go straight to deployment!** |
| `docker --version` works, but `docker ps` fails | ⚠️ Docker installed but daemon not running | Start Docker Desktop app |
| `docker : not recognized` | ❌ Docker not installed | Install Docker Desktop |
| `compose is not a docker command` | ⚠️ Old Docker version (pre-2019) | Update Docker Desktop |

---

## If Docker IS Running

If you see versions and `docker ps` works, you're ready! Go to:
**WINDOWS_QUICK_SETUP.md** and start from Step 2 (skip Step 0).

---

## If Docker is Installed but Not Running

If `docker --version` works but `docker ps` fails, just **start Docker Desktop**:

1. Press `Win` key
2. Type `Docker`
3. Click "Docker Desktop"
4. Wait for it to start (you'll see a whale icon in system tray)
5. Then try `docker ps` again

---

## Run These Commands Now

Please run the **Quick Summary Check** above and paste the output here. It will take 10 seconds and tell us exactly what's installed.

**The output will look like:**
```
Docker version 20.10.12, build e91ed57...
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES

Docker Compose version 2.5.0

Handles     NPM
─────────   ──────────
2           DockerDesktop.exe
```

Share exactly what you get, and I'll tell you the next steps! 🔍
