# EHCP Advocate App

An AI-powered EHCP case companion.

## Getting Started (Local Development)

1. Rename `.env.example` to `.env` or create it at the root.
2. Provide your API keys in `.env`:

```dotenv
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
ENCODIAN_API_KEY="YOUR_ENCODIAN_API_KEY_HERE"
APP_URL="http://localhost:3000"
```

3. Get a Gemini API key from [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey).
4. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

## Deploying to Production

The app uses an Express server that serves the Vite-built React frontend and proxies API calls to Gemini and Encodian. All API keys are kept server-side and never exposed to the browser.

### Render / Railway / Heroku

1. Connect your repository.
2. Set the following environment variables in your platform's dashboard:
   - `GEMINI_API_KEY` — required for all AI features
   - `ENCODIAN_API_KEY` — required for PDF/Word document processing
   - `NODE_ENV=production`
3. Set **Build Command**: `npm install && npm run build`
4. Set **Start Command**: `npm start`
5. Set **Port**: `3000`

The included `Procfile` handles the build + start sequence automatically for Heroku-compatible platforms.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Vite HMR + Express) |
| `npm run build` | Build the React frontend into `dist/` |
| `npm start` | Start production server (serves `dist/`) |
| `npm run lint` | TypeScript type-check |
