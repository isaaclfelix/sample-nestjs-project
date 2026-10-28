# Architecture

One Nest process serves two surfaces. The JSON API lives under `/api`. HTML pages live at the root. Nest owns routes and data. React owns the HTML: it server-renders the document and hydrates only the islands a page actually rendered.

This is not React Server Components, not a client-side router, and not a string template. A controller picks a page name and a plain props object. It does not import `.tsx`.

## Why this shape

The product goal for the UI is **solid performance**, not “use React everywhere.” The pages that matter next (a CRUD-heavy dashboard) should stay mostly server HTML, with interactivity only where a control needs it. Nest already routes HTTP. Putting a second router in the browser would duplicate that job and push more work onto the client for little gain.

This layout deliberately avoids these common alternatives:

| Alternative                         | Why not here                                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Full client SPA (e.g. React Router) | Nest already owns URLs. A client router would re-implement routing and ship a large JS graph by default.    |
| Separate Next.js (or similar) app   | A second deploy, CI pipeline, and host. Extra cost and ops load while the team and traffic are small.       |
| String templates only               | Server pages and interactive widgets would use different syntaxes. React trees stay one language for both.  |
| One React root for the whole page   | Non-interactive markup would still be reconciled on the client. Islands hydrate only the interactive parts. |

**Islands** are the middle path: the same component syntax on the server and in the browser, Nest keeps routing, and Vite ships **only the JS/CSS a page actually used**. Unused island chunks are never downloaded. That download-and-use-only-what-you-need rule is intentional insurance against the usual Core Web Vitals drift from unused JS and CSS—problems that are easy to overlook day to day and expensive to claw back later.

**One Nest process** (API + SSR + static assets) is a hard choice for now: one deploy pipeline, one host, one language, and the same lint/test tools—without a monorepo or parallel CI. That keeps ops and cost down while the team is small. The app can split into separate frontends later if success and headcount justify it; that should be a long way off.

## Request split

```mermaid
flowchart TD
  req[HTTP request]
  req --> path{URL}
  path -->|"/api, /api/user, /api/docs"| api[ApiModule]
  path -->|"page routes such as /"| web[WebModule]
  api --> pipe[StandardSchemaValidationPipe]
  pipe --> svc[Service]
  svc --> json[JSON or plain text]
  web --> view[WebViewService]
  view --> ssr[React renderToString]
  ssr --> html[HTML document]
```

| Surface     | Owner           | Examples                                       | Response                                               |
| ----------- | --------------- | ---------------------------------------------- | ------------------------------------------------------ |
| JSON API    | `src/api`       | `GET /api`, `POST /api/user`, `GET /api/docs`  | JSON, or the hello string                              |
| HTML pages  | `src/web`       | `GET /`                                        | `text/html`                                            |
| Dev assets  | Vite middleware | `/@vite/client`, `/src/web/client/hydrate.tsx` | Modules, only when `NODE_ENV` is not `production`      |
| Prod assets | `dist/client`   | `/assets/...`                                  | Built client files, `index: false` so `/` stays a page |

`GET /user` and `GET /docs` are not aliases. They 404. Swagger UI is `/api/docs`. The raw spec is `/api/docs-json`.

Page controllers must not claim `/api`, `/assets`, `/src`, or `/@vite`. Those prefixes belong to the API, the production client build, or the Vite dev server.

`LoggerMiddleware` runs on every route and then calls through.

## Source layout

Folder names do not create URL prefixes. `RouterModule` does.

```text
src/
  main.ts                 bootstrap
  app.module.ts           wires API, web, and the /api prefix
  logger.middleware.ts
  api/                    JSON feature code
    api.module.ts
    app.controller.ts     GET /api
    openapi.setup.ts
    common/               password hashing, Zod to OpenAPI
    user/                 users (controller, service, repository port/adapter)
  persistence/            PrismaModule / PrismaService / PrismaPg helper
  generated/prisma/       Prisma Client output (`prisma generate`; gitignored)
  web/                    HTML and React
    web.controller.ts     page routes
    web-view.service.ts
    page-loader.ts        loads the SSR entry without a static TSX import
    entry-server.tsx      page map and renderToString
    document.tsx
    pages/                server-only page components and their prop types
    islands/              island components, marker, lazy registry
    client/hydrate.tsx    browser entry
```

