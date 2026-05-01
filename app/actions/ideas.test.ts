import { describe, it, expect, vi, beforeEach } from "vitest";

const getUserMock = vi.fn();
const createIdeaMock = vi.fn();
const updateIdeaMock = vi.fn();
const findUniqueIdeaMock = vi.fn();
const createManyMock = vi.fn();
const transactionMock = vi.fn();
const anthropicCreateMock = vi.fn();

vi.mock("next/server", () => ({
  after: (fn: () => unknown) => {
    void fn();
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: getUserMock },
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    idea: {
      create: (...args: unknown[]) => createIdeaMock(...args),
      update: (...args: unknown[]) => updateIdeaMock(...args),
      findUnique: (...args: unknown[]) => findUniqueIdeaMock(...args),
    },
    researchSection: {
      createMany: (...args: unknown[]) => createManyMock(...args),
    },
    $transaction: (...args: unknown[]) => transactionMock(...args),
  },
}));

vi.mock("@/lib/anthropic", () => ({
  anthropic: {
    messages: { create: (...args: unknown[]) => anthropicCreateMock(...args) },
  },
  RESEARCH_MODEL: "test-model",
}));

vi.mock("@prisma/client", () => ({
  ResearchCategory: {
    MARKET_SIZE: "MARKET_SIZE",
    COMPETITORS: "COMPETITORS",
    TRENDS: "TRENDS",
    CUSTOMER_SEGMENTS: "CUSTOMER_SEGMENTS",
    RISKS: "RISKS",
  },
  Prisma: {},
}));

import { createIdea } from "./ideas";
import { triggerResearch } from "@/lib/research";

beforeEach(() => {
  vi.clearAllMocks();
  transactionMock.mockResolvedValue(undefined);
});

const OMIT_TITLE = Symbol("omit-title");

function validClaudeResponse(
  scores = [20, 18, 16, 14, 12],
  title: string | typeof OMIT_TITLE = "Generated Title",
) {
  const categories = [
    "MARKET_SIZE",
    "COMPETITORS",
    "TRENDS",
    "CUSTOMER_SEGMENTS",
    "RISKS",
  ] as const;
  const payload: Record<string, unknown> = {
    sections: categories.map((category, i) => ({
      category,
      score: scores[i],
      summary: `${category} summary`,
      sources: [],
    })),
  };
  if (title !== OMIT_TITLE) payload.title = title;
  return {
    content: [{ type: "text", text: JSON.stringify(payload) }],
  };
}

describe("createIdea", () => {
  it("throws when unauthenticated", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    await expect(createIdea("some idea")).rejects.toThrow("Not authenticated");
    expect(createIdeaMock).not.toHaveBeenCalled();
  });

  it("creates idea with PENDING status, placeholder title (120 chars), and returns id", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const longText = "a".repeat(200);
    createIdeaMock.mockResolvedValue({ id: "idea-123", rawText: longText });
    updateIdeaMock.mockResolvedValue({ id: "idea-123", rawText: longText });
    anthropicCreateMock.mockResolvedValue(validClaudeResponse());

    const id = await createIdea(longText);

    expect(id).toBe("idea-123");
    expect(createIdeaMock).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        title: "a".repeat(120),
        rawText: longText,
        status: "PENDING",
      },
    });
  });

  it("uses only the first line as placeholder title when rawText has line breaks", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const text = "Catchy headline\n\nLonger description on subsequent lines.";
    createIdeaMock.mockResolvedValue({ id: "idea-789", rawText: text });
    updateIdeaMock.mockResolvedValue({ id: "idea-789", rawText: text });
    anthropicCreateMock.mockResolvedValue(validClaudeResponse());

    await createIdea(text);

    expect(createIdeaMock).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        title: "Catchy headline",
        rawText: text,
        status: "PENDING",
      },
    });
  });

  it("fires triggerResearch without awaiting it", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    createIdeaMock.mockResolvedValue({ id: "idea-456", rawText: "hi" });
    updateIdeaMock.mockResolvedValue({ id: "idea-456", rawText: "hi" });
    anthropicCreateMock.mockResolvedValue(validClaudeResponse());

    await createIdea("hi");

    expect(updateIdeaMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "idea-456" },
        data: { status: "RESEARCHING" },
      }),
    );
  });
});

