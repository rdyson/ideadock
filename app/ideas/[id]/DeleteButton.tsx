"use client";

import { useState, useTransition } from "react";
import { deleteIdea } from "@/app/actions/ideas";

const CONFIRM_TEXT =
  "Are you sure? This will permanently delete the idea and all research data. This cannot be undone.";

export default function DeleteButton({ ideaId }: { ideaId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteIdea(ideaId);
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md border border-red-500/40 text-red-600 dark:text-red-400 px-3 py-1.5 text-sm font-medium hover:bg-red-500/10 transition-colors"
      >
        Delete
      </button>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-labelledby="delete-idea-title"
      className="border border-red-500/40 rounded-lg p-4 bg-red-500/5"
    >
      <p id="delete-idea-title" className="text-sm mb-3">
        {CONFIRM_TEXT}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="rounded-md bg-red-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {pending ? "Deleting…" : "Delete permanently"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-md border border-black/15 dark:border-white/20 px-3 py-1.5 text-sm font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
