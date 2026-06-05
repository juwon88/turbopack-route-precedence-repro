import { notFound } from "next/navigation";

export default async function Feature5Detail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) notFound();
  return <main>Feature 5 / {slug}</main>;
}
