# Textura

AI-powered dictionary application in early development.

## Tech stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn (Base UI)
- next-themes
- OpenAI SDK (Responses API)
- Neon Postgres
- Drizzle ORM

## Setup

```bash
pnpm setup
pnpm dev
```

## Scripts

```bash
pnpm setup      # Link Vercel, pull development env vars, and install dependencies
pnpm dev        # Start the Next.js dev server
pnpm build      # Build for production
pnpm start      # Start the production server
pnpm lint       # Run ESLint
pnpm format     # Format the repo with Prettier
pnpm db:push    # Push the Drizzle schema to the database
pnpm db:studio  # Open Drizzle Studio
```
