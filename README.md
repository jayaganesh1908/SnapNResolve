# SnapNResolve

**Snap it. Report it. Get it fixed.**

An AI-prioritized campus and community issue tracker, built as a BCA final year project (BCA644).

Students take a photo of a broken facility (fan, tap, Wi-Fi, dirty washroom, broken bench), add a note and the location, and submit it. An AI module picks the department, gives an urgency score and checks for duplicate reports. The admin sees every complaint sorted by priority, assigns a technician, and closes the ticket with a "proof of resolution" photo.

## Tech stack

| Part | Technology |
|---|---|
| App (this repo) | React + TypeScript + Vite + Tailwind CSS, wrapped as an Android APK with Capacitor |
| Backend | Java Spring Boot REST API (JWT login) |
| Database + photos | PostgreSQL on Supabase |
| AI module | Python (FastAPI + scikit-learn) |
| Hosting | Render (backend + AI), Vercel (admin website), GitHub Actions (APK build) |

## Current status

The screens are complete and run on **dummy data**. All data access is in `src/services/api.ts`. Each function has a `// Later:` comment with the real backend endpoint it will call.

## Run locally

Needs Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Use **Demo as Student** or **Demo as Admin** on the login screen.

Other commands:

```bash
npm run lint    # TypeScript check
npm run build   # production build into dist/
```
