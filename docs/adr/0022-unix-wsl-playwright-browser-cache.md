# ADR-0022: Unix/WSL-first local platform and durable Playwright browser cache

- **Status:** Accepted
- **Date:** 2026-10-29

## Context

Local development and Cursor agent Shells run this repo on **Ubuntu under WSL2**. After browser UI testing landed ([ADR-0021](./0021-vitest-browser-ui-testing.md)), agents often failed the first `pnpm test:e2e` / browser unit run after an IDE restart: Cursor injects `PLAYWRIGHT_BROWSERS_PATH` under `/tmp/cursor-sandbox-cache/<hash>/playwright`, and that hash can change per session, so Chromium appeared “missing” even when the human had already run `pnpm exec playwright install --with-deps chromium` into Playwright’s durable default cache (`~/.cache/ms-playwright` on Linux).

We needed agents and humans to share one durable browser install without re-downloading hundreds of megabytes after every IDE restart, without inventing `LD_LIBRARY_PATH` hacks, and without pretending we already support macOS or native Windows outside WSL.

## Decision

- **Supported local platform (for now):** Unix environments, with **Ubuntu 26.04 LTS under WSL2** as the verified host. macOS and native Windows (outside WSL) are **not** verified; that gap is tracked as [TD-027](../known-tech-debt.md).
- **Playwright browser location:** `pnpm test`, `test:watch`, `test:cov`, `test:debug`, and `test:e2e` run under `env -u PLAYWRIGHT_BROWSERS_PATH` so Playwright uses its **platform default** durable cache and ignores Cursor’s per-session sandbox path.
- **OS shared libraries** remain a one-time human/CI concern via `pnpm exec playwright install --with-deps chromium` (may need `sudo` on Linux/WSL). Agents must not treat sandbox `/tmp` re-installs as the supported path after an IDE restart when the durable cache already has Chromium.
- Prefer the small Unix-shell `env -u` coupling over a portable Node launcher **while** TD-027 stands; revisit if/when multi-OS local support becomes a real requirement.

## Consequences

- After one human `--with-deps` install, agents can run browser unit/e2e via the pnpm scripts without re-downloading Chromium when Cursor’s sandbox hash changes.
- Scripts that bypass `package.json` (raw `vitest` / `playwright`) still see Cursor’s injected path and may fail or re-download.
- `env -u` is a deliberate Unix-shell assumption; documenting TD-027 keeps that debt visible instead of silently claiming cross-OS support.
- Operational detail lives in [testing-and-coverage.md](../testing-and-coverage.md#playwright-browsers-local-and-agents) and [AGENTS.md](../../AGENTS.md) §9.

## Alternatives considered

- **Hardcode `PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright`** — works on Linux but is wrong for macOS’s default cache layout; more coupled than unsetting.
- **Portable Node wrapper that deletes the env var and spawns Vitest** — avoids Unix `env -u`, but more churn than needed while the supported matrix is Unix/WSL-only; deferred with TD-027.
- **Keep installing into `/tmp/cursor-sandbox-cache/...` each agent session** — works, wastes bandwidth/time on every IDE restart; rejected.
- **Symlink sandbox hashes to the home cache** — fragile when the hash changes; rejected.
- **Claim macOS / native Windows support now** — untested; rejected in favor of TD-027 until there is demand and verification.