`tsconfig.build.json` excludes `src/web/**/*.tsx`, so `nest build` never compiles React. The views use `src/web/tsconfig.json` (extends root `tsconfig.web.json`) so the editor’s nearest-config walk finds Vite/`vite/client` types for `*.css` and DOM; TypeScript 6 does not load a root `tsconfig.web.json` by name alone. The repo-root `tsconfig.json` stays on Nest/API `.ts` sources and excludes `src/web/client/**`. `pnpm build` still runs `tsc -p tsconfig.web.json --noEmit`. Vite emits the bundles that actually run.

Prefer `.tsx` where the file is mostly a React tree (pages, islands, document, hydrate entry)—the same places you would reach for HTML. Prefer plain `.ts` for Nest controllers, services, props types, registries, and tests. Specs stay `.ts` and use `createElement` when they need elements; JSX is not required to exercise an island. Because `createElement` does not infer a generic `Island<P>` as well as JSX does, a test may pass an explicit type argument (for example `Island<{ start: number }>`) so `component` and `props` still typecheck.

## JSON API

### Routing

`AppModule` registers the prefix on the module that owns the controllers:

```ts
RouterModule.register([
  {
    path: 'api',
    module: ApiModule,
    children: [{ path: '/', module: UserModule }],
  },
]);
```

`RouterModule` sets the path on that module, not on modules it merely imports. `UserModule` is listed as a child so `@Controller('user')` becomes `/api/user`. `AppController` sits on `ApiModule`, so its `@Controller()` route is `GET /api`.

E2E boots `AppModule` and never runs `src/main.ts`. The prefix has to live in the module graph, not in `app.setGlobalPrefix`. A test that imports `UserModule` alone will not see `/api`.

`WebModule` is imported with no path, so page routes stay at the root.

### Zod and the validation pipe

`main.ts` installs `StandardSchemaValidationPipe` globally. Controllers pass the Zod schema on the parameter decorator. The pipe validates and transforms the value before the handler runs. A failure is HTTP 400.

```ts
@Body({ schema: createUserSchema }) createUserDto: CreateUserDto
@Param('id', { schema: userIdSchema }) id: string
```

Schemas are the source of the TypeScript types (`z.infer`). Current contracts:

