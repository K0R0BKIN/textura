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
- Tailwind CSS 4 with utility-first approach
- Dark mode support built-in
- Geist font family loaded via `next/font/google`

### Planned Additions
- shadcn/ui component library (to be added as needed)
- Additional stack decisions (auth, database, etc.) will be made when features require them

## Deployment

Deploying to Vercel.
