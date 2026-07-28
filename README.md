# GameForge AI

A React + Vite frontend paired with a local Express backend under `server/` for GameForge Systems AI.

## Local development

### Frontend
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the frontend:
   ```bash
   npm run dev
   ```
3. Open `http://127.0.0.1:8443`

### Backend
1. Install server dependencies:
   ```bash
   cd server
   npm install
   ```
2. Run the backend:
   ```bash
   npm run dev
   ```
3. Backend API will be available on `http://127.0.0.1:3001`

## GitHub publishing

1. Create a GitHub repository under your account.
2. In the local project root, initialize git and push:
   ```bash
   git init
   git add .
   git commit -m "Initial GameForge AI project"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

## Vercel deployment

This repository is configured to deploy the frontend as a static Vite app. Use the following settings in Vercel:

- Framework preset: `Other`
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `/`

### Notes

- The current backend lives in `server/` and is not automatically deployed by Vercel in this project structure.
- If you want the full dashboard to work in production, deploy the backend separately or refactor it into Vercel serverless functions.

## Useful commands

- Build frontend: `npm run build`
- Preview production build: `npm run preview`
- Install server deps: `cd server && npm install`
- Run server: `cd server && npm run dev`
