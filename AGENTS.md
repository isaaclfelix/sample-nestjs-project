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
