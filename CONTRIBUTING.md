# Contributing

## Git workflow

### Branch names

Use **lowercase kebab-case** with a **type prefix** (aligned with [Conventional Commits](https://www.conventionalcommits.org/) types):

| Prefix      | Use for                                      |
| ----------- | -------------------------------------------- |
| `feat/`     | New user-facing or API behavior              |
| `fix/`      | Bug fixes                                    |
| `docs/`     | Documentation only                           |
| `chore/`    | Tooling, dependencies, config                |
| `refactor/` | Code change without intended behavior change |
| `test/`     | Tests only                                   |
| `ci/`       | CI/CD configuration                          |
| `perf/`     | Performance improvements                     |
| `build/`    | Build system or bundler changes              |
| `style/`    | Formatting only (no behavior change)         |
| `revert/`   | Reverting a prior commit or change           |

**Pattern:** `type/short-description-in-kebab-case`

**Examples:** `feat/user-email-uniqueness`, `fix/create-user-id-overwrite`, `chore/add-commitlint`

**Long-lived branches** (no `type/` prefix): `main`, `master`, `develop`, `staging`.

**Avoid:** spaces, vague names like `fix/bug` or `feat/update`.

### Commit messages

Commits are validated with **[Commitlint](https://github.com/conventional-changelog/commitlint)** using [@commitlint/config-conventional](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional). Rules match [Conventional Commits](https://www.conventionalcommits.org/) (see [commitlint.config.js](./commitlint.config.js)).

**Summary line format:** `type(optional-scope): subject`

- **Type** is lowercase and must be one of: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`.
- **Scope** in parentheses is optional, e.g. `feat(user): reject duplicate emails`.
- **Subject** follows the preset (length, case, no trailing period).

**Branch vs commit:** branches use a slash (`feat/add-login`); commits use a colon and a space (`feat: add login`).

**Examples:** `fix(user): stop spreading class instances on update`, `chore: add commitlint`, `docs: link contributing guide`

### Pre-push hook

A **Husky** `pre-push` hook blocks pushes from branches whose names do not match the convention above (except the long-lived allowlist).

**Bypass when you must** (emergency only):

- **Unix shell / Git Bash / WSL:** `HUSKY=0 git push`
- **PowerShell:** `$env:HUSKY=0; git push`

### Commit-msg hook (Commitlint)

A **Husky** `commit-msg` hook runs Commitlint on every commit message.

**Bypass when you must** (emergency only):

- **Unix shell / Git Bash / WSL:** `HUSKY=0 git commit`
- **PowerShell:** `$env:HUSKY=0; git commit`

After cloning, run **`pnpm install`** so the `prepare` script installs Husky hooks. On Windows, use **Git for Windows** or **WSL** so hooks run with `sh`.

## Formatting and lint

Code style is **[Prettier](https://prettier.io/)** (see [`.prettierrc`](./.prettierrc)). Indent, charset, and line endings are also declared in [`.editorconfig`](./.editorconfig) for editors that do not run Prettier. Lint is **[oxlint](https://oxc.rs/docs/guide/usage/linter)** with the **correctness** category as errors and `--type-aware --deny-warnings` (warnings fail the check). See [AGENTS.md](./AGENTS.md) for agent rules.

### Editor setup (Cursor / VS Code)

This repo commits [`.vscode/extensions.json`](./.vscode/extensions.json) and [`.vscode/settings.json`](./.vscode/settings.json). Install the recommended extensions when prompted:

| Extension    | ID                          | Role                                                     |
| ------------ | --------------------------- | -------------------------------------------------------- |
| EditorConfig | `EditorConfig.EditorConfig` | Applies [`.editorconfig`](./.editorconfig)               |
| Prettier     | `esbenp.prettier-vscode`    | Format on save (default formatter)                       |
| Oxc          | `oxc.oxc-vscode`            | Inline oxlint using [`.oxlintrc.json`](./.oxlintrc.json) |

Workspace settings enable format-on-save with Prettier and oxlint in the editor (`oxfmt` is off; Prettier owns formatting).

### Scripts

- `pnpm format` — format TypeScript under `src/` and `test/`, plus root/docs `*.json` / `*.md`.
- `pnpm format:check` — verify formatting without writing.
- `pnpm lint` — run oxlint (must pass with no warnings).

### Pre-commit hook (lint-staged)

A **Husky** `pre-commit` hook runs **[lint-staged](https://github.com/lint-staged/lint-staged)** on staged files: oxlint + Prettier for `*.ts`, Prettier for `*.{json,md}`.

**Bypass when you must** (emergency only): same `HUSKY=0` pattern as above.
