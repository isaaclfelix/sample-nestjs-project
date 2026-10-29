# Testing and coverage

How this repo runs unit tests, e2e tests, and coverage — locally and in CI.

Ownership and tooling decisions: [ADR-0021](./adr/0021-vitest-browser-ui-testing.md).

## Commands

| Command         | What it does                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm lint`     | Oxlint with `--type-aware`. Static analysis; **not** a full TypeScript emit.                                                                           |
| `pnpm build`    | Nest/`tsc` compile of app sources. Authoritative typecheck.                                                                                            |
| `pnpm test`     | Unit workspace: Node project + Vitest browser-mode project (`*.spec.ts`).                                                                              |
| `pnpm test:e2e` | E2E workspace: HTTP (`*.e2e-spec.ts` via supertest) + browser journeys (`*.browser-e2e-spec.ts` via Playwright library) against Nest + Testcontainers. |
| `pnpm test:cov` | Same unit workspace under V8 coverage; fails if thresholds are not met.                                                                                |

HTML report after `pnpm test:cov`: open `coverage/index.html` (directory is gitignored).

## Layers

| Layer             | Config                                                            | Owns                                                          |
| ----------------- | ----------------------------------------------------------------- | ------------------------------------------------------------- |
| Unit (Node)       | [`vitest.config.ts`](../vitest.config.ts) project `node`          | Nest/API/runtime `.ts`                                        |
| UI unit (browser) | [`vitest.config.browser.ts`](../vitest.config.browser.ts)         | Island/page UI states in Chromium (Playwright provider) + RTL |
| HTTP e2e          | [`vitest.config.e2e-http.ts`](../vitest.config.e2e-http.ts)       | API contracts, SSR HTML smoke strings                         |
| Browser e2e       | [`vitest.config.browser-e2e.ts`](../vitest.config.browser-e2e.ts) | Auth UI journeys against listening Nest + Vite middleware     |

**In-repo vs out-of-repo:** this app owns the four layers above for every shipped path. Separate QA-org tooling (Cucumber repos, visual release matrices, cross-system sign-off) is deferred org-scale work, not a hole in in-repo coverage. See [ADR-0021](./adr/0021-vitest-browser-ui-testing.md).

## Coverage policy

- **Unit coverage only** (Node + browser UI unit projects). Thresholds via [`vitest.config.ts`](../vitest.config.ts).
- **Included:** `src/**/*.ts` (product `.tsx` coverage lands with island UI specs).
- **Excluded:** `src/main.ts`, Vite build plugins, `**/*.module.ts`, `src/**/*.tsx`, specs, generated Prisma client, `node_modules`, `dist`.
- **E2E is a behavioral gate**, not part of the coverage percentage. Do not merge unit+e2e coverage reports for this project.
- **Thresholds** (statements / branches / functions / lines) are floors locked a little under the measured baseline. Branch floor remains **99%** until product `.tsx` joins the include set.
- When you change **controllers or HTTP contracts**, update or add `*.e2e-spec.ts` in the same PR.
- When you change **interactive UI or navigation**, update or add browser unit specs and `*.browser-e2e-spec.ts` in the same PR.

## Naming notes

- **Coverage / “Istanbul”:** this repo uses Vitest’s **V8** coverage provider (`provider: 'v8'`). Reports may still look Istanbul-shaped (`lcov`, HTML). Older prose saying “Istanbul %” means the coverage threshold number, not the Istanbul provider.
- **`@testing-library/jest-dom`:** DOM matchers for Vitest `expect` via `import '@testing-library/jest-dom/vitest'`. The “jest” name is historical; the Jest test runner is not a dependency and does not own tests here.

## CI workflow

CI installs with `pnpm install --frozen-lockfile`. Dependency build scripts are gated by [`pnpm-workspace.yaml`](../pnpm-workspace.yaml) `allowBuilds` (pnpm 12 `strictDepBuilds`). `@scarf/scarf` is denied (telemetry from OpenAPI tooling). If CI fails with `ERR_PNPM_IGNORED_BUILDS` for a new package, run `pnpm approve-builds <pkg>` or `pnpm approve-builds !<pkg>` locally and commit the YAML update.

Unit and coverage jobs install Playwright Chromium for Vitest browser mode. The e2e job installs Chromium for browser journeys and needs Docker for Testcontainers.

### Playwright browsers (local and agents)

```bash
pnpm exec playwright install --with-deps chromium
```

`--with-deps` installs OS shared libraries Chromium needs (`libnspr4`, `libnss3`, ALSA, …). **CI** runs this on unit, coverage, and e2e jobs.

**Humans:** run the command once locally (may prompt for `sudo` on Linux/WSL).

**Cursor agents:** the agent Shell often cannot complete `sudo` interactively. Prefer asking the user to run `pnpm exec playwright install --with-deps chromium` in their IDE terminal. Do **not** invent long-lived `LD_LIBRARY_PATH` workarounds as project docs — those are emergency session hacks only. See also [AGENTS.md](../AGENTS.md) §9 for related agent-shell constraints.

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on every pull request and on pushes to `main`. Parallel jobs:

| Job        | Command                                          |
| ---------- | ------------------------------------------------ |
| `lint`     | `pnpm lint`                                      |
| `build`    | `pnpm build`                                     |
| `unit`     | `pnpm test` (needs Chromium)                     |
| `e2e`      | `pnpm test:e2e` (Docker + Chromium)              |
| `coverage` | `pnpm test:cov` + PR coverage comment (Chromium) |

`unit` and `coverage` both run the unit workspace (once without instrumentation, once with). That is intentional so each check stays clear.

## E2E and the database

E2E boots `AppModule`, which requires a real Postgres. **Testcontainers** starts `postgres:16-alpine` once per `pnpm test:e2e` run (`test/e2e-global-setup.ts`), applies `prisma migrate deploy`, and shares `DATABASE_URL` with workers. Each test truncates tables via `createE2eApp` / `truncateDatabase` so suites stay isolated. Why Testcontainers (not Compose) for e2e: [ADR-0010](./adr/0010-e2e-testcontainers.md).

Browser e2e also attaches Vite middleware and `listen`s on an ephemeral port ([`test/browser-e2e-app.ts`](../test/browser-e2e-app.ts)) so Playwright can load hydrate scripts the same way `main.ts` does in development.

- **Docker** must be available locally and on the CI runner (GitHub-hosted Ubuntu images include it).
- Compose (`make db-up`) is for human `start:dev` only. E2E does **not** use Compose.
- Unit tests mock `USER_REPOSITORY` (service) or `PrismaService` (adapter). They never start Docker. Adapter unit tests keep coverage above the Vitest floors when new persistence code lands.

Why **lint and build are separate:** oxlint `--type-aware` uses type information but is not Nest/`tsc` emit. `pnpm build` still catches type errors the linter can miss (see [AGENTS.md](../AGENTS.md)).

## Branch protection (admin)

YAML alone does not block merges. A repo admin should configure **Settings → Branches → Branch protection rule** for `main`:

1. Enable **Require status checks to pass before merging**.
2. Require these checks (exact job names): `lint`, `build`, `unit`, `e2e`, `coverage`.
3. Avoid allowing ordinary contributors to bypass the rule.

Until that is set, CI still runs and goes red on failure, but GitHub will not hide the merge button.

## Future (not implemented)

Documented for later; do not treat these as current requirements:

- **Codecov / Coveralls** — patch coverage on changed lines (catches “forgot tests on new functions” when global % still passes).
- **Coverage ratchet** — auto-raise thresholds on `main` when coverage increases.
- **Mutation testing (StrykerJS)** — measures whether tests would fail if code were wrong; stronger than line coverage, slower to run.
- **Merged unit + e2e coverage** — costly and noisy for Nest bootstrap; usually not worth it early.
- **SonarQube / SonarCloud** — broader quality gates.
- **Path-specific thresholds** — e.g. a higher floor for `src/api/user/**`.
- **Org-scale / out-of-repo QA** — only when a QA function or multi-system release process needs it (see ADR-0021 ownership line).