describe("triggerResearch", () => {
  it("walks PENDING -> RESEARCHING -> READY and persists sections + score", async () => {
    updateIdeaMock.mockResolvedValue({
      id: "idea-1",
      rawText: "interesting idea",
    });
    anthropicCreateMock.mockResolvedValue(validClaudeResponse());

    await triggerResearch("idea-1");

    expect(updateIdeaMock).toHaveBeenNthCalledWith(1, {
      where: { id: "idea-1" },
      data: { status: "RESEARCHING" },
    });
    expect(anthropicCreateMock).toHaveBeenCalledTimes(1);
    const txArg = transactionMock.mock.calls[0][0];
    expect(Array.isArray(txArg)).toBe(true);
    expect(createManyMock).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          ideaId: "idea-1",
          category: "MARKET_SIZE",
          score: 20,
        }),
      ]),
    });
    const updateCall = updateIdeaMock.mock.calls.find(([arg]) => arg?.data?.status === "READY");
    expect(updateCall?.[0]).toEqual({
      where: { id: "idea-1" },
      data: {
        status: "READY",
        readinessScore: 80,
        title: "Generated Title",
      },
    });
  });

  it("falls back to keeping existing title when Claude omits title", async () => {
    updateIdeaMock.mockResolvedValue({ id: "idea-notitle", rawText: "x" });
    anthropicCreateMock.mockResolvedValue(validClaudeResponse([10, 10, 10, 10, 10], OMIT_TITLE));

    await triggerResearch("idea-notitle");

    const readyCall = updateIdeaMock.mock.calls.find(([arg]) => arg?.data?.status === "READY");
    expect(readyCall?.[0].data.title).toBeUndefined();
    expect(readyCall?.[0].data.status).toBe("READY");
  });

  it("trims whitespace and caps Claude-generated title at 80 chars", async () => {
    updateIdeaMock.mockResolvedValue({ id: "idea-long", rawText: "x" });
    const longTitle = "  " + "t".repeat(200) + "  ";
    anthropicCreateMock.mockResolvedValue(validClaudeResponse([10, 10, 10, 10, 10], longTitle));

    await triggerResearch("idea-long");

    const readyCall = updateIdeaMock.mock.calls.find(([arg]) => arg?.data?.status === "READY");
    expect(readyCall?.[0].data.title).toBe("t".repeat(80));
  });

  it("clamps out-of-range and non-numeric scores to [0,20]", async () => {
    updateIdeaMock.mockResolvedValue({ id: "idea-2", rawText: "x" });
    anthropicCreateMock.mockResolvedValue({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            sections: [
              { category: "MARKET_SIZE", score: 99, summary: "s", sources: [] },
              { category: "COMPETITORS", score: -5, summary: "s", sources: [] },
              {
                category: "TRENDS",
                score: "bad" as unknown as number,
                summary: "s",
                sources: [],
              },
              {
                category: "CUSTOMER_SEGMENTS",
                score: 15.7,
                summary: "s",
                sources: [],
              },
              { category: "RISKS", score: 10, summary: "s", sources: [] },
            ],
          }),
        },
      ],
    });

    await triggerResearch("idea-2");

    const sections = createManyMock.mock.calls[0][0].data;
    expect(sections.find((s: { category: string }) => s.category === "MARKET_SIZE").score).toBe(20);
    expect(sections.find((s: { category: string }) => s.category === "COMPETITORS").score).toBe(0);
    expect(sections.find((s: { category: string }) => s.category === "TRENDS").score).toBe(0);
    expect(
      sections.find((s: { category: string }) => s.category === "CUSTOMER_SEGMENTS").score,
    ).toBe(16);

    const readyCall = updateIdeaMock.mock.calls.find(([arg]) => arg?.data?.status === "READY");
    expect(readyCall?.[0].data.readinessScore).toBe(46);
  });

  it("transitions to ERROR when Claude returns no text block", async () => {
    updateIdeaMock.mockResolvedValue({ id: "idea-3", rawText: "x" });
    anthropicCreateMock.mockResolvedValue({ content: [] });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await triggerResearch("idea-3");

    const errorCall = updateIdeaMock.mock.calls.find(([arg]) => arg?.data?.status === "ERROR");
    expect(errorCall?.[0]).toEqual({
      where: { id: "idea-3" },
      data: { status: "ERROR" },
    });
    expect(transactionMock).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("transitions to ERROR when Claude returns invalid JSON", async () => {
    updateIdeaMock.mockResolvedValue({ id: "idea-4", rawText: "x" });
    anthropicCreateMock.mockResolvedValue({
      content: [{ type: "text", text: "not-json" }],
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await triggerResearch("idea-4");

    const errorCall = updateIdeaMock.mock.calls.find(([arg]) => arg?.data?.status === "ERROR");
    expect(errorCall?.[0].data.status).toBe("ERROR");
    errorSpy.mockRestore();
  });

  it("transitions to ERROR when Anthropic call throws", async () => {
    updateIdeaMock.mockResolvedValue({ id: "idea-5", rawText: "x" });
    anthropicCreateMock.mockRejectedValue(new Error("network down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await triggerResearch("idea-5");

    const errorCall = updateIdeaMock.mock.calls.find(([arg]) => arg?.data?.status === "ERROR");
    expect(errorCall?.[0].data.status).toBe("ERROR");
    errorSpy.mockRestore();
  });
});