| Schema               | Rules                                                                                                                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createUserSchema`   | Strict object: email, username, display name, password via shared `passwordSchema` (min 12 / max 128, NIST-oriented; no composition rules). Unknown keys are rejected. Usernames are trimmed, a leading `@` is stripped, then checked for length and pattern. |
| `updateUserSchema`   | Create schema without email and username, every remaining field optional, still strict, and at least one of `displayName` or `password` is required.                                                                                                          |
| `userIdSchema`       | UUID path parameter.                                                                                                                                                                                                                                          |
| `userResponseSchema` | Public user: `id`, `email`, `username`, `displayName`, `verified`. No password.                                                                                                                                                                               |

### Users, passwords, and responses

`UserService` builds domain `User` values (UUID, Argon2id hash, field-by-field from the DTO) and persists them through a **repository port** (`USER_REPOSITORY` / `UserRepository`). The Prisma adapter (`PrismaUserRepository`) is the only place that imports the generated Prisma Client. Controllers and the service never depend on Prisma types. Feature mapping lives in `user.mapper.ts`: persistence row → domain (`toDomainUser`) and domain → public DTO (`toUserResponseDto`).

Email and username uniqueness is enforced by Postgres expression unique indexes on `LOWER(email)` and `LOWER(username)` (see `prisma/migrations`). Both are case-insensitive so one mailbox maps to one account and usernames stay unique while preserving typed casing (Twitter-style). Prisma schema cannot express expression indexes, so those constraints live in SQL migrations rather than `@@unique`. Unique violations surface as Prisma `P2002` and become HTTP 409 in the adapter.

`hashPassword` uses Argon2id. The encoded string carries the algorithm, cost parameters, salt, and hash so verification can rebuild the same derivation. Cost parameters are constants in `src/api/common/password.ts` (see TD-005). The Prisma seed imports the same helper so hashing does not drift.

`toUserResponseDto` returns an allowlisted object. The password hash is not part of that object. There is no response interceptor that filters bodies at the edge yet (see TD-007).

Delete returns 204 whether or not the id existed. That is the contract, not debt.

Writes are not authenticated yet beyond CSRF (see TD-001 for session auth on PATCH/DELETE).

### Sessions and CSRF

Browser mutations use cookie sessions plus a CSRF token (Laravel-style), not client JWTs.

- **Session middleware** loads or creates a guest session from the HttpOnly `sid` cookie and attaches it to the request for HTML pages and `/api` (Vite/static asset paths are skipped).
- **CsrfGuard** (global) requires header `X-CSRF-TOKEN` to match the session token on mutating `/api` methods (`POST` / `PATCH` / `DELETE` / `PUT`). Safe methods and non-API routes pass through.
- SSR embeds `<meta name="csrf-token" content="…">` on HTML documents. There is **no** JSON CSRF mint endpoint; e2e obtains the token by loading `/register` or `/login` (same as the browser).
- Login will regenerate the session id and attach `userId` (see AuthModule). Session rows live in Postgres (`sessions`).

```mermaid
sequenceDiagram
  participant Browser
  participant Nest
  participant DB
  Browser->>Nest: GET /register
  Nest->>DB: ensure guest session
  Nest-->>Browser: HTML plus Set-Cookie sid plus meta csrf-token
  Browser->>Nest: POST /api/user with X-CSRF-TOKEN
  Nest->>DB: create user
  Nest-->>Browser: 201 UserResponseDto
  Browser->>Nest: POST /api/auth/login with X-CSRF-TOKEN
  Nest->>DB: findByEmailOrUsername verifyPassword regenerate session
  Nest-->>Browser: 200 plus Set-Cookie new sid
  Browser->>Nest: PATCH /api/user/:id with session plus CSRF
  Nest-->>Browser: 200 or 401 or 403
```

### Persistence

PostgreSQL is the system of record. **Prisma 7** owns the **database** schema (`prisma/schema.prisma` + migrations) and CLI config (`prisma.config.ts`). The app talks to Postgres through `@prisma/adapter-pg`. Zod owns the **HTTP** contracts. Domain `User` in `src/api/user/entities/user.entity.ts` is the port type between them. `PrismaService` **composes** `PrismaClient` (owns a `client` field) rather than extending it, so Nest DI wraps the vendor client instead of merging the two types. Formal Architecture Decision Records are deferred (TD-011); this section is the current decision record. Global Prisma module init always `$connect`s for the process lifetime even when a request never touches the DB (see TD-012).

`prisma generate` writes the Prisma Client to `src/generated/prisma` (gitignored; regenerated on install/build). That folder is **not** migrations — SQL history lives in `prisma/migrations/` and is applied with `prisma migrate deploy`.

```mermaid
flowchart LR
  http[Zod DTOs]
  svc[UserService]
  port[UserRepository]
  adapter[PrismaUserRepository]
  prismaSvc[PrismaService owns PrismaClient]
  db[(PostgreSQL)]
  http --> svc --> port --> adapter --> prismaSvc --> db
