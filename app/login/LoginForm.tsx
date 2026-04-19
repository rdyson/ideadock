"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setSubmitting(false);
      return;
    }

    console.log("✅ login");
    router.push("/ideas");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold mb-6">Log in</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-foreground text-background py-2 font-medium disabled:opacity-50"
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="text-sm mt-4">
        No account?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
