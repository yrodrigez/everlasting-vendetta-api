# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Backend API for the "Everlasting Vendetta" World of Warcraft guild. Integrates with Blizzard and Discord APIs for authentication, character management, gear score calculation, raid tracking, and guild roster features. Targets WoW Classic Era and Classic Anniversary realms (EU region).

## Commands

- **Dev (local Node):** `pnpm dev:node` (runs via tsx, port 8080)
- **Dev (Cloudflare Workers):** `pnpm dev` (wrangler dev)
- **Build:** `pnpm build` (esbuild bundle to `dist/`)
- **Type check:** `pnpm type-check`
- **Lint:** `pnpm lint`
- **Format:** `pnpm format` / `pnpm format:check`
- **Test all:** `pnpm test`
- **Test single file:** `pnpm test -- path/to/file.spec.ts`
- **Test watch:** `pnpm test:watch`

## Architecture

Clean Architecture with three layers:

- **`domain/`** — Entities, repository interfaces (`i-*.ts`), service interfaces, and domain errors. No infrastructure imports allowed here.
- **`application/`** — Use cases (business logic orchestration) and DTOs. Each use case takes repository/service interfaces via constructor injection.
- **`infrastructure/`** — Implementations: Supabase repositories, Blizzard/Discord API clients, Hono HTTP layer, JWT security.

### Dual Runtime

The app runs on both **Cloudflare Workers** (`src/index.ts` — worker fetch handler) and **Node.js** (`src/server.ts` — `@hono/node-server`). Production deploys via Docker/Coolify (Node), with Cloudflare Workers as an alternative. The `index.ts` worker entry injects `env` into `process.env`.

### HTTP Layer Pattern (Route -> Controller -> UseCase)

Routes are defined in `infrastructure/http/routes/`. Each route file:
1. Creates a Hono sub-router
2. Uses `createRoute()` from `hono-adapter.ts` which handles Zod validation, logging, error mapping, and request context
3. Instantiates the controller via a **Factory** (`infrastructure/factories/`) which wires up all dependencies
4. The controller calls the use case

`createRoute<TInput, TOutput, TQuery, TParams>` provides a typed `RouteContext` with validated input, user payload, logger, and request ID.

### Key Infrastructure

- **Database:** Supabase (via `@supabase/supabase-js`), singleton from `DatabaseClientFactory`
- **Auth:** JWT tokens (access + refresh + anon) via `jose`/`jsonwebtoken`. Auth middleware sets `user` and `userId` on Hono context. Two auth levels: `authMiddleware` (accepts anon+authenticated), `authenticatedUserMiddleware` (requires authenticated user)
- **Validation:** Zod schemas in `infrastructure/http/validators/schemas/`, chained via `ValidationChainBuilder`
- **External APIs:** Blizzard API (OAuth + game data), Discord API, WoWHead scraping. Blizzard calls go through `BlizzardHttpClient` with token management

### Path Aliases

Configured in `tsconfig.json` and mirrored in `jest.config.js`:
`@entities/*`, `@errors/*`, `@use-cases/*`, `@repositories/*`, `@external/*`, `@database/*`, `@utils/*`, `@http/*`, `@validators/*`, `@dto/*`, `@infrastructure/*`, `@domain/*`

## Development Approach

This project follows **Test-Driven Development (TDD)** — write failing tests first, then implement the code to make them pass, then refactor. Use the `/tdd` skill when building features or fixing bugs.

## Deployment

Push to `main` triggers a Coolify webhook via GitHub Actions. Docker builds use a multi-stage Dockerfile (Node 20 Alpine).