```

| Concern         | How                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Local manual DB | Docker Compose (`docker-compose.yml`) + GNU Make (`make db-up`, `make db-migrate`, `make db-seed`)                              |
| App connection  | `DATABASE_URL` in `.env` / `prisma.config.ts` (see `.env.example`); required for migrate/seed/runtime, not for generate alone   |
| Nest wiring     | Global `PrismaModule` / `PrismaService` (composes `PrismaClient` + PrismaPg); `UserModule` factory-binds the repository adapter |
| E2E database    | Testcontainers Postgres (not Compose); migrate deploy once per run; truncate between tests                                      |
| Client codegen  | `prisma generate` → `src/generated/prisma` on `postinstall` and at the start of `pnpm build` (works without a live DB / `.env`) |

### OpenAPI

`setupOpenApi` runs after the global pipe so the documented routes match runtime validation. `SwaggerModule.setup('api/docs', ...)` serves the UI. Nest exposes the raw document at `/api/docs-json`. The document is built on first request.

Response schemas are generated from Zod, using the output shape:

```ts
z.toJSONSchema(schema, { target: 'openapi-3.0', io: 'output' });
```

Controllers attach those objects with `@ApiOkResponse`, `@ApiCreatedResponse`, and the error decorators. `WebController` is marked `@ApiExcludeController()`, so HTML routes stay out of the spec.

Swagger is served in every environment today (see TD-006).

```mermaid
sequenceDiagram
  participant C as Client
  participant P as Validation pipe
  participant U as UserController
  participant S as UserService
  participant R as UserRepository
  participant DB as PostgreSQL
  C->>P: POST /api/user
  P->>P: createUserSchema
  alt invalid body
    P-->>C: 400
  else valid body
    P->>U: CreateUserDto
    U->>S: create
    S->>R: create
    R->>DB: insert
    alt unique index conflict
      DB-->>R: P2002
      R-->>C: 409
    else stored
      R-->>S: User
      S-->>C: 201 public user
    end
  end
```

## Web pages

### Roles

| Piece                | Responsibility                                                    |
| -------------------- | ----------------------------------------------------------------- |
| `WebController`      | Chooses the page name and builds JSON props. Sets `text/html`.    |
| `WebViewService`     | Loads the server entry and asks it to render.                     |
| `entry-server.tsx`   | Maps the page name to a React component and renders the document. |
| Page component       | Server-only body. May place islands in the tree.                  |
| `Island`             | Server-renders the component and writes the hydration marker.     |
| `client/hydrate.tsx` | Browser entry. Hydrates markers and nothing else.                 |

Props types live in `.ts` files (`home-page.props.ts`). The controller imports those types, not the component.

`loadServerEntry` builds the module specifier at runtime:

- Development: `vite.ssrLoadModule('/src/web/entry-server.tsx')`.
- Tests: a dynamic import of `entry-server.tsx` next to the loader, so Vitest transforms it.
- Production: `dist/web-server/entry-server.js`.

A static `import './entry-server.tsx'` would pull React into the Nest compile.

### Server render

Rendering is two passes of `renderToString`. Streaming SSR is not the contract.

```mermaid
sequenceDiagram
  participant W as WebController
  participant V as WebViewService
  participant E as entry-server
  participant B as Browser
  W->>V: render("home", props)
  V->>E: render(page, props, createAssets)
  E->>E: pass 1, collect island names
  E->>V: createAssets(names)
  V-->>E: script and style URLs
  E->>E: pass 2, Document plus page
  E-->>W: HTML string
  W-->>B: text/html
  opt page rendered an island
    B->>B: load hydrate entry
    B->>B: dynamic import of named islands only
    B->>B: hydrateRoot on each marker
  end
```

Pass 1 renders the page inside `IslandNamesContext`. Each `Island` adds its name to that set. Pass 2 renders `Document` around the same page. The context is null on pass 2, so the second render still emits the marker and the server HTML, and it does not change the asset list.

`createAssets([])` returns the shared stylesheet and no scripts. A page with no islands does not download the hydrate entry.

The home page keeps its sentence in one template string. Adjacent text expressions would become HTML comments, and the sentence would not match as a single string.

### Islands

An island is a client component with its own React root. The server page places it with the `Island` helper. That helper is generic over props (`Island<P>`): `component` is a `ComponentType<P>` and `props` is `P`, so each island keeps those two in sync. There is no single React “Props” type beyond that—`PropsWithChildren` and friends are helpers around a per-component shape, not a substitute for `P`.

The server marker is:

```html
<div data-island="mobile-navigation" data-props="...">
  <!-- island SSR HTML -->
