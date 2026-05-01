import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STUCK_AFTER_MS = 5 * 60 * 1000;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const cutoff = new Date(Date.now() - STUCK_AFTER_MS);
  const result = await prisma.idea.updateMany({
    where: { status: "RESEARCHING", updatedAt: { lt: cutoff } },
    data: { status: "ERROR" },
  });

  return NextResponse.json({ markedError: result.count, cutoff: cutoff.toISOString() });
}
