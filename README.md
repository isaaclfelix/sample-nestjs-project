# sample-nestjs-project

A Nest application with two surfaces in one process. The JSON API lives under `/api` (Zod validation, Swagger). React server-renders HTML at the root and hydrates islands from lazy chunks.

How the two sides fit together: [docs/architecture.md](./docs/architecture.md).

## Prerequisites

- [pnpm](https://pnpm.io/installation) 12. This repo uses pnpm, not npm or Yarn.
- Node.js 24.22.0. That version is pinned in [`.node-version`](./.node-version). `package.json` requires Node `>=24.7.0`.
- [Docker](https://docs.docker.com/get-docker/) for e2e (Testcontainers) and for the optional local database.
- [GNU Make](https://www.gnu.org/software/make/) for local database helpers (`Makefile`). Not required for `pnpm test` / CI unit jobs.

Install pnpm first, then install Node with pnpm's runtime manager and put `node` on your PATH:

```bash
pnpm runtime set node 24.22.0 -g
```

`-g` installs Node 24.22.0 globally. Without it, the same command also writes a `devEngines` entry into this project.

Confirm both tools before installing dependencies:

```bash
pnpm --version
node --version
```

`node --version` should print `v24.22.0`.

## Setup

```bash
pnpm install
```

`pnpm install` also installs the Git hooks and runs `prisma generate`. Commit, branch, and lint rules are in [CONTRIBUTING.md](./CONTRIBUTING.md).

## Database

PostgreSQL via Prisma. Copy `.env.example` to `.env` and keep `DATABASE_URL` pointed at local Compose (defaults match the Makefile).

```bash
# start Postgres (Docker Compose)
make db-up

# apply migrations
make db-migrate-deploy

# optional demo row
make db-seed
```

Other Make targets: `db-down`, `db-logs`, `db-migrate` (dev), `db-reset`, `db-studio`. Persistence design: [docs/architecture.md](./docs/architecture.md).

E2E does **not** use Compose. `pnpm test:e2e` starts Postgres with Testcontainers (Docker required).

## Run

```bash
# development, with reload (DB should be up)
pnpm start:dev

# development, one shot
pnpm start

# production (build first)
pnpm build
pnpm start:prod
```

The app listens on port 3000 unless `PORT` is set.

- Home page: [http://localhost:3000/](http://localhost:3000/)
- Greeting: [http://localhost:3000/api](http://localhost:3000/api)
- Swagger UI: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- OpenAPI document: [http://localhost:3000/api/docs-json](http://localhost:3000/api/docs-json)

## Checks

Run these locally before opening a pull request. [CI](./.github/workflows/ci.yml) runs the same five commands, each in its own job, after `pnpm install --frozen-lockfile`. Warnings fail lint. Coverage fails under the thresholds in [docs/testing-and-coverage.md](./docs/testing-and-coverage.md).

| CI job     | Local command   | What it does                                                         |
| ---------- | --------------- | -------------------------------------------------------------------- |
| `lint`     | `pnpm lint`     | Oxlint, type-aware, on `src/` and `test/`. Warnings fail.            |
| `build`    | `pnpm build`    | Nest compile, web typecheck, Vite client build, and the SSR bundle.  |
| `unit`     | `pnpm test`     | Unit tests (`*.spec.ts`).                                            |
| `e2e`      | `pnpm test:e2e` | HTTP tests (`*.e2e-spec.ts`) against Nest + Testcontainers Postgres. |
| `coverage` | `pnpm test:cov` | The unit suite again, with coverage thresholds.                      |

```bash
pnpm lint
pnpm build
pnpm test
pnpm test:e2e
pnpm test:cov
```

Local-only helpers, not separate CI jobs:

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `pnpm format`       | Write Prettier formatting.            |
| `pnpm format:check` | Fail if Prettier would change a file. |
| `pnpm test:watch`   | Re-run unit tests on change.          |
| `pnpm test:debug`   | Unit tests with the Node inspector.   |

## Observability

The app is instrumented with [NestJS Observe](https://observe.nestjs.com). To exercise that integration on your machine, request keys and put them in `.env`. Skip this section otherwise.

Request keys with:

```bash
npx @nestjs/observe link
```

Approve the printed code at [observe.nestjs.com/link](https://observe.nestjs.com/link). Then copy the example env file and fill in the two values:

```bash
cp .env.example .env
```

`.env` is gitignored. `start`, `start:dev`, and `start:debug` load it. In production, set `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` in the environment instead of using that file.

## Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) — branch names, commit messages, hooks, formatting, and lint.
- [docs/architecture.md](./docs/architecture.md) — how the JSON API and the React page layer share this process.
- [docs/testing-and-coverage.md](./docs/testing-and-coverage.md) — unit tests, e2e, coverage thresholds, and CI.
- [docs/known-tech-debt.md](./docs/known-tech-debt.md) — behavior we have not built yet, and how that debt is tracked.

## Agents

[AGENTS.md](./AGENTS.md) is the standing instruction file for coding agents in this repo. It requires line comments on non-obvious steps, JSDoc and explicit TypeScript types on every application function, green lint and typecheck after edits, and one commit per logical slice on a multi-step task.

Project skills live in [`.agents/skills`](./.agents/skills):

- [create-commit](./.agents/skills/create-commit/SKILL.md) — stage the current slice and write a Conventional Commit. [AGENTS.md](./AGENTS.md) is the ask for those incremental commits. Do not push unless asked.
- [create-pr](./.agents/skills/create-pr/SKILL.md) — push the branch with `gh` and create or update the pull request from [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md). Use it when asked to open a PR or refresh the description (`/create-pr`).

## License

UNLICENSED. This is a private project.