</div>
```

`data-props` is `encodeURIComponent(JSON.stringify(props))`, so quotes and `<` cannot break the attribute. The decoder rejects arrays, null, and non-objects. Props must be JSON-serializable plain objects. Richer prop graphs (functions, class instances, non-JSON values) are out of scope until the dashboard needs them; CRUD pages do not.

`hydrateRoot` is called on the marker element. React hydrates the component as that element's children. The marker div is the container, not part of the component tree.

Islands do not share React context or state after hydration. Each marker is its own root (see TD-008). A shared client context layer would take real design work; the expected dashboard is CRUD-oriented and is not planning websockets or other real-time client graphs soon, so that stays deferred debt rather than part of the current contract.

### Lazy chunks

The client entry imports the registry, not the island components:

```ts
export const islandLoaders = {
  'mobile-navigation': loadMobileNavigationIsland,
} as const;

function loadMobileNavigationIsland() {
  return import('./mobile-navigation.js');
}
```

Vite emits a separate chunk per dynamic `import()`. The browser does not download that chunk until `import()` runs. A page that never renders `mobile-navigation` never requests that island’s JS chunk.

`assetTagsFromManifest` emits the hydrate entry and its static `imports` (React, for example). It does not walk `dynamicImports`, and it does not emit modulepreload links for them. Preloading those keys would fetch every island. Island CSS imported by a chunk is left on that chunk.

Vite still injects `<link rel="modulepreload">` at runtime when a dynamic `import()` runs. That helper lives in the hydrate bundle (`__vitePreload`); Nest's document shell never writes those tags. For islands already on the page that is usually a win: the chunk and its CSS start fetching just before the import resolves. It does not preload islands the page never imports.

That default should be revisited if we ship TD-010 (viewport or streaming hydration). Eager `modulepreload` for every island the entry is about to hydrate would fight delaying those downloads until near the viewport. The same applies if Core Web Vitals (or similar) start flagging excess preload. The switch is Vite's `build.modulePreload: false` on the client build in `vite.config.ts`. Leave the default on until one of those triggers.

The registry's `isIslandName` check uses `hasOwnProperty`, so a marker named `toString` is unknown. An unknown name throws before hydration.

The real product island today is `mobile-navigation` (drawer + toggle), rendered from SSR Navigation inside Layout.

`src/web/islands/` currently mixes feature islands (component + CSS module) with registry loaders and the `Island` SSR/hydrate helper. Prefer the cleaner split used by `pages/`, `shared/`, and `ssr-components/` later (see TD-019).

The `src/web/` root itself is also mixed: Nest artifacts (`web.module`, controller, `WebViewService`), Vite plugins (`vite-*`), page/asset helpers, and React shells (`document`, `entry-server`) sit beside feature folders. Group those by role when the tree gets hard to navigate (see TD-020).

### Styles

Authoring and delivery are split on purpose. There is no PurgeCSS or critical-CSS extract: unused Bootstrap leaves by **handpicking** SCSS imports; unused island CSS never ships because that island was not rendered; unused **page sibling** sheets never ship because the page did not opt in. Canonical when-to-island / when-to-module / when-to-sibling rules: [how-to-web-ui.md](./how-to-web-ui.md). Formal ADRs are still TD-011 — decisions below live here until an ADR is extracted.

CSS ships in **three lanes**:

| Lane                   | When                                             | Role                                                                       |
| ---------------------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| **Shell**              | Every HTML page                                  | Shared layout/content language                                             |
| **Page sibling sheet** | Only pages that opt in (`pageStylesheetsByPage`) | Shared Bootstrap component CSS that must not tax every page (today: forms) |
| **Island module**      | Only when that island is rendered                | Small non-Bootstrap interaction decoration; tokens-only Sass API           |

**Shell** (`src/web/styles.scss`) is the shared design-system sheet: handpicked Bootstrap Option B — config (including the utilities Sass map), `root`, `reboot`, `type`, `images`, `containers`, and `grid`, plus handpicked `_buttons.scss`. No Bootstrap forms (or other heavy component stacks) in the shell — `// @import 'bootstrap/scss/forms'` stays commented. Own Vite client input. Compilation: Sass → PostCSS (media-query sort + doiuse warn) → Lightning CSS minify at **Baseline Widely Available**. Build **reports** raw + gzip vs `SHELL_CSS_BUDGET_BYTES` (default 50 KiB). **Production** inlines the shell as `<style data-css="shell">` when **raw** size ≤ that budget (handpicked shell is under budget today); otherwise keeps a `<link>`. **Development** always `<link href="/src/web/styles.scss">` plus `/@vite/client` for HMR. Fixture tests cover both shell modes.

