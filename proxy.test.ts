import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getUserMock = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser: getUserMock },
  }),
}));

import { proxy } from "./proxy";

function request(url: string) {
  return new NextRequest(new URL(url));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("proxy auth redirects", () => {
  it("redirects unauthenticated user from /ideas to /login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await proxy(request("http://localhost/ideas"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/login");
  });

  it("redirects unauthenticated user from /ideas/abc to /login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await proxy(request("http://localhost/ideas/abc"));
    expect(res.headers.get("location")).toBe("http://localhost/login");
  });

  it("lets authenticated user through to /ideas", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    const res = await proxy(request("http://localhost/ideas"));
    expect(res.headers.get("location")).toBeNull();
    expect(res.status).toBe(200);
  });

  it("does not redirect unauthenticated user from non-/ideas paths", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await proxy(request("http://localhost/login"));
    expect(res.headers.get("location")).toBeNull();
  });
});
