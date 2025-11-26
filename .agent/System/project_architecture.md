# Project Architecture

## Product & Runtime Overview
StudyBuddy is a Vite + React single-page workspace that pairs an AI copilot with course management tools. Learners can create courses, upload documents, unlock demo slides/videos, and keep a CopilotKit-powered chat transcript running beside their materials. All durable data still lives in client-side state; REST calls (defined in `services/api.ts`) and CopilotKit streaming calls provide the bridge to eventual backend services.

## Tech Stack & Tooling
- **Framework/runtime**: React 19 inside Vite 7 with TypeScript (`tsc -b` guards builds).
- **AI layer**: `@copilotkit/react-core` + `@copilotkit/react-ui`; the entire app renders inside a `<CopilotKit>` provider configured in `main.tsx`.
- **UI system**: Tailwind CSS 3 (`src/index.css`) plus shadcn/Radix primitives under `src/components/ui` and icons from `lucide-react`.
- **State helpers**: `useFileUpload`, `useResizePanel`, and `useToast` manage uploads, resizing, and notifications. (The legacy `useChat` hook remains but the UI now delegates chat to CopilotKit.)
- **Tooling**: `@animaapp/vite-plugin-screen-graph` (dev-only) and Tailwind’s PostCSS integration inside `vite.config.ts`.
- **Scripts**: `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`.

## Repository Layout
- `src/main.tsx` attaches React to `#root`, wraps the tree in `CopilotKit` (`runtimeUrl=http://localhost:3000/api/copilotkit`, `agent="studybuddy_agent"`), and renders `App`.
- `src/App.tsx` is a thin shell that renders the `Studybuddy` screen.
- `src/screens/Studybuddy/Studybuddy.tsx` is the orchestration layer that owns every piece of app state and composes the three-pane layout with dialogs and toasts.
- `src/components/Sidebar`, `MainContent`, and `RightPanel` contain the columnar UI; deeper subfolders (`Dialogs`, `EmptyState`, `RightPanel`, `Sidebar`, `ui`) hold domain-specific widgets.
- `src/hooks` includes reusable behavior (upload validation, toast store, resize handlers). `src/constants` contains palette definitions and demo course scaffolding. `src/services` houses REST helpers.
- Global Tailwind config is expressed through `src/index.css` and `tailwind.config.js`; static assets belong to `public/` or `src/assets/`.

## Studybuddy Screen Responsibilities
`Studybuddy` (one React component) manages:
- **Global UI state**: theme toggles, sidebar/slide/video collapse flags, resize width, and demo unlocking.
- **Domain data**: array of courses (seeded with a CSC 252 demo course), the selected topic, an in-memory list of uploaded `materials`, and upload queue state from `useFileUpload`.
- **Dialogs & flows**: booleans for showing the create-course and materials dialogs, along with controlled inputs.
- **Copilot ceremony**: monitors `CopilotChat` progress to decide when demo PDFs/videos should be unlocked and fires agent prompts when the user picks a syllabus topic.
- **API orchestration**: delegates to `apiService` for course creation and document upload, adds optimistic state, and displays toast feedback via `useToast`.

## Pane Composition & Interaction
1. **Sidebar** (`components/Sidebar/Sidebar.tsx`)
   - Hosts the course dropdown (`CourseDropdown`) with hover affordances for delete/move operations, light/dark toggle, and the nested outline (`ContentsList`).
   - Collapsible to a 60px rail; uses Radix `ScrollArea` when expanded.
   - Course selection triggers `handleCourseChange`, which updates the selected topic and resets the right-pane document context.
2. **MainContent**
   - Renders the CopilotKit `<CopilotChat>` widget and wires `onInProgress` into `handleChatProgressChange`. Once any assistant run finishes, demo slides/videos become available.
   - Implements drag-and-drop + manual uploads for PDFs. Upload queue items can be removed before persisting.
   - “Save Materials” iterates the queued files and calls `apiService.uploadDocument` sequentially, mapping backend metadata (`document_id`, `title`, `processing`) to `Material` records stored in local state.
3. **RightPanel**
   - Contains `SlidesSection` and `VideoSection`, each collapsible independently but sharing a resize handle built from `useResizePanel`.
   - `SlidesSection` lazily fetches `/api/documents` (using `VITE_BACKEND_API_URL` or `VITE_VIDEO_API_URL` as base) when opened, loads the first document via `/api/documents/:id/file`, and, once the Copilot demo unlocks, forces the specific demo document to load.
   - `VideoSection` behaves similarly for `/api/videos`, optionally jumping to timestamps provided by the Copilot demo metadata.