#### Optional page stylesheets (forms)

**Problem:** Full Bootstrap forms were audited as large, so forms stayed out of the shell. Not every page needs forms. Putting resting (or validation) form CSS on islands would violate “no island only to ship CSS.” Splitting validation onto islands looked attractive for “interaction CSS,” but measured Bootstrap `validation` is only ~1.2 KiB gzip and wiring Bootstrap into CSS modules is more complex than the download win.

**Choice:** One shared **opt-in sibling** sheet [`src/web/styles/forms.scss`](../src/web/styles/forms.scss) (Vite client input `forms`, parallel to `shell`). Pages list `'forms'` in [`pageStylesheetsByPage`](../src/web/page-stylesheets.ts); `createPageAssets` emits a head `<link>` (dev: `/src/web/styles/forms.scss`; prod: hashed file from the manifest). The sheet imports selective Bootstrap partials only:

- `forms/labels`, `forms/form-control`, `forms/form-text`, `forms/validation`

Not the full `forms` barrel (no form-check, form-select, range, floating-labels, input-group as separate imports). Measured size ~11 KiB raw / ~2 KiB gzip. Validation CSS ships **before** JS toggles those classes so the next validation UI plan needs no second stylesheet change; markup stays initial-state until then.

**Accepted unused CSS on form pages:** Bootstrap’s `form-control` and `validation` partials embed extra selectors (file/date/sizes/textarea; select/check/input-group/floating hooks) inside the same files — they are not pulled in by importing `form-select` / `form-check`. We accept that waste at current size rather than forking partials like `_buttons.scss` or building per-page form subsets. Login and register share one sheet because they share the same resting vocabulary.

**Rule:** Small shared Bootstrap form partials (including validation) belong on opt-in siblings, **not** islands. Islands exist for interactivity; island modules may use tokens + tiny non-Bootstrap rules only. Do **not** re-import CSS-emitting Bootstrap form partials into `*.module.scss` (TD-016 still applies to islands).

**Revisit:** [TD-021](./known-tech-debt.md) — sibling raw size ≳16 KiB, clear per-page divergence (>3 KiB gzip unused relative to another form page), or a buttons-style allowlist becomes worth maintaining.

**Islands — authoring:** Import a CSS module beside the interactive component (`*.module.scss` preferred). That puts CSS on the island’s Vite graph and supplies hashed classes. Use `styles/_tokens.scss` for Sass API only. Do **not** re-import the shell or Bootstrap CSS-emitting partials (TD-016).

**Islands — delivery (unconventional):** The import stays on the component; the framework does **not** leave CSS only on the JS chunk. After SSR pass 1 collects island names, `createPageAssets` loads CSS text (prod: manifest `css` files; dev: Vite transform of `cssModulePath`). Pass 2 provides a framework-owned context; `Island` emits a sibling `<style data-css-island="{name}">` above the marker (once per name per page). Hydrate loads **JS only** — production keeps `__vite__mapDeps` indices intact but filters `.css` URLs out of preload results (removing array entries would leave `modulepreload` hrefs as `/undefined`); development rewrites Vite’s `updateStyle` so HMR updates the sibling tag instead of injecting a second `<style data-vite-dev-id>` in `<head>`.

```html
<style data-css-island="mobile-navigation">
  /* hashed module rules */
</style>
<div data-island="mobile-navigation" data-props="…">…</div>
```

