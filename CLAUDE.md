# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Textura** is an AI-powered dictionary application built as a portfolio project. This is production-quality code intended for deployment and resume demonstration.

## Development Commands

```bash
# Start development server at http://localhost:3000
npm run dev

# Create production build
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

## Architecture

### Next.js 16 App Router

- Uses `/app` directory structure
- Server Components by default (use `'use client'` sparingly for interactivity)
- File-based routing in `/app`

### TypeScript

- Strict mode enabled
- Path alias configured: `@/*` maps to project root
- Example: `import Component from '@/app/components/Component'`

### Styling

- **Tailwind CSS 4**: Utility-first CSS framework with inline theme configuration
- **Dark Mode**: Implemented via next-themes with system preference detection
- **Color System**: Radix Colors (Sand, Brown, Red) for accessible, semantic theming
- **Fonts**:
  - **Inter** (variable): Primary sans-serif font loaded via `next/font/google`
  - **Source Serif 4**: Serif font for enhanced typography
  - CSS variables: `--font-inter` and `--font-source-serif`

### Code Quality

- **ESLint**: Linting configured with Next.js and TypeScript rules
- **Prettier**: Code formatter configured with:
  - Single quotes for JavaScript/TypeScript
  - Tailwind class sorting via prettier-plugin-tailwindcss
- **prettier-plugin-tailwindcss**: Automatically sorts Tailwind utility classes for consistency

### Component Library

- **shadcn/ui**: Copy-paste component library configured with CSS variables
- **Location**: Components installed to `@/components/ui/`
- **Customization**: Full ownership of component code for modifications
- **Utilities**: `cn()` helper in `@/lib/utils.ts` for class merging

### Theming

- **Color Foundation**: Radix Colors providing 12-step semantic scales
  - **Sand**: Warm neutral gray for backgrounds, borders, muted elements
  - **Brown**: Accent color for primary buttons, links, focus states
  - **Red**: Destructive actions and error states
- **Dark Mode**: next-themes library manages theme state
  - Automatic system preference detection
  - `.dark` class applied to `<html>` element
  - Radix Colors automatically provide dark variants
- **CSS Variables**: All colors mapped to shadcn semantic tokens
  - `--background`, `--foreground`, `--primary`, etc.
  - Consistent theming across all components

## Deployment

Deploying to Vercel.
