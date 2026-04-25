# CromulentEditor

> A document editor with a local AI assistant that runs **entirely in your browser** — no backend, no API keys, no data ever leaves your machine.

CromulentEditor uses modern web technologies to bring a capable text-generation model directly into the browser via [HuggingFace Transformers.js](https://huggingface.co/docs/transformers.js/). It downloads and caches the model using the Origin Private File System (OPFS), then runs inference on-device using WebGPU (with a WASM fallback for unsupported hardware). The result is a fully offline-capable, privacy-preserving writing tool.

## Why CromulentEditor?

Most AI-powered editors send your text to a remote server. CromulentEditor does the opposite: the model comes to you. The [Bonsai-1.7B-ONNX](https://huggingface.co/onnx-community/Bonsai-1.7B-ONNX) model is downloaded once and cached in the browser. All summarization, rewriting, tone adjustments, and text continuation happen on your device, making this suitable for confidential or sensitive writing.

## Architecture

- **Frontend**: React 19 + TypeScript + Vite 8
- **Editor**: [Tiptap](https://tiptap.dev/) with a custom slash-command palette (`/`) for formatting and AI actions
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Local LLM**: `@huggingface/transformers` with WebGPU acceleration and WASM fallback
- **Model caching**: OPFS via the browser's Cache API — models persist across sessions
- **Quantization**: Three ONNX quantization levels (Q1 / Q2 / Q4) letting users trade quality for speed

## Features

- **Local AI Assistant** — Summarize, expand, rewrite, fix spelling & grammar, change tone, or continue writing — all processed on-device via Bonsai 1.7B
- **Slash Commands** — Type `/` anywhere to bring up a floating command palette for headings, lists, blockquotes, code blocks, and AI actions
- **Rich Text Editing** — Tiptap-powered with bold, italic, strikethrough, headings (H1–H3), bullet/numbered lists, blockquotes, and code blocks
- **Dark / Light Mode** — Automatic system theme detection with manual toggle via `next-themes`
- **Document Persistence** — Editor content auto-saves to `localStorage`
- **WebGPU + WASM** — Uses GPU acceleration when available; seamlessly falls back to CPU inference
- **OPFS Model Caching** — Models are cached locally so they work offline after the first download
- **Quantization Selector** — Switch between Q1 (~277 MB), Q2 (~482 MB), and Q4 (~1.0 GB) model variants

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Build Tool | [Vite 8](https://vitejs.dev/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Components | [shadcn/ui](https://ui.shadcn.com/) |
| Rich Text Engine | [Tiptap](https://tiptap.dev/) (ProseMirror-based) |
| Local LLM | [@huggingface/transformers](https://huggingface.co/docs/transformers.js/) |
| Model | [Bonsai-1.7B-ONNX](https://huggingface.co/onnx-community/Bonsai-1.7B-ONNX) |
| Acceleration | WebGPU (primary) / WASM (fallback) |
| State | `localStorage` (documents), OPFS Cache API (models) |

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview

# Run linting
npm run lint
```

> **Note**: The first time you use the AI assistant, the model will download (~277 MB–1.0 GB depending on the selected quantization). This is cached for subsequent sessions.

## AI Model Details

CromulentEditor uses the **Bonsai-1.7B-ONNX** model via Transformers.js. Choose your quantization level in the sidebar:

| Level | Size | Speed | Quality |
|---|---|---|---|
| **Q1** | ~277 MB | Fastest | Draft quality |
| **Q2** | ~482 MB | Balanced | Good quality |
| **Q4** | ~1.0 GB | Slowest | Best quality |

Models are cached using the browser's Cache API under the `transformers-cache` namespace. You can clear the cache at any time from the sidebar.

## Privacy

- No network requests to external AI APIs
- No telemetry or analytics
- Your document content lives in your browser's `localStorage`
- The model is downloaded directly from HuggingFace and cached locally

## License

[MIT](LICENSE)