**Icons:** Handpicked [Bootstrap Icons](https://icons.getbootstrap.com/) SVGs live in [`src/web/shared/icon.tsx`](../src/web/shared/icon.tsx). Import `<Icon name="…" />` from SSR components or islands; add a glyph to that file when a new icon is needed. No icon font package. Authoring steps: [how-to-web-ui.md](./how-to-web-ui.md#icons).

**Goals:** download-and-use-only-what-you-need (no head dump of every island or sibling sheet); no FOUC for SSR islands; no double delivery; shell stays the always-on look; siblings carry opt-in design-system components; islands are not a backdoor design system or CSS CDN.

**Rejected:** head `<link>` per island; CSS only after chunk load; island-only-for-styling; SSR-only CSS modules; Tailwind-style utility sprawl; shipping Bootstrap forms (or other heavy component SCSS/JS) in the shell; shipping the full Bootstrap Icons webfont; Bootstrap form partials inside island CSS modules.

Hydrating every island as soon as the entry loads (including below the fold) is still TD-010 for **JS**; CSS for used islands is already in the HTML.

### Development and production

|                                          | Development                                                                                                                                                                                                                                                                     | Production                                                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| How it starts                            | `pnpm start` / `start:dev`                                                                                                                                                                                                                                                      | `NODE_ENV=production` via `pnpm start:prod`                                                                                                               |
| SSR                                      | Vite middleware mode, `ssrLoadModule`                                                                                                                                                                                                                                           | `dist/web-server/entry-server.js`                                                                                                                         |
| Client scripts when an island is present | `/@id/@vitejs/plugin-react/preamble`, `/@vite/client`, `/src/web/client/hydrate.tsx`                                                                                                                                                                                            | Manifest entry and its static imports, under `/`                                                                                                          |
| Styles                                   | Shell `<link href="/src/web/styles.scss">` plus `/@vite/client`. Opt-in siblings (e.g. forms) as extra `<link>`s when the page opts in. Island CSS inlined as sibling `<style>`; Vite client inject is rewritten to update that sibling (no `data-vite-dev-id` head duplicate). | Shell `<style>` or `<link>` by raw-size budget. Opt-in siblings as `<link>`s. Island CSS inlined as sibling `<style>`; hydrate mapDeps has no island CSS. |
| Static files                             | Vite serves source                                                                                                                                                                                                                                                              | `express.static` on `dist/client`, with `index: false`                                                                                                    |

The React refresh preamble is required in development because this app writes its own HTML. Vite would inject that preamble into an `index.html`; it does not see ours. Without `window.$RefreshReg$`, an island module throws before `hydrateRoot` runs. Production builds do not include the refresh runtime.

`pnpm build` runs four steps: `nest build`, `tsc -p tsconfig.web.json --noEmit`, `vite build` (client manifest and chunks), and `vite build --ssr` (the Node render bundle). `emptyOutDir` is false on both Vite builds so they can share `dist/`.

```mermaid
flowchart LR
  subgraph compile [pnpm build]
    nest[nest build]
    check[tsc web noEmit]
    client[vite build]
    ssr[vite build --ssr]
  end
  nest --> apiOut["dist/ main and API"]
  client --> clientOut["dist/client manifest and chunks"]
  ssr --> ssrOut["dist/web-server/entry-server.js"]
```

## Adding a page or island

Follow [how-to-web-ui.md](./how-to-web-ui.md) (decision tree, anti-patterns, scaffold). Short wiring checklist:

**Page:** props type → page component → `entry-server` map → `WebController` → stay off `/api` and asset prefixes → `@ApiExcludeController()`.

**Island:** interactive component → optional `*.module.scss` → `islandRegistry` / `islandLoaders` (+ `cssModulePath`) → `<Island>` on a page. Do not statically import islands into `hydrate.tsx`. Scaffold: `pnpm scaffold:web-ui` or the `create-web-ui` agent skill.

## Related docs

- [How to add web UI](./how-to-web-ui.md) — SSR vs island vs module styles; handpicked icons; anti-patterns; scaffold.

- [Testing and coverage](./testing-and-coverage.md) — `.tsx` is outside unit coverage; HTTP behavior is covered by e2e.
- [Known tech debt](./known-tech-debt.md) — TD-001 and TD-005 through TD-010 (TD-009 closed) are the open limits of this design. Shared island client state is TD-008. Below-the-fold islands still hydrate with the entry (TD-010). JSON-only island props and no shared client context are current limits of the same web layer, deferred until the dashboard needs more than CRUD.
