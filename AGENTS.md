# AGENTS.md - CromulentEditor Developer Guide

This document provides guidelines and conventions for agents working in this codebase.

## Project Overview

- **Type**: React SPA with Vite
- **Stack**: React 19, TypeScript, Tailwind CSS v4, Vite 8
- **Runtime**: Bun/Node.js for development

---

## Build & Development Commands

### Core Commands

```bash
npm run dev          # Start Vite dev server (port 5173)
npm run build       # TypeScript check + production build
npm run preview    # Preview production build locally
npm run lint       # Run biome lint
```

---

## Architectural Mandates

### 1. Vite 8 & Tailwind v4
- Uses Vite 8 with @tailwindcss/vite plugin
- Tailwind v4 uses @import "tailwindcss" in CSS
- No legacy configuration files needed

### 2. Shadcn-UI Integration
- Style: base-nova
- Icons: Lucide
- Components in @/components/ui

---

## Code Style Guidelines

### Formatting
- Uses Prettier-compatible formatting via editor configuration
- 2-space indentation
- Run `npm run lint` before committing

### TypeScript
- Use explicit types for function parameters and return values
- Avoid `any` - use `unknown` if type is truly unknown

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `CodeEditor`, `Button` |
| Functions | camelCase | `handleAiAssist`, `queryBonsai` |
| Custom Hooks | camelCase prefixed with `use` | - |
| Variables | camelCase | `isLoading`, `theme` |
| Types/Interfaces | PascalCase | `ChatMessage` |

---

## State Management

- Use `useState` for local component state
- Use `useCallback` for stable event handlers

---

## Import Ordering

1. External libraries (react, react-dom, etc)
2. Internal modules (@/components, @/hooks, @/lib)
3. Relative imports (./, ../)
4. Type imports (import type)

---

## Notes

- CromulentEditor uses Tiptap editor withPlaceholder extension
- AI assist connects to PrismML Bonsai WebGPU HuggingFace Space
- Theme switching via next-themes