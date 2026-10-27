# Testing and coverage

How this repo runs unit tests, e2e tests, and coverage — locally and in CI.

## Commands

| Command         | What it does                                                                 |
| --------------- | ---------------------------------------------------------------------------- |
| `pnpm lint`     | Oxlint with `--type-aware`. Static analysis; **not** a full TypeScript emit. |
| `pnpm build`    | Nest/`tsc` compile of app sources. Authoritative typecheck.                  |
| `pnpm test`     | Unit suite (`*.spec.ts`).                                                    |
| `pnpm test:e2e` | E2E suite (`*.e2e-spec.ts`) via HTTP against Nest + Testcontainers Postgres. |
| `pnpm test:cov` | Same unit suite under V8 coverage; fails if thresholds are not met.          |

HTML report after `pnpm test:cov`: open `coverage/index.html` (directory is gitignored).

## Coverage policy

- **Unit coverage only.** Thresholds apply to `src/**/*.ts` via [`vitest.config.ts`](../vitest.config.ts).
- **Excluded from coverage:** `src/main.ts`, `src/web/vite-shell-css-budget.ts` (Vite build plugin), `**/*.module.ts`, `src/**/*.tsx`, specs, `node_modules`, `dist`. Nest wiring, bootstrap, build plugins, and React views add little signal next to the HTTP tests. Thresholds stay on `src/**/*.ts`.
- **E2E is a behavioral gate**, not part of the coverage percentage. Do not merge unit+e2e Istanbul reports for this project yet.
- **Thresholds** (statements / branches / functions / lines) are floors locked a little under the measured baseline. Raise them when coverage improves; do not lower them to land a PR without team agreement.
- When you change **controllers or HTTP contracts**, update or add `*.e2e-spec.ts` in the same PR.

## CI workflow

CI installs with `pnpm install --frozen-lockfile`. Dependency build scripts are gated by [`pnpm-workspace.yaml`](../pnpm-workspace.yaml) `allowBuilds` (pnpm 12 `strictDepBuilds`). `@scarf/scarf` is denied (telemetry from OpenAPI tooling). If CI fails with `ERR_PNPM_IGNORED_BUILDS` for a new package, run `pnpm approve-builds <pkg>` or `pnpm approve-builds !<pkg>` locally and commit the YAML update.

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs on every pull request and on pushes to `main`. Parallel jobs:

| Job        | Command                                           |
| ---------- | ------------------------------------------------- |
| `lint`     | `pnpm lint`                                       |
| `build`    | `pnpm build`                                      |
| `unit`     | `pnpm test`                                       |
| `e2e`      | `pnpm test:e2e` (needs Docker for Testcontainers) |
| `coverage` | `pnpm test:cov` + PR coverage comment             |

`unit` and `coverage` both run the unit suite (once without instrumentation, once with). That is intentional so each check stays clear.

## E2E and the database

E2E boots `AppModule`, which requires a real Postgres. **Testcontainers** starts `postgres:16-alpine` once per `pnpm test:e2e` run (`test/e2e-global-setup.ts`), applies `prisma migrate deploy`, and shares `DATABASE_URL` with workers. Each test truncates tables via `createE2eApp` / `truncateDatabase` so suites stay isolated.

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
