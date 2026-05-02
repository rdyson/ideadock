"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { triggerResearch } from "@/lib/research";
import { enforceLimit } from "@/lib/ratelimit";

const PLACEHOLDER_TITLE_MAX = 120;

function placeholderTitle(rawText: string): string {
  const firstLine = rawText.split(/\r?\n/, 1)[0].trim();
  return firstLine.slice(0, PLACEHOLDER_TITLE_MAX);
}

export async function createIdea(rawText: string): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  await enforceLimit("ideaCreate", user.id);

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

  after(() => triggerResearch(idea.id));

  return idea.id;
}

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
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

export async function updateIdea(ideaId: string, rawText: string): Promise<void> {
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

  redirect(`/ideas/${ideaId}`);
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
  await enforceLimit("researchRerun", userId);

  await prisma.$transaction([
    prisma.researchSection.deleteMany({ where: { ideaId } }),
    prisma.idea.update({
      where: { id: ideaId },
      data: { status: "PENDING", readinessScore: 0 },
    }),
  ]);

  after(() => triggerResearch(ideaId));
}
