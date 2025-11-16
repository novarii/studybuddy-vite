# Project Architecture

## Overview
StudyBuddy is a single-page React + TypeScript workspace that lets students create courses, upload PDFs, and chat with an AI assistant about their materials. The entire UI runs client-side today: course data, chat history, and uploaded files all live in React state, while `services/api.ts` sketches the future backend integration for LLM chat and material ingestion.

## Tech Stack & Tooling
- **Framework**: React 19 rendered through Vite 7 with TypeScript in bundler mode.
- **Styling**: Tailwind CSS 3 (loaded via `src/index.css`) with custom animations plus shadcn/radix primitives in `src/components/ui` for buttons, dialogs, dropdowns, inputs, textarea, toast, and scroll area.
- **Icons**: `lucide-react`.
- **State utilities**: Custom hooks (`useChat`, `useFileUpload`, `useResizePanel`, `useToast`).
- **Build scripts** (`package.json`): `npm run dev`, `npm run build` (`tsc -b` + `vite build`), `npm run lint`, `npm run preview`.
- **Tooling**: `@animaapp/vite-plugin-screen-graph` (design handoff) and Tailwind injected as a PostCSS plugin in `vite.config.ts`.

## Repository Layout
- `src/main.tsx` bootstraps React into `#root` and renders `App` ➜ `Studybuddy` screen.
- `src/screens/Studybuddy/Studybuddy.tsx` is the orchestration layer responsible for global UI state, dialogs, and theming.
- `src/components/Sidebar`, `MainContent`, and `RightPanel` build the three-column layout; supporting pieces live under `components/Dialogs`, `components/Chat`, `components/EmptyState`, and `components/ui`.
- `src/constants` holds palette definitions and starter course outlines, `src/services` contains API abstractions plus mock responses, and `src/hooks` encapsulates reusable behaviors.
- `tailwind.css` (aliased through `src/index.css`) defines Tailwind base layers, custom CSS variables, and keyframes shared across the workspace.

## Runtime Architecture
1. `Studybuddy` composes the experience:
   - Chooses the color scheme (`darkModeColors`/`lightModeColors`).
   - Stores course metadata, materials, chat state, drag/drop, upload queues, and right-panel sizing.
   - Renders either an onboarding `EmptyState` (no courses yet) or the full tri-pane UI.
2. **Sidebar** handles course selection/creation, topic navigation, and theme toggling. It consumes `CourseDropdown`, `ContentsList`, and Radix scroll areas.
3. **MainContent** hosts drag-and-drop uploads, the chat transcript (rendered via `AnimatedText` for assistant messages), the composer, and a button to launch `MaterialsDialog`.
4. **RightPanel** summarizes slides and video tiles, collapsible via `SlidesSection`/`VideoSection`, with dimensions managed by `useResizePanel`.
5. **Dialogs** (`CreateCourseDialog`, `MaterialsDialog`) reuse shadcn primitives for creation and material management, while `Toaster` surfaces toast notifications from `useToast` and `useFileUpload`.

## State & Data Flow
- All persistent data currently sits in local component state within `Studybuddy`. Newly created courses/materials are appended to those arrays with timestamps used for unique IDs.
- `useChat(courseId)` maintains per-course chat histories inside a `Map` and synthesizes responses via `services/mockResponses`. Messages capture role, content, timestamp, and a typing flag for placeholder animation.
- `useFileUpload` restricts uploads to PDFs, manages drag/drop hover state, and routes success/failure feedback through `useToast`.
- `useResizePanel` listens for mouse events on the right edge to keep the panel width between configured bounds.

## API & Integration Points
- `services/api.ts` defines the future contract with a backend (environment-driven `VITE_API_URL`) for chat, material uploads, and generated course content. The UI does not call it yet, but the interface and expected payloads are documented there.
- `services/mockResponses.ts` powers the placeholder assistant replies until the real LLM endpoint is wired up.
- No third-party authentication or data stores are currently wired; everything is client-only.

## Data Model (acts as the current "schema")
Defined in `src/types/index.ts`:
- `Course`: `{ id, name, content: Array<{ id, title, children: string[] }> }`.
- `Material`: `{ id, name, file, courseId, type: "pdf" | "video" }`.
- `ChatMessage`: `{ id, role: "user" | "assistant", content, timestamp, isTyping? }`.
- `ColorScheme`: theme palette consumed by all components.

## Build & Local Development Notes
- Run `npm install`, then `npm run dev -- --host 127.0.0.1 --port <port>` when working inside the sandbox (binding to `0.0.0.0` can fail without elevated permissions).
- `npm run build` requires the TypeScript issues (type-only imports, unused types, Node globals) to be resolved; see `services/api.ts` and `vite.config.ts` warnings logged during compilation.
- Static assets live under `public/` (served at `/`) and `src/assets/` (bundled imports). Keep root-level config files (ESLint, TSConfig, Tailwind) synchronized with any new tooling.

## Related Docs
- `.agent/SOP/feature_workflow.md`
- `.agent/Tasks/llm-chat-prd.md`
