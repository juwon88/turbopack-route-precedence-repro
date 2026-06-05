# Turbopack route-precedence repro

Minimal reproduction for a cold-compile route-precedence race in Next.js
16.2.6's Turbopack dev server, observed in CI but not locally on a fast
Mac.

## The bug

Two sibling routes:

```
app/items/new/page.tsx      — static (the correct match for /items/new)
app/items/[id]/page.tsx     — dynamic, notFound() on non-numeric id
```

GET `/items/new` should render the static page. Under CI's resource
profile (GitHub Actions `ubuntu-latest`), Turbopack appears to mis-route
the request to `[id]/page.tsx` with `id="new"`, the validation fails,
`notFound()` fires, and the response is a 404.

The bug does **not** reproduce locally on a fast Mac, even under a
10-way concurrent cold-compile burst. The GitHub Actions workflow in
this repo runs the same Playwright spec under the slower CI resource
profile to demonstrate.

## What's in this repo

- `app/items/new/page.tsx` + `app/items/[id]/page.tsx` — the sibling pair
- `tests/route-precedence.spec.ts` — Playwright spec asserting the
  correct routing
- `.github/workflows/test.yml` — runs the spec on `ubuntu-latest` with
  Next 16.2.6 + Turbopack default

## How to run locally

```bash
npm install
npx playwright install --with-deps chromium
npm test
```

The local run almost certainly passes. The CI run is where the bug
surfaces.

## Background

Originally observed in a private codebase across multiple PRs (CI runs
returned persistent 404s on a route equivalent to `/items/new`). The
defensive workaround added in the affected app — detect `id === "new"`
at the top of the dynamic page and redirect to the static sibling — did
not fully close the race; the fixmes on the affected SSR tests stayed
in place. This minimal repro isolates the trigger.
