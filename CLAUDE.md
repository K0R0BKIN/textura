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

`lib/articles.ts` generates articles using the OpenAI SDK via the Responses API with a platform-managed prompt. The function is cached with `'use cache'` + `cacheTag('articles')`.

**Persistence**: Articles are stored in Neon Postgres via Drizzle ORM (`lib/db/`). `generateArticle` checks the DB before calling the AI and saves the result after generation. The insert uses `onConflictDoNothing()` to handle concurrent first-requests safely.

**Caching**: `'use cache'` + `cacheLife('max')` + `cacheTag('articles')` sits on top of the DB layer. Within a deployment session, repeated requests hit the Next.js cache and skip the DB lookup entirely.

**Invalidation**: Restart the dev server to clear the Next.js cache. To clear DB articles, use `pnpm db:studio` or the Neon console.
