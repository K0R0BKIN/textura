#!/usr/bin/env bash
set -euo pipefail

pnpm dlx vercel@latest link --yes --project textura
pnpm dlx vercel@latest env pull .env.local --yes
pnpm install
