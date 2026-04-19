"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    console.log("✅ signup");
    setSent(true);
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-6">Sign up</h1>
        {sent ? (
          <p className="text-sm">Check your email for a confirmation link to finish signing up.</p>
        ) : (
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
                minLength={6}
                autoComplete="new-password"
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
              {submitting ? "Creating account…" : "Sign up"}
            </button>
          </form>
        )}
        <p className="text-sm mt-4">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
