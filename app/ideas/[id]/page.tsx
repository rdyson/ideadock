import { notFound } from "next/navigation";
import { ResearchCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import AutoRefresh from "./AutoRefresh";
import RetryButton from "./RetryButton";

const CATEGORY_LABEL: Record<ResearchCategory, string> = {
  MARKET_SIZE: "Market Size",
  COMPETITORS: "Competitors",
  TRENDS: "Trends",
  CUSTOMER_SEGMENTS: "Customer Segments",
  RISKS: "Risks",
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-slate-200 text-slate-800",
  RESEARCHING: "bg-blue-200 text-blue-800",
  READY: "bg-green-200 text-green-800",
  ERROR: "bg-red-200 text-red-800",
};

export default async function IdeaPage({
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
    include: { sections: { orderBy: { createdAt: "asc" } } },
  });

  if (!idea || idea.userId !== user.id) {
    notFound();
  }

  const isInFlight =
    idea.status === "PENDING" || idea.status === "RESEARCHING";

  return (
    <main className="max-w-3xl mx-auto p-6 sm:p-10">
      {isInFlight && <AutoRefresh />}

      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold">{idea.title}</h1>
        <span
          className={`text-xs font-medium px-2 py-1 rounded ${STATUS_BADGE[idea.status]}`}
        >
          {idea.status}
        </span>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-1 text-sm">
          <span>Readiness</span>
          <span>{idea.readinessScore}/100</span>
        </div>
        <div className="h-2 w-full rounded bg-black/10 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full bg-foreground transition-all"
            style={{ width: `${idea.readinessScore}%` }}
          />
        </div>
      </div>

      {idea.status === "READY" && (
        <div className="grid gap-4">
          {idea.sections.map((s) => (
            <div
              key={s.id}
              className="border border-black/10 dark:border-white/15 rounded-lg p-4"
            >
              <h2 className="text-sm font-semibold mb-2">
                {CATEGORY_LABEL[s.category]}
              </h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {s.summary}
              </p>
            </div>
          ))}
        </div>
      )}

      {isInFlight && (
        <div className="flex items-center gap-3 text-sm text-black/60 dark:text-white/60">
          <span
            aria-hidden
            className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
          />
          <span>Researching…</span>
        </div>
      )}

      {idea.status === "ERROR" && (
        <div className="border border-red-500/40 rounded-lg p-4">
          <p className="text-sm mb-3">Research failed.</p>
          <RetryButton ideaId={idea.id} />
        </div>
      )}
    </main>
  );
}
