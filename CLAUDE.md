# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Textura is a Next.js application (with React 19) for dictionary/word definition lookup with an autocomplete search interface. The app provides real-time search suggestions with keyboard navigation support and is configured for static export as a Single-Page Application.

## Tech Stack

- **Frontend Framework**: Next.js 16 with React 19 and TypeScript
- **Build Tool**: Next.js (configured for static export/SPA mode)
- **Styling**: Tailwind CSS 4 with Radix UI Colors
- **Icons**: Radix UI Icons + Heroicons
- **Fonts**: Inter Variable (sans-serif), Source Serif 4 Variable (serif)

## Development Commands

```bash
# Start development server
npm run dev

# Build for production (static export to ./dist/)
npm run build

# Start production server (serves the static export)
npm run start

# Run linter
npm run lint

# Format code with Prettier
npm run format

# Preview production build (same as start)
npm run preview
```

## Architecture

### Next.js App Router Structure

The app uses Next.js App Router with static export configuration:

- `src/app/layout.tsx` - Root layout that wraps all pages with HTML structure and metadata
- `src/app/[[...slug]]/page.tsx` - Catch-all route for client-side routing
- `src/app/[[...slug]]/client.tsx` - Client component wrapper with 'use client' directive
- `next.config.js` - Configured for static export (`output: 'export'`) to `./dist/` directory
- Dynamic import with SSR disabled to preserve client-side routing behavior

### State Management

The app uses React's `useReducer` for state management in the SearchBox component. The reducer pattern handles:

- User input (`TYPE`)
- Focus states (`FOCUS`, `BLUR`)
- Selection (`SELECT`)
- Keyboard navigation (`NAVIGATE`)
- Highlighting (`HIGHLIGHT`)
- Closing suggestions (`CLOSE`)

### Component Structure

- `App.tsx` - Root component that loads fonts and renders HomePage
- `pages/HomePage.tsx` - Main page layout with Logo, Toolbar, and SearchBox
- `components/SearchBox.tsx` - Main search interface with reducer-based state management
- `components/SuggestionList.tsx` - Dropdown list of search suggestions
- `components/Toolbar.tsx` - Top navigation bar with icon buttons
- `data/entries.ts` - Static array of word definitions (SuggestionEntry[])
- `types/index.ts` - TypeScript type definitions

### Data Flow

1. User types in SearchBox → dispatches `TYPE` action
2. Query filters ENTRIES array (prefix match, case-insensitive)
3. Filtered suggestions render in SuggestionList
4. User can navigate with arrow keys (dispatches `NAVIGATE`)
5. Selection updates query and closes dropdown (dispatches `SELECT`)

### Key Features

- **Keyboard Navigation**: Arrow up/down to navigate, Enter to select, Escape to close
- **Mouse Interaction**: Click or hover over suggestions
- **Active Highlighting**: Visual feedback for keyboard and mouse navigation
- **Auto-focus**: Search input is focused on page load
- **Maximum Suggestions**: Limited to 6 items at a time

## Styling System

### Tailwind Configuration

- Uses Tailwind CSS 4 with `@tailwindcss/postcss` plugin
- PostCSS configuration in `postcss.config.mjs`
- Custom theme defined in `src/index.css` using `@theme` blocks
- Color system based on Radix UI Colors (Brown for accent, Sand for grays)

### Design Tokens

Semantic color tokens are defined as CSS custom properties:

- `--accent-*` - Primary UI colors (brown scale)
- `--gray-*` - Neutral colors (sand scale)
- `--accent-bg`, `--accent-bg-hover` - Background states
- `--gray-border`, `--gray-border-hover` - Border states
- `--accent-solid`, `--accent-solid-hover` - Button fills
- `--gray-text-*` - Text color variants (inverted, dim, placeholder, contrast)

### Typography

- Sans-serif: Inter Variable (default body font, font-light)
- Serif: Source Serif 4 Variable (used for "Textura" logo, font-black)

## TypeScript Configuration

- Path alias `@/*` maps to `src/*` (configured in tsconfig.json)
- Strict mode enabled with additional checks (noUnusedLocals, noUnusedParameters, etc.)
- Using modern ES2023 target with bundler module resolution
- Next.js automatically extends the TypeScript configuration

## Code Style

- **Prettier**: Single quotes for JS/TS, double quotes for JSX, Tailwind plugin for class sorting
- **ESLint**: Configured with Next.js (eslint-config-next) and Prettier compatibility
- **Imports**: Use `@/` alias for all src imports (e.g., `@/components/SearchBox`)

## Build & Deployment

- Next.js is configured for **static export** mode (`output: 'export'` in next.config.js)
- Build output goes to `./dist/` directory (instead of default `.next/`)
- The app exports as a Single-Page Application (SPA) that can be deployed to any static host
- Client-side routing is preserved through the catch-all route `[[...slug]]`
- The original React app is dynamically imported with SSR disabled (`ssr: false`)

## Important Notes

- The search uses prefix matching: `query.toLowerCase().startsWith()` against entry terms
- The reducer pattern ensures predictable state updates - always dispatch actions rather than setting state directly
- Mouse events on SuggestionList use `onMouseDown={(e) => e.preventDefault()}` to prevent input blur
- Active index of -1 means no suggestion is highlighted
- All client-side React code runs in components marked with 'use client' directive
