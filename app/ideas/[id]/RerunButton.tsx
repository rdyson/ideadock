"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { rerunResearch } from "@/app/actions/ideas";

export default function RerunButton({ ideaId }: { ideaId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleRerun() {
    startTransition(async () => {
      await rerunResearch(ideaId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleRerun}
      disabled={pending}
      className="rounded-md bg-foreground text-background px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {pending ? "Rerunning…" : "Rerun Research"}
    </button>
  );
}
