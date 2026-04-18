import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

export default async function Header() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-black/[.08] dark:border-white/[.12]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link
          href={user ? "/ideas" : "/"}
          className="font-semibold tracking-tight hover:opacity-80 transition-opacity"
        >
          IdeaDock
        </Link>

        {user ? (
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/ideas"
              className="text-sm px-2 py-1 rounded hover:bg-black/[.04] dark:hover:bg-white/[.06] transition-colors"
            >
              Ideas
            </Link>
            <Link
              href="/ideas/new"
              className="text-sm px-2 py-1 rounded hover:bg-black/[.04] dark:hover:bg-white/[.06] transition-colors"
            >
              New Idea
            </Link>
            <span
              aria-label="Signed-in email"
              className="hidden sm:inline text-xs text-black/60 dark:text-white/60 truncate max-w-[160px]"
              title={user.email ?? ""}
            >
              {user.email}
            </span>
            <LogoutButton />
          </nav>
        ) : (
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm px-2 py-1 rounded hover:bg-black/[.04] dark:hover:bg-white/[.06] transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm rounded-md bg-foreground text-background px-3 py-1.5 hover:opacity-90 transition-opacity"
            >
              Sign up
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
