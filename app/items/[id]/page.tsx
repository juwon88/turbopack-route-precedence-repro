import { notFound } from "next/navigation";

/**
 * Dynamic sibling: /items/[id]
 *
 * Mimics the FinalPoint shape that triggered the original CI bug:
 *   1. Read the dynamic param
 *   2. Validate it (here we treat any non-numeric param as invalid;
 *      production would be a UUID-parse / DB lookup failing the same way)
 *   3. Call notFound() on validation failure
 *
 * If Turbopack correctly resolves /items/new to the STATIC sibling, this
 * file should never run for that URL. If Turbopack mis-routes /items/new
 * here (treating "new" as an id), `id === "new"` fails validation and
 * notFound() fires — producing a 404 indistinguishable from "this id
 * doesn't exist."
 */
export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Validate: numeric IDs only. Mirrors the FinalPoint trigger where the
  // dynamic route ran a UUID-parse against id="new" and got null.
  if (!/^\d+$/.test(id)) {
    notFound();
  }

  return (
    <main>
      <h1 data-testid="page-marker">ITEM DETAIL</h1>
      <p>This is the dynamic /items/[id] page for id={id}.</p>
    </main>
  );
}
