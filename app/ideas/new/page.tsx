"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createIdea } from "@/app/actions/ideas";

const MIN_LENGTH = 3;

export default function NewIdeaPage() {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const trimmed = rawText.trim();
  const tooShort = trimmed.length < MIN_LENGTH;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (tooShort || submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      const ideaId = await createIdea(trimmed);
      router.push(`/ideas/${ideaId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create idea";
      if (message === "Not authenticated") {
        router.push("/login");
        return;
      }
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-start justify-center p-8">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-semibold mb-6">New idea</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm">Describe your idea</span>
            <textarea
              required
              minLength={MIN_LENGTH}
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              disabled={submitting}
              placeholder="A short description of your idea…"
              className="border border-black/20 dark:border-white/20 rounded px-3 py-2 bg-transparent resize-y disabled:opacity-50"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={tooShort || submitting}
            className="rounded bg-foreground text-background py-2 font-medium disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Submit"}
          </button>
        </form>
      </div>
    </main>
  );
}
