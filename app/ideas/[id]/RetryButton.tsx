"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { triggerResearch } from "@/app/actions/ideas";

export default function RetryButton({ ideaId }: { ideaId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleRetry() {
    startTransition(async () => {
      await triggerResearch(ideaId);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleRetry}
      disabled={pending}
      className="rounded bg-foreground text-background px-4 py-2 text-sm font-medium disabled:opacity-50"
    >
      {pending ? "Retrying…" : "Retry"}
    </button>
  );
}
