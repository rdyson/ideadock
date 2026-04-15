import Link from "next/link";
import { redirect } from "next/navigation";
import { IdeaStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const STATUS_STYLES: Record<IdeaStatus, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  RESEARCHING: "bg-blue-100 text-blue-700",
  READY: "bg-green-100 text-green-700",
  ERROR: "bg-red-100 text-red-700",
};

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

export default async function IdeasPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const ideas = await prisma.idea.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      readinessScore: true,
      createdAt: true,
    },
  });

  return (
    <main className="min-h-screen p-6 sm:p-10 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Ideas</h1>
        <Link
          href="/ideas/new"
          className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + New Idea
        </Link>
      </header>

      {ideas.length === 0 ? (
        <div className="border border-dashed border-black/[.15] dark:border-white/[.2] rounded-lg p-10 text-center">
          <p className="text-lg font-medium mb-2">No ideas yet</p>
          <p className="text-sm text-black/60 dark:text-white/60 mb-4">
            Capture your first idea to get started.
          </p>
          <Link
            href="/ideas/new"
            className="inline-block rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + New Idea
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-black/[.08] dark:divide-white/[.12] border border-black/[.08] dark:border-white/[.12] rounded-lg overflow-hidden">
          {ideas.map((idea) => (
            <li key={idea.id}>
              <Link
                href={`/ideas/${idea.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-black/[.03] dark:hover:bg-white/[.04] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{idea.title}</p>
                  <p className="text-xs text-black/60 dark:text-white/60 mt-0.5">
                    {idea.createdAt.toLocaleDateString("en-US", DATE_FORMAT)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm tabular-nums text-black/70 dark:text-white/70">
                    {idea.readinessScore}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[idea.status]}`}
                  >
                    {idea.status}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
