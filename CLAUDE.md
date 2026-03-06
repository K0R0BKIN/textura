# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # Start dev server (uses webpack explicitly, not Turbopack)
pnpm build      # Production build
pnpm lint       # ESLint
pnpm format     # Prettier (writes in place)
pnpm db:push    # Push schema changes to Neon (dev only)
pnpm db:studio  # Open Drizzle Studio to browse/edit DB
```

## Architecture

**Textura** is an AI-powered dictionary app in early development. Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.

### Component library: shadcn with Base UI (not Radix UI)

`components.json` sets `style: "base-vega"`, which means shadcn generates components backed by **`@base-ui/react`** primitives instead of the standard `@radix-ui/*` packages. For example:

- `DropdownMenu` uses `@base-ui/react/menu` → `MenuPrimitive.Root`, `MenuPrimitive.Popup`, etc.
- `Button` uses `@base-ui/react/button` → `ButtonPrimitive`

This is not the default shadcn style — do not reference `@radix-ui/react-*` component imports.

### CSS theming: two-layer system

Colors flow through two distinct layers in `app/globals.css`:

1. **Radix Colors** (`@radix-ui/colors`) provides atomic CSS vars like `--brown-9`, `--sand-12`, `--gray-3`
2. **Semantic tokens** (`:root` and `.dark` blocks) map those to named vars like `--background`, `--foreground`, `--primary`
3. **`@theme inline`** maps the semantic tokens into Tailwind utility classes: `bg-background`, `text-foreground`, `text-primary`, etc.

Dark mode uses `next-themes` with `attribute="class"`. The CSS custom variant is declared as `@custom-variant dark (&:is(.dark *))`.

### ThemeSwitcher hydration pattern

`components/navbar/navbar.tsx` dynamically imports `ThemeSwitcher` with `{ ssr: false }` to avoid hydration mismatches, since `next-themes` needs client-side access to determine the resolved theme.

### Path aliases

`@/` maps to the repo root.

### AI

`lib/ai.ts` generates articles using the Vercel AI SDK with structured output (`Output.object`). The function is cached with `'use cache'` + `cacheTag('articles')`.

**Persistence**: Articles are stored in Neon Postgres via Drizzle ORM (`lib/db/`). `generateArticle` checks the DB before calling the AI and saves the result after generation. This survives deployments and dev server restarts — no regeneration cost on Vercel preview visits.

**Caching**: `'use cache'` + `cacheLife('max')` + `cacheTag('articles')` sits on top of the DB layer. Within a deployment session, repeated requests hit the Next.js cache and skip the DB lookup entirely.

**Invalidation**: `revalidateArticles` in `lib/actions.ts` deletes all DB entries then calls `updateTag('articles')` to clear the Next.js cache. The regenerate button (dev only) triggers this. Next visit to any article page generates fresh content and saves it back to DB. To regenerate a single article, delete its row via `pnpm db:studio`.

**Few-shot examples**: `lib/ai/prompts.ts` defines the system prompt and exports typed `Article` constants used as few-shot examples via `JSON.stringify`. If the schema changes, TypeScript will flag broken examples at compile time.
