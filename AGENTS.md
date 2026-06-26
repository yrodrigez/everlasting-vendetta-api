# AGENTS.md

## Commands

- Install deps: `pnpm install`.
- Node dev server: `pnpm dev:node` (`src/server.ts`, port `8080`).
- Worker dev server: `pnpm dev` (`wrangler dev`, entry `src/index.ts`).
- Build production Node bundle: `pnpm build` (esbuild bundles `src/server.ts` to `dist/`).
- Start built app: `pnpm start` (`node dist/server.js`).
- Typecheck: `pnpm type-check`.
- Lint: `pnpm lint`.
- Format check / write: `pnpm format:check` / `pnpm format`.
- Test all: `pnpm test`.
- Test one file: `pnpm test -- path/to/file.spec.ts`.

## Verification

- Preferred local verification order: `pnpm lint`, `pnpm type-check`, `pnpm test`.
- Jest only looks under `src/` and matches `**/__tests__/**/*.ts`, `**/*.spec.ts`, `**/*.test.ts`.
- ESLint only targets `src/**/*.ts`; root config files are not part of lint coverage.

## Runtime Quirks

- This repo has two runtime entrypoints sharing `createApp()` in `src/app.ts`:
    - `src/server.ts` for Node via `@hono/node-server`
    - `src/index.ts` for Cloudflare Workers via Wrangler
- The Worker entry copies Cloudflare `env` into `process.env`; the Node entry does not load `.env` for you.
- `docker-compose.yml` is the only verified local path that wires `.env` automatically.
- Production build/deploy path is Node, not Workers: `build.mjs` bundles `src/server.ts`, Docker runs `dist/server.js`, and `.github/workflows/deploy.yml` only triggers a Coolify webhook on push to `main`.

## Architecture

- Keep Clean Architecture boundaries intact:
    - `src/domain/`: entities, interfaces, domain services/errors
    - `src/application/`: use cases and ports/DTOs
    - `src/infrastructure/`: HTTP, repositories, external clients, security
- Hono app composition lives in `src/app.ts`; mounted API routes are under `/api`, with `/api/health` defined in `src/infrastructure/http/routes/index.ts`.
- Route handlers are expected to go through `createRoute()` in `src/infrastructure/http/hono-adapter.ts` for validation, logging, error mapping, request IDs, and typed route context.
- Route wiring is mixed: some routes instantiate repositories/use cases inline, others go through factories/controllers. Match the surrounding file instead of forcing one pattern.

## Repo Conventions

- Path aliases from `tsconfig.json` are used heavily (`@entities`, `@use-cases`, `@http`, `@database`, etc.); prefer them over deep relative imports when the file already follows that style.
- Tests live beside code under `src/tests/`; there is no top-level `tests/` directory.
- Formatting is Prettier with 4 spaces, semicolons, double quotes, and trailing commas where valid in ES5.
- `CLAUDE.md` states this repo uses TDD; preserve that workflow when adding or fixing behavior.

## Environment

- Verified required env keys from `src/infrastructure/environment.ts` and `docker-compose.yml`:
  `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `BLIZZARD_CLIENT_ID`, `BLIZZARD_CLIENT_SECRET`, `BLIZZARD_REGION`, `BLIZZARD_LOCALE`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_GUILD_ID`, `JWT_EV_PRIVATE_KEY`, `JWT_EV_REFRESH_PRIVATE_KEY`, `JWT_EV_ANON_KEY`, `JWT_EV_KID`, `ENVIRONMENT`, `PORT`.
- Realm/namespace behavior is hardcoded in `src/infrastructure/environment.ts`; changes to supported realms are code changes, not config-only changes.
