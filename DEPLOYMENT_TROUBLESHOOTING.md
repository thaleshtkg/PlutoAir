# Deployment Troubleshooting Guide

## ⚠️ Common Deployment Issues & Solutions

### STEP 1: Check System Requirements

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version (should be 8+)
npm --version

# Check Docker is installed
docker --version

# Check Docker Compose
docker-compose --version

# Check PostgreSQL client (if installed)
psql --version
```

**Expected Output:**
```
v18.0.0 or higher
8.0.0 or higher
Docker version 20.0+
Docker Compose version 2.0+
```

---

## STEP 2: Verify Docker Containers

```bash
# Start containers
docker-compose up -d

# Check if containers are running
docker ps

# View container logs
docker logs flight_db      # PostgreSQL logs
docker logs redis          # Redis logs

# Check container health
docker-compose ps
```

**Expected Output:**
```
CONTAINER ID   IMAGE           STATUS
xxxxx          postgres:16     Up 2 minutes
xxxxx          redis:7         Up 2 minutes
```

**Issues & Fixes:**

| Issue | Cause | Fix |
|-------|-------|-----|
| Port 5432 already in use | Another PostgreSQL running | `lsof -i :5432` and kill process, or use different port |
| Port 6379 already in use | Another Redis running | `lsof -i :6379` and kill process |
| Cannot connect to database | PostgreSQL not started | Ensure `docker-compose up -d` completed successfully |
| Out of disk space | Docker needs storage | Run `docker system prune` |

---

## STEP 3: Backend Deployment Troubleshooting

```bash
cd backend

# Step 3.1: Verify Node modules
npm install --verbose

# Check for errors in npm install output
# Common issues:
# - "Module not found" → npm install failed
# - "Permission denied" → Directory permissions issue
```

### STEP 3.2: Verify Environment File

```bash
# Create .env from template
cp .env.example .env

# Check content
cat .env
```

**Expected .env content:**
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=flightuser
DB_PASSWORD=flightpass123
DB_NAME=flight_booking
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRY=3600
CORS_ORIGIN=http://localhost:5173
PORT=5000
```

### STEP 3.3: Test Database Connection

```bash
# Test if PostgreSQL is accessible
psql -h localhost -U flightuser -d flight_booking -c "SELECT 1"

# Or use Node.js to test
node -e "
const db = require('knex')({
  client: 'pg',
  connection: {
    host: 'localhost',
    user: 'flightuser',
    password: 'flightpass123',
    database: 'flight_booking',
    port: 5432
  }
});
db.raw('SELECT 1').then(() => {
  console.log('✓ Database connection successful');
  process.exit(0);
}).catch(err => {
  console.error('✗ Database connection failed:', err.message);
  process.exit(1);
});
"
```

**Expected Output:**
```
✓ Database connection successful
```

### STEP 3.4: Run Migrations

```bash
# Check for pending migrations
npm run migrate

# Expected output:
# Ran 7 migrations in migration directory

# If migrations fail:
# Option A: Reset database completely
npm run reset-db

# Option B: Check migration files exist
ls -la src/db/migrations/
```

### STEP 3.5: Seed Data

```bash
# Seed sample data
npm run seed

# Expected output:
# Seeding database...
# Seed completed successfully
```

### STEP 3.6: Start Backend Server

```bash
# Start with verbose logging
npm run dev

# Expected output:
# ✓ Database connection established
# ✓ Server running on http://localhost:5000
# ✓ Environment: development
```

**Common Backend Errors:**

| Error | Cause | Fix |
|-------|-------|-----|
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL not running | Run `docker-compose up -d` |
| `EADDRINUSE :::5000` | Port 5000 already in use | Change PORT in .env or kill process |
| `Module not found: 'express'` | Dependencies not installed | Run `npm install` |
| `FATAL: database "flight_booking" does not exist` | Migrations not run | Run `npm run migrate` |
| `relation "users" does not exist` | Database schema not set up | Run full reset: `npm run reset-db` |

---

## STEP 4: Frontend Deployment Troubleshooting

```bash
cd frontend

# Step 4.1: Install dependencies
npm install --verbose

# Check for errors
# Common issue: Peer dependency warnings (usually OK)
```

### STEP 4.2: Verify Environment File

```bash
# Create .env from template
cp .env.example .env

# Check content
cat .env
```

**Expected .env content:**
```
VITE_API_URL=http://localhost:5000
VITE_SESSION_TIMEOUT=3600
VITE_ENABLE_DEMO_MODE=true
VITE_DEBUG_MODE=false
```

### STEP 4.3: Start Development Server

```bash
# Start with verbose output
npm run dev

# Expected output:
# VITE v5.0.8  dev server running at:
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help
```

**Common Frontend Errors:**

