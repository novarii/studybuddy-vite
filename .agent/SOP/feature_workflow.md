# Feature Delivery SOP

This SOP outlines how to safely add or extend functionality in StudyBuddy. Follow the phases below for every feature or bugfix.

## 1. Prepare the Workspace
1. Install dependencies (`npm install`) and run `npm run dev -- --host 127.0.0.1 --port 5173`.
2. Keep another terminal for `npm run lint`/`npm run build` so TypeScript errors are caught early—verbatim module syntax requires `import type` for every type-only import.
3. Sync any provided designs from Anima before editing shared UI primitives in `src/components/ui`.

## 2. Plan State & Types First
1. Update `src/types/index.ts` with any new domain types (Course extensions, new Material kinds, etc.).
2. Extend `src/constants/` or `src/services/` only after the types are committed; hooks/components rely on those contracts.
3. When introducing API calls, add them to `services/api.ts` and gate the feature behind environment-driven URLs (`VITE_*`).

## 3. Add or Extend UI Modules
1. The `Studybuddy` screen owns global state. Introduce new state hooks there and drill props into the relevant pane (`Sidebar`, `MainContent`, `RightPanel`).
2. Co-locate reusable bits under `src/components/<Domain>/`. Favor composition over expanding existing components unless the feature is tightly related.
3. Use shadcn primitives from `components/ui` to maintain visual consistency. New styles should come from Tailwind classes or CSS variables defined in `src/index.css`.

## 4. Storage, Upload, and Chat Integrations
1. `useFileUpload` currently assumes PDFs; if new formats are required, update its validation logic and the Save handler in `Studybuddy`.
2. `useChat` must remain course-aware. When wiring to the real backend, swap the mock response inside `useChat` with the relevant `apiService` call and preserve optimistic updates.
3. Keep `materials` and `courses` mutations immutable (`setState` with spreads) so future persistence layers can hook in.

## 5. QA & Validation
1. Exercise drag-and-drop, manual file selection, dialog workflows, and resizing in both light and dark mode.
2. Run `npm run lint` and `npm run build`; resolve type errors, especially those triggered by the strict TS config (no unused locals/params, type-only imports).
3. Capture screenshots or recordings for UI-affecting PRs and describe tested commands in the PR body per the contributor guidelines.

## Related Docs
- `.agent/System/project_architecture.md`
- `.agent/Tasks/llm-chat-prd.md`
