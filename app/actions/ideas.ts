"use server";

import { Prisma, ResearchCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { anthropic, RESEARCH_MODEL } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";

const RESEARCH_PROMPT = `You are a startup market research analyst. Given a raw idea, return ONLY valid JSON with no preamble or markdown fences:
{
  "readinessScore": <integer 0-100>,
  "sections": [
    { "category": "MARKET_SIZE", "summary": "<2-3 sentences>", "sources": [] },
    { "category": "COMPETITORS", "summary": "<2-3 sentences>", "sources": [] },
    { "category": "TRENDS", "summary": "<2-3 sentences>", "sources": [] },
    { "category": "CUSTOMER_SEGMENTS", "summary": "<2-3 sentences>", "sources": [] },
    { "category": "RISKS", "summary": "<2-3 sentences>", "sources": [] }
  ]
}
Idea: {rawText}`;

type ResearchResponse = {
  readinessScore: number;
  sections: Array<{
    category: ResearchCategory;
    summary: string;
    sources: Prisma.InputJsonValue;
  }>;
};

export async function createIdea(rawText: string): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const trimmed = rawText.trim();
  const title = trimmed.slice(0, 60);

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

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text block in Claude response");
    }

    const parsed = JSON.parse(textBlock.text) as ResearchResponse;

    await prisma.$transaction([
      prisma.researchSection.createMany({
        data: parsed.sections.map((s) => ({
          ideaId,
          category: s.category,
          summary: s.summary,
          sources: s.sources ?? [],
        })),
      }),
      prisma.idea.update({
        where: { id: ideaId },
        data: {
          status: "READY",
          readinessScore: parsed.readinessScore,
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
