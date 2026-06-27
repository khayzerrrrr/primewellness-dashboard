# Deployment Guide (staging-ready)

Prerequisites: Docker, Docker Compose, Node 18+, Git.

Local (Docker Compose):

1. Copy environment example:

```bash
cp .env.example .env
```

2. Start database and app (build will use Dockerfile):

```bash
docker compose up --build -d
```

3. View logs:

```bash
docker compose logs -f app
```

Standalone image build:

```bash
docker build -t primewellness-app .
docker run -e DATABASE_URL="postgresql://user:pass@host:5432/db" -p 3000:3000 primewellness-app
```

Deploy to Vercel:

- This repository is compatible with Vercel (Next.js). Connect the repo in Vercel dashboard.
- Ensure environment variables from `.env.example` are set in Vercel project settings.
- Vercel will run `npm run build`. The included Dockerfile builds a standalone Next.js output used for container deployment; for Vercel standard deploys, no Docker is required.

Firebase notes (optional):

- If you want to use Firebase (Auth/Firestore/Storage) instead of Postgres, set the `FIREBASE_*` environment variables from `.env.example` in your hosting provider.
- Install Firebase SDKs locally before using them:

```bash
npm install firebase firebase-admin
```

- For `FIREBASE_PRIVATE_KEY` paste the private key JSON `private_key` value but replace real newlines with `\n` so the key can be stored in a single-line env var.

GitHub Actions -> Vercel deploy

- A workflow `.github/workflows/deploy-vercel.yml` is included. It uses the Vercel CLI to deploy on pushes to `main`/`master`.
- Create a repository secret named `VERCEL_TOKEN` with a token from your Vercel Account (Account Settings → Tokens).
- Optionally set `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` as secrets and pass them to `npx vercel` if you prefer explicit linking.

Secrets checklist:

- `VERCEL_TOKEN` (required for GitHub Action deploy)
- `DATABASE_URL` (for CI build if necessary)
- `BETTER_AUTH_SECRET` (production secret)
- `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PROJECT_ID` (if using Firebase server SDK)


CI/CD / Container Registry:

- Build and push the image to a registry (GitHub Container Registry, Docker Hub), then deploy the image to your hosting (AWS ECS, DigitalOcean App Platform, etc.).

Notes:

- Replace `BETTER_AUTH_SECRET` with a secure secret in production.
- If you plan to use Firebase instead of Postgres, update `DATABASE_URL` and related code accordingly.
