# CromulentEditor — Local Bonsai Integration Plan

## Goal
Replace the remote HuggingFace Space API call with fully offline, in-browser LLM inference using `@huggingface/transformers` + WebGPU, with OPFS model caching. Follow patterns established in `../textcast`.

---

## Phase 1: Fix Existing Bugs (no new deps)

### 1.1 Deduplicate `AiAction` types
- [x] Create `src/lib/ai.ts` with shared `AiAction` type, `AI_ACTIONS` list, and `AI_PROMPTS` map
- [x] Remove duplicates from `App.tsx` and `DocumentEditor.tsx`

### 1.2 Fix theme conflict
- [x] Remove manual `theme` state + `classList.toggle` from `App.tsx`
- [x] Install `next-themes` and wrap `App` in `ThemeProvider` in `main.tsx`
- [x] Use `useTheme()` from `next-themes` in `App.tsx` for toggle

### 1.3 Fix destructive `setContent` in AI handler
- [x] When action is `continue`: **append** AI result after selection/cursor
- [x] When action is `rewrite`/`fix-spelling`/`change-tone`: **replace** only the selected text
- [x] When action is `summarize`/`expand`: **replace** only the selected text
- [x] Only replace full document when no selection and non-continue action

### 1.4 AI menu UX
- [x] Add click-outside-to-close for the AI dropdown
- [x] Show loading indicator on the specific action clicked

### 1.5 Add localStorage persistence
- [x] Save editor HTML on content change via `onUpdate` callback
- [x] Restore on mount via `initialContent` prop

### 1.6 Import Geist font
- [x] Add `import "@fontsource-variable/geist"` in `App.tsx`

---

## Phase 2: Local Bonsai Inference Engine

### 2.1 Install `@huggingface/transformers`
- [x] `npm install @huggingface/transformers`

### 2.2 Create `src/lib/bonsai.ts` — local inference engine
- [x] Singleton text-generation pipeline with WebGPU/WASM fallback
- [x] `env.useBrowserCache = true` for auto OPFS caching
- [x] `checkWebGPU()`, `loadModel()`, `generate()`, `isModelLoaded()`, `clearModels()`
- [x] Model: `onnx-community/Bonsai-1.7B` (~290MB)

### 2.3 Update `src/lib/ai.ts`
- [x] Replace remote `queryBonsai()` with local `generate()` from bonsai.ts

### 2.4 Model loading UX in App
- [x] Model status state: `idle` → `downloading` → `ready` → `error`
- [x] Progress bar in header during download
- [x] "Load AI" button when idle, auto-loads on first AI action
- [x] "Clear AI model cache" button in sidebar footer

### 2.5 Update `DocumentEditor` props
- [x] `modelStatus` prop controls AI button label/disabled state
- [x] AI button reflects: "Ask AI" / "Loading..." / "Thinking..." / "AI Error"

---

## Phase 3: Slash Commands

### 3.1 Implement `/` command palette
- [x] Tiptap `Suggestion` extension configured with `char: "/"`
- [x] Floating command menu with keyboard navigation (↑/↓/Enter/Esc)
- [x] Commands: headings, lists, blockquote, code block, AI actions
- [x] On select: remove `/` text, execute command
- [x] Filtered by typed query with keyword matching

---

## File Change Summary

| File | Changes |
|------|---------|
| `package.json` | Add `@huggingface/transformers`, `@tiptap/suggestion`, `next-themes` |
| `src/main.tsx` | Wrap `App` in `ThemeProvider` |
| `src/lib/ai.ts` | ✅ Created — shared types + prompts, local engine |
| `src/lib/bonsai.ts` | ✅ Created — local inference engine (singleton, WebGPU, OPFS) |
| `src/App.tsx` | Fix theme with `useTheme()`, add persistence, model loading state |
| `src/components/editor/DocumentEditor.tsx` | Fix setContent, click-outside, model status, slash commands |
| `src/components/editor/SlashCommandExtension.tsx` | ✅ New — Tiptap extension with `@tiptap/suggestion` |
| `src/components/editor/SlashCommandMenu.tsx` | ✅ New — React floating menu with keyboard nav |
| `src/components/editor/slash-commands.tsx` | ✅ New — command definitions + filtering logic |

---

## Reference: textcast patterns to follow
- `../textcast/src/lib/transcription/transformers-whisper.ts` — model loading, WebGPU check, singleton, progress
- `../textcast/src/lib/storage.ts` — OPFS abstraction (not needed; transformers.js handles caching)
- `../textcast/src/App.tsx` lines 86-106 — "Clear AI Models" button (iterates OPFS root, removes `transformers-cache` entries)
