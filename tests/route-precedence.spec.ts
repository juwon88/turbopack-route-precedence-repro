import { test, expect } from "@playwright/test";

/**
 * Reproduces the Turbopack cold-compile route-precedence race observed
 * in CI but not locally on a fast Mac.
 *
 * The route layout:
 *   app/items/new/page.tsx          — static sibling (the correct match)
 *   app/items/[id]/page.tsx         — dynamic sibling, notFound() on
 *                                     non-numeric id
 *
 * Expected: GET /items/new returns 200 and the static page's marker.
 * Bug:       GET /items/new is mis-routed to [id]/page.tsx with id="new",
 *            non-numeric check fails, notFound() fires → 404.
 */
test("GET /items/new resolves to the static sibling, not the dynamic [id] page", async ({
  page,
}) => {
  const response = await page.goto("/items/new");
  expect(response).not.toBeNull();
  expect(
    response!.status(),
    "expected 200 from /items/new/page.tsx (static), got " + response!.status() +
      " — Turbopack likely mis-routed to /items/[id]/page.tsx",
  ).toBe(200);

  const html = await response!.text();
  expect(
    html,
    "expected the static page's marker; if this fails Turbopack may have " +
      "served the dynamic page instead",
  ).toContain("NEW ITEM FORM");
});

/**
 * Sanity check: the dynamic sibling responds correctly to a valid id.
 * If this fails, the test infrastructure is broken — not the routing
 * bug we care about.
 */
test("GET /items/123 (valid numeric id) renders the dynamic page", async ({
  page,
}) => {
  const response = await page.goto("/items/123");
  expect(response!.status()).toBe(200);
  const html = await response!.text();
  expect(html).toContain("ITEM DETAIL");
});

/**
 * Concurrent burst — fires N parallel cold-compile requests at
 * /items/new. The FinalPoint investigation suggested CI's slower
 * compile + concurrent first-hit pattern is what surfaces the race;
 * this reproduces that load profile.
 */
test("concurrent burst on /items/new — every hit returns 200", async ({
  browser,
}) => {
  const CONCURRENCY = 10;
  const contexts = await Promise.all(
    Array.from({ length: CONCURRENCY }, () => browser.newContext()),
  );
  try {
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
