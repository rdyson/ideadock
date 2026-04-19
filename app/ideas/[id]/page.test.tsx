import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { getUserMock, findUniqueMock, notFoundMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  findUniqueMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: getUserMock } }),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { idea: { findUnique: (...a: unknown[]) => findUniqueMock(...a) } },
}));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));
vi.mock("@prisma/client", () => ({ ResearchCategory: {} }));

vi.mock("./AutoRefresh", () => ({
  default: () => <div data-testid="auto-refresh" />,
}));
vi.mock("./DeleteButton", () => ({
  default: ({ ideaId }: { ideaId: string }) => (
    <button data-testid="delete" data-idea={ideaId}>
      delete
    </button>
  ),
}));
vi.mock("./RerunButton", () => ({
  default: ({ ideaId }: { ideaId: string }) => (
    <button data-testid="retry" data-idea={ideaId}>
      retry
    </button>
  ),
}));

import IdeaPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
});

const fullSections = [
  {
    id: "s1",
    category: "MARKET_SIZE",
    score: 18,
    summary: "Big market",
    sources: [],
    createdAt: new Date(),
  },
  {
    id: "s2",
    category: "COMPETITORS",
    score: 12,
    summary: "Some rivals",
    sources: [],
    createdAt: new Date(),
  },
  {
    id: "s3",
    category: "TRENDS",
    score: 15,
    summary: "AI tailwind",
    sources: [],
    createdAt: new Date(),
  },
  {
    id: "s4",
    category: "CUSTOMER_SEGMENTS",
    score: 10,
    summary: "Clear segment",
    sources: [],
    createdAt: new Date(),
  },
  {
    id: "s5",
    category: "RISKS",
    score: 8,
    summary: "Regulatory risk",
    sources: [],
    createdAt: new Date(),
  },
];

function readyIdea() {
  return {
    id: "idea-1",
    userId: "u1",
    title: "My Idea",
    rawText: "raw",
    status: "READY" as const,
    readinessScore: 63,
    createdAt: new Date(),
    updatedAt: new Date(),
    sections: fullSections,
  };
}

describe("IdeaPage", () => {
  it("notFound when unauthenticated", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    await expect(IdeaPage({ params: Promise.resolve({ id: "idea-1" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("notFound when idea does not exist", async () => {
    findUniqueMock.mockResolvedValue(null);
    await expect(IdeaPage({ params: Promise.resolve({ id: "idea-1" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("notFound when idea belongs to a different user", async () => {
    findUniqueMock.mockResolvedValue({ ...readyIdea(), userId: "someone-else" });
    await expect(IdeaPage({ params: Promise.resolve({ id: "idea-1" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("renders the full rawText under the title", async () => {
    findUniqueMock.mockResolvedValue({
      ...readyIdea(),
      rawText: "The full multi-sentence description of my idea.",
    });
    render(await IdeaPage({ params: Promise.resolve({ id: "idea-1" }) }));
    expect(screen.getByText("The full multi-sentence description of my idea.")).toBeInTheDocument();
  });

  it("renders a score per category with per-category values when READY", async () => {
    findUniqueMock.mockResolvedValue(readyIdea());
    render(await IdeaPage({ params: Promise.resolve({ id: "idea-1" }) }));

    expect(screen.getByText("Market Size")).toBeInTheDocument();
    expect(screen.getByText("Competitors")).toBeInTheDocument();
    expect(screen.getByText("Trends")).toBeInTheDocument();
    expect(screen.getByText("Customer Segments")).toBeInTheDocument();
    expect(screen.getByText("Risks")).toBeInTheDocument();

    expect(screen.getByText("18/20")).toBeInTheDocument();
    expect(screen.getByText("12/20")).toBeInTheDocument();
    expect(screen.getByText("15/20")).toBeInTheDocument();
    expect(screen.getByText("10/20")).toBeInTheDocument();
    expect(screen.getByText("8/20")).toBeInTheDocument();

    expect(screen.getByText("Big market")).toBeInTheDocument();
    expect(screen.getByText("63/100")).toBeInTheDocument();
  });

  it("shows the in-flight spinner and AutoRefresh when status is PENDING", async () => {
    findUniqueMock.mockResolvedValue({
      ...readyIdea(),
      status: "PENDING",
      readinessScore: 0,
      sections: [],
    });
    render(await IdeaPage({ params: Promise.resolve({ id: "idea-1" }) }));

    expect(screen.getByTestId("auto-refresh")).toBeInTheDocument();
    expect(screen.getByText(/Researching/i)).toBeInTheDocument();
    expect(screen.queryByText("Market Size")).not.toBeInTheDocument();
  });

  it("shows the in-flight spinner and AutoRefresh when status is RESEARCHING", async () => {
    findUniqueMock.mockResolvedValue({
      ...readyIdea(),
      status: "RESEARCHING",
      sections: [],
    });
    render(await IdeaPage({ params: Promise.resolve({ id: "idea-1" }) }));
    expect(screen.getByTestId("auto-refresh")).toBeInTheDocument();
  });

  it("shows the retry button when status is ERROR", async () => {
    findUniqueMock.mockResolvedValue({
      ...readyIdea(),
      status: "ERROR",
      readinessScore: 0,
      sections: [],
    });
    render(await IdeaPage({ params: Promise.resolve({ id: "idea-1" }) }));
    const retry = screen.getByTestId("retry");
    expect(retry).toHaveAttribute("data-idea", "idea-1");
    expect(screen.getByText(/Research failed/i)).toBeInTheDocument();
  });

  it("renders the ERROR status badge with red style", async () => {
    findUniqueMock.mockResolvedValue({ ...readyIdea(), status: "ERROR" });
    render(await IdeaPage({ params: Promise.resolve({ id: "idea-1" }) }));
    const badge = screen.getByText("ERROR");
    expect(badge.className).toMatch(/bg-red-100/);
  });
});
