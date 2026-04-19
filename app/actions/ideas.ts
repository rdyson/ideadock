"use server";

import { redirect } from "next/navigation";
import { Prisma, ResearchCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { anthropic, RESEARCH_MODEL } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";

const RESEARCH_PROMPT = `You are a startup market research analyst. Score the idea on a transparent rubric: five categories, each 0-20, total readiness is their sum (0-100).

Rubric (what a 20 looks like in each):
- MARKET_SIZE (0-20): large, growing, reachable TAM with clear willingness-to-pay
- COMPETITORS (0-20): differentiated positioning; incumbents leave a real opening
- TRENDS (0-20): strong tailwinds (regulatory, technological, behavioral) over the next 2-3 years
- CUSTOMER_SEGMENTS (0-20): well-defined segment with acute pain and identifiable acquisition channel
- RISKS (0-20): manageable execution, regulatory, and capital risk; higher score = lower risk

Return ONLY valid JSON with no preamble or markdown fences. The "title" must be a concise, descriptive headline for the idea, under 80 characters, with no trailing punctuation. The "summary" for each section must begin with one sentence of scoring rationale, then 1-2 sentences of analysis.
{
  "title": "<concise title under 80 chars>",
  "sections": [
    { "category": "MARKET_SIZE", "score": <integer 0-20>, "summary": "<2-3 sentences, first sentence = score rationale>", "sources": [] },
    { "category": "COMPETITORS", "score": <integer 0-20>, "summary": "<...>", "sources": [] },
    { "category": "TRENDS", "score": <integer 0-20>, "summary": "<...>", "sources": [] },
    { "category": "CUSTOMER_SEGMENTS", "score": <integer 0-20>, "summary": "<...>", "sources": [] },
    { "category": "RISKS", "score": <integer 0-20>, "summary": "<...>", "sources": [] }
  ]
}
Idea: {rawText}`;

type ResearchResponse = {
  title?: string;
  sections: Array<{
    category: ResearchCategory;
    score: number;
    summary: string;
    sources: Prisma.InputJsonValue;
  }>;
};

const TITLE_MAX = 80;
const PLACEHOLDER_TITLE_MAX = 120;

function placeholderTitle(rawText: string): string {
  return rawText.slice(0, PLACEHOLDER_TITLE_MAX);
}

function cleanClaudeTitle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, TITLE_MAX);
}

function clampScore(n: unknown): number {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : 0;
  return Math.max(0, Math.min(20, v));
}

export async function createIdea(rawText: string): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const trimmed = rawText.trim();
  const title = placeholderTitle(trimmed);

  const idea = await prisma.idea.create({
    data: {
      userId: user.id,
      title,
      rawText,
      status: "PENDING",
    },
  });

  void triggerResearch(idea.id);

  return idea.id;
}

async function requireUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user.id;
}

async function assertIdeaOwner(ideaId: string, userId: string): Promise<void> {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    select: { userId: true },
  });
  if (!idea || idea.userId !== userId) {
    throw new Error("Idea not found");
  }
}

export async function updateIdea(
  ideaId: string,
  rawText: string,
): Promise<void> {
  const userId = await requireUserId();
  await assertIdeaOwner(ideaId, userId);

  const trimmed = rawText.trim();
  if (trimmed.length < 3) {
    throw new Error("Idea is too short");
  }
  const title = placeholderTitle(trimmed);

  await prisma.idea.update({
    where: { id: ideaId },
    data: { rawText: trimmed, title },
  });
}

export async function deleteIdea(ideaId: string): Promise<void> {
  const userId = await requireUserId();
  await assertIdeaOwner(ideaId, userId);

  await prisma.idea.delete({ where: { id: ideaId } });
  redirect("/ideas");
}

export async function rerunResearch(ideaId: string): Promise<void> {
  const userId = await requireUserId();
  await assertIdeaOwner(ideaId, userId);

  await prisma.$transaction([
    prisma.researchSection.deleteMany({ where: { ideaId } }),
    prisma.idea.update({
      where: { id: ideaId },
      data: { status: "PENDING", readinessScore: 0 },
    }),
  ]);

  void triggerResearch(ideaId);
}

export async function triggerResearch(ideaId: string): Promise<void> {
  try {
    const idea = await prisma.idea.update({
      where: { id: ideaId },
      data: { status: "RESEARCHING" },
    });

    const message = await anthropic.messages.create({
      model: RESEARCH_MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: RESEARCH_PROMPT.replace("{rawText}", idea.rawText),
        },
      ],
    });

    const textBlock = message.content.find(
      (b: (typeof message.content)[number]) => b.type === "text",
    );
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text block in Claude response");
    }

    const parsed = JSON.parse(textBlock.text) as ResearchResponse;

    const scoredSections = parsed.sections.map((s) => ({
      ideaId,
      category: s.category,
      score: clampScore(s.score),
      summary: s.summary,
      sources: s.sources ?? [],
    }));
    const readinessScore = scoredSections.reduce((acc, s) => acc + s.score, 0);
    const generatedTitle = cleanClaudeTitle(parsed.title);

    await prisma.$transaction([
      prisma.researchSection.createMany({ data: scoredSections }),
      prisma.idea.update({
        where: { id: ideaId },
        data: {
          status: "READY",
          readinessScore,
          ...(generatedTitle ? { title: generatedTitle } : {}),
        },
      }),
    ]);
  } catch (err) {
    console.error("[triggerResearch] failed", ideaId, err);
    await prisma.idea
      .update({ where: { id: ideaId }, data: { status: "ERROR" } })
      .catch((updateErr) => {
        console.error(
          "[triggerResearch] failed to mark ERROR",
          ideaId,
          updateErr,
        );
      });
  }
}
