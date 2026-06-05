import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Mirror of the real codebase's `(app)` route group layout. Reads
 * cookies server-side, gates the children behind an "authed" cookie,
 * and includes a non-trivial render tree so the layout chunk is
 * comparable in compile weight to a real app layout.
 */
export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const authed = cookieStore.get("authed")?.value === "1";
  if (!authed) {
    redirect("/sign-in");
  }

  return (
    <div className="authed-shell">
      <header className="authed-header">
        <a href="/items/new">New item</a>
        <a href="/items/1">Item 1</a>
        <a href="/items/2">Item 2</a>
      </header>
      <main className="authed-main">{children}</main>
      <footer className="authed-footer">
        <span>Footer placeholder</span>
      </footer>
    </div>
  );
}
