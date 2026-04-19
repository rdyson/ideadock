import Link from "next/link";
import { notFound } from "next/navigation";
import { ResearchCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getScoreColor } from "@/lib/scoreColor";
import { createClient } from "@/lib/supabase/server";
import AutoRefresh from "./AutoRefresh";
import DeleteButton from "./DeleteButton";
import RerunButton from "./RerunButton";

const CATEGORY_LABEL: Record<ResearchCategory, string> = {
  MARKET_SIZE: "Market Size",
  COMPETITORS: "Competitors",
  TRENDS: "Trends",
  CUSTOMER_SEGMENTS: "Customer Segments",
  RISKS: "Risks",
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  RESEARCHING: "bg-amber-100 text-amber-800",
  READY: "bg-green-100 text-green-800",
  ERROR: "bg-red-100 text-red-800",
};

export default async function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const idea = await prisma.idea.findUnique({
    where: { id },
    include: { sections: { orderBy: { createdAt: "asc" } } },
  });

  if (!idea || idea.userId !== user.id) {
    notFound();
  }

  const isInFlight = idea.status === "PENDING" || idea.status === "RESEARCHING";

  return (
    <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {isInFlight && <AutoRefresh />}

      <Link
        href="/ideas"
        className="inline-flex items-center gap-1 text-sm text-black/60 dark:text-white/60 hover:text-foreground transition-colors mb-4"
      >
        <span aria-hidden>←</span>
        <span>Back to Ideas</span>
      </Link>

      <div className="flex items-start justify-between gap-4 mb-3">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{idea.title}</h1>
        <span className={`text-xs font-medium px-2 py-1 rounded ${STATUS_BADGE[idea.status]}`}>
          {idea.status}
        </span>
      </div>

      <details className="mb-6 group">
        <summary className="cursor-pointer text-sm text-black/60 dark:text-white/60 hover:text-foreground transition-colors select-none list-none inline-flex items-center gap-1">
          <span aria-hidden className="transition-transform group-open:rotate-90">
            ›
          </span>
          <span className="group-open:hidden">Show original idea</span>
          <span className="hidden group-open:inline">Hide original idea</span>
        </summary>
        <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-black/70 dark:text-white/70">
          {idea.rawText}
        </p>
      </details>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Link
          href={`/ideas/${idea.id}/edit`}
          className="rounded-md border border-black/15 dark:border-white/20 px-3 py-1.5 text-sm font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06] transition-colors"
        >
          Edit
        </Link>
        {!isInFlight && <RerunButton ideaId={idea.id} />}
        <DeleteButton ideaId={idea.id} />
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-1 text-sm">
          <span>Readiness</span>
          <span className="tabular-nums">{idea.readinessScore}/100</span>
        </div>
        <div className="h-2 w-full rounded bg-black/10 dark:bg-white/10 overflow-hidden">
          <div
            className={`h-full transition-all ${getScoreColor(idea.readinessScore, 100, "bar")}`}
            style={{ width: `${idea.readinessScore}%` }}
          />
        </div>
      </div>

      {idea.status === "READY" && (
        <div className="grid gap-4">
          {idea.sections.map((s) => (
            <div
              key={s.id}
              className={`border border-black/10 dark:border-white/15 border-l-4 rounded-lg p-4 ${getScoreColor(s.score, 20, "border")} ${getScoreColor(s.score, 20, "tint")}`}
            >
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <h2 className="text-sm font-semibold">{CATEGORY_LABEL[s.category]}</h2>
                <span className="text-xs tabular-nums text-black/60 dark:text-white/60">
                  {s.score}/20
                </span>
              </div>
              <div className="h-1.5 w-full rounded bg-black/10 dark:bg-white/10 overflow-hidden mb-3">
                <div
                  className={`h-full transition-all ${getScoreColor(s.score, 20, "bar")}`}
                  style={{ width: `${(s.score / 20) * 100}%` }}
                />
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{s.summary}</p>
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
          <p className="text-sm">
            Research failed. Use “Rerun Research” above to try again, or edit the idea and rerun.
          </p>
        </div>
      )}
    </main>
  );
}
