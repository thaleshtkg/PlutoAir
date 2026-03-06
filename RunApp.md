# Run App

## 1) Start Docker services

From project root (`c:\Projects\QualititudeAI-Demo`):

```powershell
docker compose up -d
```

## 2) Start backend

Open terminal #1:

```powershell
cd c:\Projects\QualititudeAI-Demo\backend
npm install
npm run migrate
npm run seed
npm run dev
```

Backend runs on: `http://localhost:5000`

## 3) Start frontend

Open terminal #2:

```powershell
cd c:\Projects\QualititudeAI-Demo\frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

## 4) Open app

Go to: `http://localhost:5173`

---

## Quick daily startup (after first-time setup)

Usually enough:

```powershell
docker compose up -d
```

- backend: `npm run dev`
- frontend: `npm run dev`

Run `migrate`/`seed` only when schema/data changed.

---

## If something fails

- Check backend health: `http://localhost:5000/health`
- Verify containers: `docker ps`
- Port conflict (`5000`/`5173`): stop old process and rerun dev servers
