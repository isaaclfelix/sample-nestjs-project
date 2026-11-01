# Install

How to depend on Archipielago packages today, and what a future public release
will look like.

## In this monorepo (Phase 2)

Packages are **workspace-only** (`private: true`, version `0.0.0`). From a
workspace consumer (for example `examples/nestjs`):

```json
{
  "dependencies": {
    "@archipielago/core": "workspace:*",
    "@archipielago/react": "workspace:*",
    "@archipielago/vite": "workspace:*",
    "@archipielago/nestjs": "workspace:*"
  }
}
```

Root `pnpm install` links them. Node packages (`core`, `vite`, `nestjs`) emit
`dist/` on `postinstall` / `pnpm build`. `@archipielago/react` exports **source**
for Vite.

### Which packages a host typically needs

| Package                | When                                                       |
| ---------------------- | ---------------------------------------------------------- |
| `@archipielago/core`   | Always (contracts, islands, paths, config)                 |
| `@archipielago/react`  | Always (SSR + hydrate runtime)                             |
| `@archipielago/vite`   | Always (dev/prod assets + plugins in the host Vite config) |
| `@archipielago/nestjs` | NestJS hosts only                                          |

Peers (install in the host): `react`, `react-dom`, and for Nest:
`@nestjs/common`, `@nestjs/core`. Vite is a peer of `@archipielago/vite`.

## Future public install (`0.0.1`)

Publishing is a separate roadmap milestone (prefer after Phase 3 second-host
proof). When packages are on the registry, the intended install is:

```bash
pnpm add @archipielago/core @archipielago/react @archipielago/vite
# Nest hosts also:
pnpm add @archipielago/nestjs
```

Until then, treat workspace packages as the source of truth. Package `exports`,
`files`, and peers are already shaped so that cutover stays mechanical—do not
reintroduce reverse imports from packages into `examples/*`.

See [wiring.md](./wiring.md) next, then [nestjs.md](./nestjs.md) for the Nest
worked example.
