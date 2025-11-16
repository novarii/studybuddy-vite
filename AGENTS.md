# Repository Guidelines

## Project Structure & Module Organization
Source lives in `src/`, with React entry points `main.tsx`, `App.tsx`, route-level styles in `index.css`, and component-specific styles beside each `.tsx`. Shared graphics stay in `src/assets/`, while static files (favicons, manifest) belong in `public/`. Tooling files (`vite.config.ts`, `tsconfig*.json`, `eslint.config.js`) sit at the root and should not import runtime code. Keep new modules flat under `src/` until they justify feature folders (e.g., `src/features/schedules/`).

## Build and Development Commands
- `npm run dev` – launches the Vite dev server with React Fast Refresh; use when iterating on UI.
- `npm run build` – runs `tsc -b` then `vite build` to produce `/dist`; verify before every release.
- `npm run preview` – serves the latest production build locally to parity-check routing and asset paths.
- `npm run lint` – executes the flat ESLint config; run before pushing to guard against regressions.

## Coding Style & Naming Conventions
Use TypeScript React function components, typed props/interfaces, and React hooks. Favor 2-space indentation and single quotes, mirroring the scaffold. Components use `PascalCase.tsx`, hooks use `useThing.ts`, and utilities use `camelCase.ts`. Keep styles scoped via CSS classes defined in adjacent `.css` files; prefix component-specific classes (`StudyPlanCard__body`). ESLint enforces the JavaScript, TypeScript, React Hooks, and React Refresh presets; extend the config instead of disabling rules inline.

## Commit & Pull Request Guidelines
There is no commit history yet, so adopt Conventional Commits (`feat: add study timer panel`) to keep the log scannable. Each PR should include: a concise summary, linked issue or ticket, screenshots or clips for UI updates, and a checklist of tested commands. Keep PRs focused (one feature or fix) and request review once `npm run lint` and relevant tests pass.