| Error | Cause | Fix |
|-------|-------|-----|
| `EADDRINUSE :::5173` | Port 5173 in use | Change port: `npm run dev -- --port 3000` |
| Cannot find module | Dependencies not installed | Run `npm install` |
| Vite config error | Invalid vite.config.js | Check syntax in vite.config.js |
| CORS error when loading APIs | Backend not running | Ensure `npm run dev` in backend terminal |

---

## STEP 5: Verify Full Stack Integration

### Test Backend Health

```bash
# Terminal: Check if backend is responding
curl http://localhost:5000/health

# Expected response:
# {"status":"ok","timestamp":"2026-02-27T..."}
```

### Test Backend APIs

```bash
# Test guest login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin@123"}'

# Expected response:
# {
#   "success": true,
#   "data": {
#     "accessToken": "eyJ...",
#     "refreshToken": "eyJ...",
#     "user": { ... }
#   }
# }
```

### Test Frontend Connection

```bash
# In Frontend Console (F12 Developer Tools):
fetch('http://localhost:5000/health')
  .then(r => r.json())
  .then(data => console.log('Backend OK:', data))
  .catch(err => console.error('Backend Error:', err))
```

---

## STEP 6: Complete Diagnostic Checklist

Run this checklist to identify the exact issue:

```bash
# 1. Docker containers running?
docker ps | grep -E "postgres|redis"
# Should show 2 containers

# 2. PostgreSQL accessible?
psql -h localhost -U flightuser -d flight_booking -c "\dt"
# Should list tables: bookings, airlines, cities, flights, passengers, users, etc.

# 3. Backend dependencies installed?
ls backend/node_modules | head
# Should list many packages

# 4. Backend running on port 5000?
lsof -i :5000
# Should show node process

# 5. Frontend dependencies installed?
ls frontend/node_modules | head
# Should list many packages

# 6. Frontend can reach backend?
curl -s http://localhost:5000/health | jq .
# Should return valid JSON

# 7. Database has data?
psql -h localhost -U flightuser -d flight_booking -c "SELECT COUNT(*) FROM cities;"
# Should return: count = 20

# 8. Can create new booking?
curl -X POST http://localhost:5000/api/booking \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"flight_id":"...","travel_date":"2026-03-15","trip_type":"ONE_WAY","passenger_count":1}'
# Should return booking object
```

---

## STEP 7: If You're Still Getting Errors

### Provide these details:

Please share:

1. **Exact error message(s)** - What does the terminal show?
   ```bash
   # Example of helpful error output:
   Error: connect ECONNREFUSED 127.0.0.1:5432
   ```

2. **Which step fails?**
   - npm install?
   - docker-compose up -d?
   - npm run migrate?
   - npm run seed?
   - npm run dev (backend)?
   - npm run dev (frontend)?
   - Accessing http://localhost:5173?

3. **Check logs:**
   ```bash
   # Backend error log
   docker logs flight_db 2>&1 | tail -20

   # Redis log
   docker logs redis 2>&1 | tail -20

   # npm output
   npm run dev 2>&1 | head -50
   ```

4. **System information:**
   - OS (Windows/Mac/Linux)
   - Node version: `node --version`
   - Docker version: `docker --version`
   - Currently running services on ports 5000, 5173, 5432, 6379

---

## STEP 8: Quick Reset (Nuclear Option)

If everything is broken, use this to completely reset:

```bash
# ⚠️ WARNING: This will delete all data!

# Stop containers
docker-compose down -v

# Remove node modules
rm -rf backend/node_modules
rm -rf frontend/node_modules

# Clear npm cache
npm cache clean --force

# Start fresh
docker-compose up -d
sleep 10  # Wait for containers to start

cd backend
npm install
npm run migrate
npm run seed
npm run dev

# In new terminal:
cd frontend
npm install
npm run dev
```

---

## STEP 9: After Successful Deployment

Once everything is running:

✅ **Backend**: http://localhost:5000 (API server)
✅ **Frontend**: http://localhost:5173 (React app)
✅ **Database**: localhost:5432 (PostgreSQL)
✅ **Cache**: localhost:6379 (Redis)

**Test the app:**
1. Go to http://localhost:5173
2. Click "Use These Credentials" to fill login form
3. Click "Sign In"
4. You should see the home page

---

## Getting Help

If you're still stuck, provide:

```
My error:
[Paste exact error message here]

Error occurs at step:
[Which of the 4 steps above]

Command that failed:
[The exact npm/docker command]

Output of diagnostic:
[Run the checklist above and share results]
```

This information will help diagnose the exact issue quickly.

---

**Common Success Indicators:**

```
✓ Both npm install commands completed without errors
✓ docker ps shows 2 containers running
✓ npm run migrate shows "Ran X migrations"
✓ npm run seed completes successfully
✓ Backend terminal shows "Server running on http://localhost:5000"
✓ Frontend terminal shows "Local: http://localhost:5173/"
✓ http://localhost:5173 loads in browser
✓ Login page displays with guest credentials form
```

---

**Ready to help debug!** Please share the specific error message and I'll provide targeted solutions.
