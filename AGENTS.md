# AGENTS.md - CromulentEditor Developer Guide

This document provides guidelines and conventions for agents working in this codebase.

## Project Overview

- **Type**: React SPA with Vite
- **Stack**: React 19, TypeScript, Tailwind CSS v4, Vite 8
- **Runtime**: Bun/Node.js for development
- **Purpose**: Privacy-first document editor with a local AI assistant that runs entirely in the browser — no backend, no API keys, no data ever leaves the machine.

---

## Build & Development Commands

### Core Commands

```bash
npm run dev          # Start Vite dev server (port 5173)
npm run build       # TypeScript check + production build
npm run preview    # Preview production build locally
npm run lint       # Run biome check
npm run lint:ai    # Run ast-grep AI coding standards
```

---

## AI Coding Standards (ast-grep)

This project uses [ast-grep](https://ast-grep.github.io/) rules to enforce LLM-friendly code patterns. Rules live in `rules/` and are configured via `sgconfig.yml`.

### Rule Categories

| Rule | Severity | Description |
|------|----------|-------------|
| `exports-need-return-types` | error | Exported functions in `src/lib/` must have explicit return types |
| `max-function-length` | warning | Functions over ~2000 chars should be split into smaller helpers |
| `no-any-in-lib` | error | No `any` in `src/lib/` — use `unknown` or proper types |
| `no-empty-catch` | warning | Empty catch blocks must have an explanatory comment |
| `no-console-in-production` | warning | Avoid `console.log` in committed code |
| `no-inline-async-handlers` | warning | Extract async JSX event handlers into named functions |
| `no-default-exports` | warning | Prefer named exports for clearer module APIs |

### Suppressing Violations

Place an inline comment on the line **immediately before** the violation:

```typescript
// ast-grep-ignore: no-any-in-lib
const adapter = await (navigator as any).gpu.requestAdapter();
```

Multiple rules can be suppressed with a comma-separated list:

```typescript
// ast-grep-ignore: rule-one, rule-two
```

---

## Project Structure

```
src/
  App.tsx                         # Root layout with sidebar + editor shell
  main.tsx                        # Entry point (StrictMode, ThemeProvider, TooltipProvider)
  index.css                       # Global styles, @import "tailwindcss", theme vars
  components/
    ui/                           # shadcn/ui components (button, sidebar, sheet, tooltip, etc.)
    theme-provider.tsx            # Thin wrapper around next-themes ThemeProvider
    editor/
      DocumentEditor.tsx          # Main editor: Tiptap instance + formatting toolbar + AI dropdown
      SlashCommandExtension.tsx   # Tiptap Extension wiring @tiptap/suggestion → React portal menu
      SlashCommandMenu.tsx        # React component for floating / command palette UI
      slash-commands.tsx          # Command definitions (headings, lists, AI actions, filtering)
  hooks/
    use-mobile.ts                 # useIsMobile hook (768px breakpoint)
  lib/
    utils.ts                      # cn() helper (clsx + tailwind-merge)
    bonsai.ts                     # Model loader: pipeline init, WebGPU/WASM detection, cache mgmt
    ai.ts                         # AI action definitions, prompt templates, queryBonsai() wrapper
    storage.ts                    # Multi-document localStorage API (CRUD, persistence, migration)
```

---

## Architectural Mandates

### 1. Vite 8 & Tailwind v4
- Uses Vite 8 with `@tailwindcss/vite` plugin
- Tailwind v4 uses `@import "tailwindcss"` in CSS
- No legacy `tailwind.config.js` needed
- Vite alias: `@` → `./src`

### 2. Shadcn-UI Integration
- Style: base-nova
- Icons: Lucide (`lucide-react`)
- Components in `@/components/ui`
- Additional primitives from `@radix-ui/react-*` and `@base-ui/react`

### 3. Local LLM (In-Browser)
- **Library**: `@huggingface/transformers` v4
- **Model**: `onnx-community/Bonsai-1.7B-ONNX`
- **Execution**: WebGPU (primary) with WASM fallback
- **Caching**: Browser Cache API under `transformers-cache` namespace
- **Quantization levels**: Q1 (~277 MB), Q2 (~482 MB), Q4 (~1.0 GB)
- **Pipeline**: `text-generation` via `pipeline('text-generation', MODEL_ID, ...)`
- **API**: `generate(messages: ChatMessage[])` → returns assistant message content

### 4. Editor Architecture
- **Engine**: Tiptap 2 (`@tiptap/react`, `@tiptap/starter-kit`)
- **Placeholder**: `@tiptap/extension-placeholder`
- **Slash commands**: Custom Tiptap Extension using `@tiptap/suggestion`
  - Renders a React portal (`createRoot` → `document.body`) positioned at the caret
  - Commands include formatting (headings, lists, blockquotes, code blocks) and AI actions
  - AI actions inside slash commands share the same `onAiAssist` handler as the toolbar AI button
- **Toolbar**: Manual sticky toolbar with format toggles and an "Ask AI" dropdown
- **Storage bridge**: `editor.storage.aiAssist` holds refs to `onAiAssist` and `setActiveAiAction` so slash commands can trigger AI without prop drilling

---

## Code Style Guidelines

### Formatting
- Uses **Biome** (`biome.json`) for linting and formatting
- 2-space indentation
- Run `npm run lint` before committing

### TypeScript
- Use explicit types for function parameters and return values
- Avoid `any` — use `unknown` if type is truly unknown
- `biome.json` may suppress `useExhaustiveDependencies` in a few editor hooks where dependencies are intentionally omitted; do not remove those suppressions without understanding the Tiptap lifecycle

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `DocumentEditor`, `Button` |
| Functions | camelCase | `handleAiAssist`, `queryBonsai` |
| Custom Hooks | camelCase prefixed with `use` | `useIsMobile` |
| Variables | camelCase | `isLoading`, `theme` |
| Types/Interfaces | PascalCase | `ChatMessage`, `ModelStatus` |

---

## State Management

- Use `useState` for local component state
- Use `useCallback` for stable event handlers passed to child components
- `useRef` is used to bridge Tiptap storage with React closures without causing re-renders

---

## Import Ordering

1. External libraries (react, react-dom, etc)
2. Internal modules (`@/components`, `@/hooks`, `@/lib`)
3. Relative imports (`./`, `../`)
4. Type imports (`import type`)

---

## Data Persistence

### Documents (Multi-page storage)

Documents are stored as structured JSON in `localStorage` via `src/lib/storage.ts`:

- **`cromulent:documents`** — `Record<string, Document>` keyed by document ID
- **`cromulent:activeDocId`** — ID of the currently open document

Each `Document` contains:
```ts
interface Document {
  id: string;           // crypto.randomUUID()
  title: string;        // persisted, editable via header input
  content: string;      // Tiptap HTML
  createdAt: number;    // timestamp
  updatedAt: number;    // timestamp (updated on every content/title change)
}
```

- **Auto-save**: Content saves on every `onUpdate` from Tiptap
- **Title persistence**: Header title input writes directly to the store
- **Migration**: On first load, legacy `cromulent:content` is converted into a proper Document
- **CRUD**: Sidebar lists all pages with click-to-switch, create, and delete

### AI Model Cache

- **Mechanism**: Browser Cache API (`transformers-cache` namespace)
- **Trigger**: First AI use downloads the model (~277 MB–1.0 GB)
- **Persistence**: Survives page reloads and browser restarts
- **Clearing**: Available via sidebar "Clear AI cache" button
- **Note**: Model cache is tied to the browser's cache storage. Clearing "cached images and files" in browser settings will delete it. Document storage in `localStorage` is separate and unaffected.

---

## Key Dependencies

| Package | Purpose |
|---|---|
| `@huggingface/transformers` | Local text-generation pipeline |
| `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`, `@tiptap/suggestion` | Rich text editor |
| `next-themes` | Dark/light mode switching |
| `@radix-ui/react-dropdown-menu`, `@radix-ui/react-slot`, `@base-ui/react` | UI primitives |
| `lucide-react` | Icons |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Component styling utilities |
| `@fontsource-variable/geist` | App font |
| `tailwindcss`, `@tailwindcss/vite`, `tailwindcss-animate`, `tw-animate-css` | Tailwind v4 |

---

## Testing

- **No testing framework is currently set up.** If you add one, prefer Vitest (native Vite integration) or `@testing-library/react`.

---

## Notes

- The first AI use triggers a model download (~277 MB–1.0 GB depending on quantization). Track `ProgressCallback` from `@huggingface/transformers` for UI feedback.
- `env.allowLocalModels = false; env.useBrowserCache = true;` is set in `src/lib/bonsai.ts` to enforce remote fetch + browser caching.
- Theme switching is handled by `next-themes` with `attribute="class"`, `defaultTheme="system"`, and `disableTransitionOnChange`.
