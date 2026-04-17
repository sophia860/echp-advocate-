# Copilot agent instructions for the echp-advocate repo
# This file tells the GitHub Copilot coding agent how to work in this codebase.

## Project overview

React 19 + TypeScript single-page application with an Express back-end proxy.
- **Front-end:** Vite + React + Tailwind CSS (v4)
- **Back-end:** `server.ts` (Express) — proxies requests to Gemini AI (`/api/ai`)
  and Encodian Flowr (`/api/flowr/*`)
- **AI keys** are server-side only (`GEMINI_API_KEY`, `ENCODIAN_API_KEY`).
  Never expose them in client code or commit them to source.

## Key commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| TypeScript lint | `npm run lint` |
| Clean build artefacts | `npm run clean` |

## Agent behaviour

- **Fix scope:** Only touch files directly related to the reported issue.
  Do not refactor unrelated code.
- **TypeScript:** All code must pass `npm run lint` (`tsc --noEmit`) before
  opening a PR.
- **Style:** Follow the existing code style (single quotes, 2-space indent,
  no semicolons where the file already omits them).
- **Tests:** There are no automated tests yet. Do not add a test framework
  unless the issue explicitly asks for it.
- **Secrets:** Never hard-code API keys or secrets. Use `process.env.*` on
  the server side only.
- **Dependencies:** Prefer updating existing packages over adding new ones.
  Run `npm install` (not `yarn` or `pnpm`).
- **PR title format:** `fix: <short description>` (conventional commits).
- **PR body:** Briefly explain what was broken and how you fixed it.
  Reference the triggering issue with `Closes #<number>`.
