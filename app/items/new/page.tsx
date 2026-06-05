/**
 * Static sibling: /items/new
 *
 * This is the route the user expects to render when they hit
 * /items/new. The dynamic sibling at app/items/[id]/page.tsx is the
 * fall-through for actual item IDs.
 */
export default function NewItemPage() {
  return (
    <main>
      <h1 data-testid="page-marker">NEW ITEM FORM</h1>
      <p>This is the static /items/new page — the one /items/new should render.</p>
    </main>
  );
}
