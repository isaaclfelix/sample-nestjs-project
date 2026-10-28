# Agent instructions

## 1. Line comments for human readers

Keep short **line comments** above non-obvious steps in application code (services, helpers, controllers when the flow is not obvious). They exist for humans, not for the compiler.

- Explain **behavior and intent**: uniqueness, hashing, mapping, why a field is generated, why a missing delete is a no-op.
- Restore comments on refactor when the step still exists; rewrite them if the step changed (do not delete a block of comments just to “clean up”).
- Prefer one comment per logical step, in the same style as `UserService` (`// Get the user from the map.`).
- Do not comment the trivial (`i++`) or narrate TypeScript types in line comments.
- Line comments and JSDoc are both required: JSDoc on the function, line comments inside the body.

## 2. JSDoc on every function

Every function and method in application source (`src/**`, not `it()` / `describe()` in tests) **must** have a JSDoc block. When creating or updating code, add JSDoc if it is missing and keep it accurate if the signature or behavior changed.

Required shape:

```ts
/**
 * Short summary in one sentence (what the caller gets).
 *
 * Longer description: when to call it, side effects, errors, invariants
 * (for example uniqueness, hashing, HTTP status pairing).
 *
 * @param {string} id - The user's UUID.
 * @returns {UserResponseDto} Public user fields without the password hash.
 */
```

- Include a **short** first line and a **long** paragraph (blank line between them).
- Document **every** `@param` with a **type** and a short meaning (`@param {CreateUserDto} createUserDto - ...`).
- Document `@returns` with a **type** and meaning. Use `{void}` when there is no return value. Use `Promise<...>` when the method is async.
- Add `@throws` when the function throws a Nest HTTP exception (`NotFoundException`, `ConflictException`).
- Private methods get JSDoc too.
- Keep JSDoc in sync with TypeScript; do not omit types because the signature already has them.

## 3. Explicit parameter and return types

Every function and method in application source must declare **TypeScript types on the signature**, not only in JSDoc.

```ts
create(@Body({ schema: createUserSchema }) createUserDto: CreateUserDto): Promise<UserResponseDto> {
  return this.userService.create(createUserDto);
}
```

- Annotate every parameter (`id: string`, `createUserDto: CreateUserDto`). Nest parameter decorators do not replace the type.
- Annotate the return type (`: Promise<UserResponseDto>`, `: UserResponseDto[]`, `: void`). Do not rely on inference for exported/public methods.
- Async functions return `Promise<...>`. Methods that return nothing use `: void`.
- Constructors only need parameter types (no return type).
- When creating or updating code, add any missing signature types. JSDoc types and declaration types must match.

## 4. Lint and TypeScript after changes

After adding or updating code, **run the project checks and fix failures** before considering the work done. Treat **warnings the same as errors**: do not leave oxlint or TypeScript warnings or errors for the user.

Commands (from the repo root, via `pnpm`):

| Check        | Script        | What it does                                                   |
| ------------ | ------------- | -------------------------------------------------------------- |
| Lint + types | `pnpm lint`   | `oxlint --type-aware --deny-warnings src/ test/`               |
| Compile      | `pnpm build`  | Nest/`tsc` emit; catches type errors oxlint might miss         |
| Format       | `pnpm format` | Prettier write on `src/**/*.{ts,tsx}` and `test/**/*.{ts,tsx}` |

- Always run **`pnpm lint`** after substantive edits. It must exit 0 with **no warnings**.
- Run **`pnpm build`** when signatures, modules, or `tsconfig` are involved.
- Run **`pnpm format`** if lint/format would otherwise churn, or after large edits.
- If checks fail (including warnings), fix the code (or format) and re-run until they pass. Do not suppress rules to hide warnings unless the user asks.

## 5. Incremental commits

When a task has more than one logical slice, finish one slice, run the checks that cover it, and commit it with [`.agents/skills/create-commit/SKILL.md`](.agents/skills/create-commit/SKILL.md) before starting the next slice.