## Copilot & Agent Flow
- `main.tsx`’s `<CopilotKit>` component points at `runtimeUrl=http://localhost:3000/api/copilotkit` and hardcodes the `studybuddy_agent`. Environment changes only require updating this file.
- `MainContent` embeds `CopilotChat` directly; CopilotKit automatically renders the transcript, composer, and toolbar. Labels are overridden to match the StudyBuddy brand.
- `Studybuddy` uses `useCopilotChat().appendMessage` to push scripted prompts whenever a syllabus topic is selected. These prompts include metadata (dates, readings, assignments) so the Copilot agent can answer in-context even before users ask questions.
- `handleChatProgressChange` tracks `onInProgress` events from the chat UI to detect when at least one model response finished; that gates the demo assets so first-time users see a guided workflow.

## Courses, Materials & Demo Data
- Demo scaffolding (`DEMO_UNITS`, `createDemoCourse`) lives in `Studybuddy.tsx`. Course content is a hierarchical `{ id, title, children[] }` structure consumed by the sidebar.
- When users create a course, `apiService.createCourse` POSTs to `${VITE_API_URL}/courses`, normalizes the returned ID, and appends it to in-memory state. The dialog enforces trimmed names and surfaces toast feedback.
- Material uploads call `${VITE_API_URL}/documents/upload` one file at a time. Responses are normalized into the local `Material` shape and tagged with backend `processing` status. Failed uploads remain queued so they can be retried.
- `demoAssetsUnlocked` injects a canned PDF + video reference (ids `doc_2025...` and `003cbc6c...`) into `materials` so the UI can show a full experience without user uploads.
- Deleting a course prunes it from state, swaps the active course to the remaining first entry, and surfaces toasts. Material delete/move actions live in `MaterialsDialog`.

## Materials & Media Management
- `useFileUpload` accepts drag/drop or `<input type="file">` events, filters to PDFs, and maintains an `uploadedFiles` array plus a `isDragging` flag for overlay states.
- `MaterialsDialog` shows three buckets:
  - Locally uploaded PDFs/videos for the current course (move/delete are supported).
  - Server documents fetched from `${VITE_BACKEND_API_URL || VITE_VIDEO_API_URL}/api/documents` (read-only until backend move APIs exist).
  - Server lecture recordings fetched via `${VITE_VIDEO_API_URL || http://localhost:8000}/api/videos`, which can also be deleted via `DELETE /api/videos/:id`.
- Right-pane viewers (“Slides” and “Lecture Clip”) rely on these same endpoints. Documents are streamed as blobs and shown inside an `<iframe>` with `#page=` query parameters; videos use a `<video>` tag with timestamp badges when Copilot supplies a target time.

## Data Model (current schema)
Defined in `src/types/index.ts`:
- `Course`: `{ id: string; name: string; content: Array<{ id: string; title: string; children: string[] }> }`.
- `Material`: `{ id: string; name: string; courseId: string; type: "pdf" | "video"; documentId?: string; status?: "stored" | "processing" | "queued" }`.
- `ColorScheme`: palette tokens consumed throughout the layout.
- (Legacy) `ChatMessage` remains defined for future bespoke chat UIs but CopilotKit now owns rendering.

## Backend & Environment Contracts
- `VITE_API_URL` (default `http://localhost:8000/api`) powers the typed `apiService` helpers for course CRUD, chat (`/chat`), document uploads, and course content generation. Network calls from `Studybuddy` use these helpers.
- `VITE_BACKEND_API_URL` and `VITE_VIDEO_API_URL` are read inside `SlidesSection`, `VideoSection`, and `MaterialsDialog` to fetch or delete server-hosted PDFs/videos. When both exist, `VITE_BACKEND_API_URL` takes precedence for document operations.
- `main.tsx` hardcodes the Copilot runtime to `http://localhost:3000/api/copilotkit`; change this when pointing to a remote CopilotKit server.
- There is no database bundled with the repo. The TypeScript models above represent the expected payloads exchanged with the backend services described here.

## Build, Dev, and Styling Notes
- Development: `npm run dev -- --host 127.0.0.1 --port <port>` avoids binding issues in sandboxed terminals.
- Production: `npm run build` performs `tsc -b` then `vite build`; strict TS settings mean unused imports or non-type-only imports will fail builds.
- Tailwind tokens and CSS keyframes live in `src/index.css`; keep component-specific styles close to their `.tsx` files and favor CSS variables defined there.

## Related Docs
- `.agent/SOP/feature_workflow.md`
