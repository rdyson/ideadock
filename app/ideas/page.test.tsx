import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";

const { getUserMock, findManyMock, redirectMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  findManyMock: vi.fn(),
  redirectMock: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: getUserMock } }),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { idea: { findMany: (...a: unknown[]) => findManyMock(...a) } },
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@prisma/client", () => ({ IdeaStatus: {} }));

import IdeasPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
});

function idea(
  overrides: Partial<{
    id: string;
    title: string;
    status: "PENDING" | "RESEARCHING" | "READY" | "ERROR";
    readinessScore: number;
    createdAt: Date;
  }> = {},
) {
  return {
    id: "idea-1",
    title: "My Idea",
    status: "READY" as const,
    readinessScore: 72,
    createdAt: new Date("2026-03-01T12:00:00Z"),
    ...overrides,
  };
}

describe("IdeasPage", () => {
  it("redirects to /login when user is not authenticated", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    await expect(IdeasPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("shows empty state when there are 0 ideas", async () => {
    findManyMock.mockResolvedValue([]);
    render(await IdeasPage());
    expect(screen.getByText("No ideas yet")).toBeInTheDocument();
    expect(screen.getByText(/Capture your first idea/i)).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders a single idea row with status badge and score", async () => {
    findManyMock.mockResolvedValue([
      idea({ title: "Solo idea", status: "READY", readinessScore: 85 }),
    ]);
    render(await IdeasPage());
    expect(screen.getByText("Solo idea")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("READY")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("renders N ideas with correct status badge styles per state", async () => {
    findManyMock.mockResolvedValue([
      idea({ id: "a", title: "Pending one", status: "PENDING", readinessScore: 0 }),
      idea({ id: "b", title: "Researching one", status: "RESEARCHING", readinessScore: 0 }),
      idea({ id: "c", title: "Ready one", status: "READY", readinessScore: 90 }),
      idea({ id: "d", title: "Error one", status: "ERROR", readinessScore: 0 }),
    ]);
    render(await IdeasPage());
    expect(screen.getAllByRole("listitem")).toHaveLength(4);

    const ready = screen.getByText("READY");
    expect(ready.className).toMatch(/bg-green-100/);
    expect(ready.className).toMatch(/text-green-800/);

    const error = screen.getByText("ERROR");
    expect(error.className).toMatch(/bg-red-100/);
    expect(error.className).toMatch(/text-red-800/);

    const pending = screen.getByText("PENDING");
    expect(pending.className).toMatch(/bg-amber-100/);

    const researching = screen.getByText("RESEARCHING");
    expect(researching.className).toMatch(/bg-amber-100/);
  });

  it("orders ideas by findMany orderBy desc (scopes query to current user)", async () => {
    findManyMock.mockResolvedValue([]);
    render(await IdeasPage());
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "u1" },
        orderBy: { createdAt: "desc" },
      }),
    );
  });

  it("idea row links to the idea detail page", async () => {
    findManyMock.mockResolvedValue([idea({ id: "abc123", title: "Link me" })]);
    render(await IdeasPage());
    const item = screen.getByRole("listitem");
    const link = within(item).getByRole("link");
    expect(link).toHaveAttribute("href", "/ideas/abc123");
  });
});
