import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import EditIdeaForm from "./EditIdeaForm";

export default async function EditIdeaPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const idea = await prisma.idea.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true, rawText: true, title: true },
  });

  if (!idea || idea.userId !== user.id) {
    notFound();
  }

  return (
    <main className="w-full max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Link
        href={`/ideas/${idea.id}`}
        className="inline-flex items-center gap-1 text-sm text-black/60 dark:text-white/60 hover:text-foreground transition-colors mb-4"
      >
        <span aria-hidden>←</span>
        <span>Back to idea</span>
      </Link>
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-6">
        Edit idea
      </h1>
      <EditIdeaForm ideaId={idea.id} initialText={idea.rawText} />
      <p className="text-xs text-black/60 dark:text-white/60 mt-4">
        After saving, use “Rerun Research” on the idea page to refresh the
        research based on your edits.
      </p>
    </main>
  );
}
