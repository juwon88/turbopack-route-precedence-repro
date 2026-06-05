import { test, expect, BrowserContext } from "@playwright/test";

/**
 * Reproduces the Turbopack cold-compile route-precedence race observed
 * in the source codebase's CI but not locally on a fast Mac.
 *
 * The route layout under the (authed) route group:
 *   app/(authed)/items/new/page.tsx        — static sibling (the correct match)
 *   app/(authed)/items/[id]/page.tsx       — dynamic sibling, notFound() on non-numeric id
 *
 * Plus middleware at src/proxy.ts that gates every /items request
 * behind an `authed=1` cookie, and 10 unrelated sibling features
 * (/feature-{1..10}/) to give Turbopack's compile graph a comparable
 * footprint to the source codebase.
 *
 * Each test sets the `authed=1` cookie on its own context so the
 * proxy lets the request through to the page resolver.
 */

async function withAuth(context: BrowserContext) {
  await context.addCookies([
    {
      name: "authed",
      value: "1",
      url: "http://127.0.0.1:3100",
    },
  ]);
}

test("GET /items/new resolves to the static sibling, not the dynamic [id] page", async ({
  page,
  context,
}) => {
  await withAuth(context);
  const response = await page.goto("/items/new");
  expect(response).not.toBeNull();
  expect(
    response!.status(),
    "expected 200 from /items/new/page.tsx (static), got " +
      response!.status() +
      " — Turbopack likely mis-routed to /items/[id]/page.tsx",
  ).toBe(200);

  const html = await response!.text();
  expect(
    html,
    "expected the static page's marker; if this fails Turbopack may have " +
      "served the dynamic page instead",
  ).toContain("NEW ITEM FORM");
});

test("GET /items/123 (valid numeric id) renders the dynamic page", async ({
  page,
  context,
}) => {
  await withAuth(context);
  const response = await page.goto("/items/123");
  expect(response!.status()).toBe(200);
  const html = await response!.text();
  expect(html).toContain("ITEM DETAIL");
});

test("concurrent burst on /items/new — every hit returns 200", async ({
  browser,
}) => {
  const CONCURRENCY = 10;
  const contexts = await Promise.all(
    Array.from({ length: CONCURRENCY }, () => browser.newContext()),
  );
  try {
    await Promise.all(contexts.map((ctx) => withAuth(ctx)));
    const results = await Promise.all(
      contexts.map(async (ctx) => {
        const p = await ctx.newPage();
        const r = await p.goto("/items/new");
        return r!.status();
      }),
    );
    const bad = results.filter((s) => s !== 200);
    expect(
      bad,
      `${bad.length}/${CONCURRENCY} requests returned non-200 ` +
        `(statuses: ${results.join(",")})`,
    ).toEqual([]);
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});

/**
 * Adds compile-graph load before the route-precedence test fires.
 * Visits each of the 10 unrelated features in series so Turbopack has
 * compiled a comparable subgraph before /items/new is hit. Mirrors how
 * the source codebase's earlier specs warm Turbopack's state before
 * the failing /sessions/new spec runs.
 */
test("warm-then-probe: visit 10 features then /items/new", async ({
  page,
  context,
}) => {
  await withAuth(context);
  for (let i = 1; i <= 10; i++) {
    await page.goto(`/feature-${i}`);
    await page.goto(`/feature-${i}/sub-${i}`);
  }
  const response = await page.goto("/items/new");
  expect(response!.status()).toBe(200);
  const html = await response!.text();
  expect(html).toContain("NEW ITEM FORM");
});
