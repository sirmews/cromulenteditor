# CromulentEditor

A privacy-first, AI-powered document editor that runs entirely in your browser. No data leaves your machine — all AI inference happens locally using WebGPU and WASM via the HuggingFace Transformers.js library.

## Features

- **Local AI Assistant** — Summarize, expand, rewrite, fix spelling, change tone, or continue writing using the Bonsai 1.7B model, all processed on-device
- **Slash Commands** — Type `/` for quick access to formatting and AI actions
- **Rich Text Editing** — Powered by Tiptap with support for headings, lists, blockquotes, code blocks, and more
- **Dark / Light Mode** — Automatic system theme detection with manual toggle
- **Document Persistence** — Content is automatically saved to localStorage
- **WebGPU + WASM Fallback** — Uses GPU acceleration when available, falls back to CPU
- **OPFS Model Caching** — Downloaded models are cached in the browser for offline use

## Tech Stack

- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite 8](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Tiptap](https://tiptap.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [@huggingface/transformers](https://huggingface.co/docs/transformers.js/)

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

## AI Model

CromulentEditor uses the [Bonsai-1.7B-ONNX](https://huggingface.co/onnx-community/Bonsai-1.7B-ONNX) model via HuggingFace Transformers.js. The model is downloaded and cached in the browser on first use. You can choose between three quantization levels:

- **Q1 (~277 MB)** — Fastest, lowest quality
- **Q2 (~482 MB)** — Balanced speed and quality
- **Q4 (~1.0 GB)** — Best quality, slowest

## License

[MIT](LICENSE)
