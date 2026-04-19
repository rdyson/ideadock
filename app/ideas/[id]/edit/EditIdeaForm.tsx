"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateIdea } from "@/app/actions/ideas";

const MIN_LENGTH = 3;

export default function EditIdeaForm({
  ideaId,
  initialText,
}: {
  ideaId: string;
  initialText: string;
}) {
  const router = useRouter();
  const [rawText, setRawText] = useState(initialText);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const trimmed = rawText.trim();
  const tooShort = trimmed.length < MIN_LENGTH;
  const unchanged = trimmed === initialText.trim();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (tooShort || submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      await updateIdea(ideaId, trimmed);
      router.push(`/ideas/${ideaId}`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update idea";
      if (message === "Not authenticated") {
        router.push("/login");
        return;
      }
      setError(message);
      setSubmitting(false);
    }
  }

  return (
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
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={tooShort || unchanged || submitting}
          className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save changes"}
        </button>
        <Link
          href={`/ideas/${ideaId}`}
          className="text-sm px-4 py-2 rounded-md border border-black/15 dark:border-white/20 hover:bg-black/[.04] dark:hover:bg-white/[.06] transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
