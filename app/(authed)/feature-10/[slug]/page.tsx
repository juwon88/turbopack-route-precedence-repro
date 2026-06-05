import { notFound } from "next/navigation";

export default async function Feature10Detail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) notFound();
  return <main>Feature 10 / {slug}</main>;
}