- This section is the explicit ask for those commits. Do not wait for a separate "commit this" message. Do not push unless the user asks.
- A slice is one Conventional Commit: one outcome, green checks, no secrets. Split unrelated work. Leave the tree usable after each commit.
- Do not batch a multi-slice task into a single commit at the end.

## 6. Module and import style

Follow these conventions when adding or refactoring application code so reviews do not re-litigate structure:

- Prefer **`import type`** for type-only imports (`CreateUserRecord`, DTO shapes, interfaces used only as types). Keep value imports for runtime symbols (`USER_REPOSITORY`, classes, functions).
- Do **not** put free helper functions in the same module as a Nest/service/repository **class**. Extract helpers to sibling modules (for example `prisma-unique-conflict.ts` next to `prisma-user.repository.ts`).
- Feature **`*.mapper.ts`** owns all mappings for that feature (persistence → domain and domain → API DTO). Do not add a parallel persistence-only mapper unless a later decision says otherwise.
- CLI scripts and seeds that need app crypto **import** shared modules (for example `src/api/common/password.ts`); do not duplicate hashing or verification.
- Nest wrappers around vendor clients use **composition** (own a `client` / dependency field), not `extends`, unless there is a documented exception. `PrismaService` owns `PrismaClient`.
- **One interface/type per file is not required.** Port-related types may live next to the port that uses them (for example `CreateUserRecord` beside `UserRepository`).

## 7. Web UI (SSR pages and islands)

When adding or changing browser-facing pages under `src/web/`:

- Follow [docs/how-to-web-ui.md](docs/how-to-web-ui.md) for the SSR vs island vs CSS-module decision tree and anti-patterns.
- Prefer `pnpm scaffold:web-ui` or the `create-web-ui` agent skill over hand-wiring registry, loaders, and entry-server maps.
- Shell CSS lives in `src/web/styles.scss`; island styles use `*.module.scss` beside the island and are inlined as sibling `<style>` tags at SSR — do not invent a parallel delivery path.
- Icons: handpick Bootstrap Icons SVGs into `src/web/shared/icon.tsx` and render `<Icon name="…" />` from SSR components or islands — do not ship the icon webfont or paste one-off SVGs (see [docs/how-to-web-ui.md](docs/how-to-web-ui.md#icons)).

## 8. GitHub CLI and git remotes (Cursor agent shell)

The user's IDE terminal can reach GitHub freely. The **agent Shell tool defaults to Cursor's network sandbox**, which injects `HTTP_PROXY` / `HTTPS_PROXY` / `ALL_PROXY` to a local allowlist proxy. That proxy **blocks `api.github.com`** (`CONNECT` 403). Without the proxy, DNS for `api.github.com` fails in the same sandbox.

Symptoms when `gh` is run in the default sandbox (do **not** treat these as a broken login):

- `Post "https://api.github.com/graphql": Forbidden`
- `gh auth status` claims the token in `~/.config/gh/hosts.yml` is invalid
- `curl https://api.github.com/` → `CONNECT tunnel failed, response 403`

The OAuth token and `gh` install are fine: the same commands succeed once the sandbox network restriction is lifted. Git SSH through the sandbox uses a separate `GIT_SSH_COMMAND` dialer; that path is **not** what `gh pr create` / `gh pr edit` use (`gh` talks HTTPS GraphQL with the `gho_` token).

**Required:** for any agent Shell call that runs `gh` (auth status, `pr view` / `create` / `edit`, `api`, …) or that needs unrestricted GitHub HTTPS (and usually `git push` / `git fetch` to `origin` as well), request elevated permissions:

- Prefer `required_permissions: ["all"]` (disables the sandbox for that command).
- `required_permissions: ["full_network"]` is enough for HTTPS to `api.github.com` when filesystem sandboxing is not the blocker.

Do **not** work around this by asking the user to run `gh`, typing into their terminal via Computer Use, or re-running `gh auth login` unless `gh auth status` fails **outside** the sandbox (`required_permissions: ["all"]`). Keep using the normal `gh` workflow in [`.agents/skills/create-pr/SKILL.md`](.agents/skills/create-pr/SKILL.md).
