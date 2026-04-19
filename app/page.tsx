import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STEPS = [
  {
    number: "1",
    title: "Submit your idea",
    body: "Drop in a rough sentence or a half-baked pitch. Shape doesn't matter — we take it from there.",
  },
  {
    number: "2",
    title: "AI researches it",
    body: "Our agent digs into market size, competitors, trends, customer segments, and risks in the background.",
  },
  {
    number: "3",
    title: "Get a readiness score",
    body: "You see a clear score and a per-category breakdown so you know which ideas are worth pursuing.",
  },
];

const FEATURES = [
  {
    title: "Market size",
    body: "How big is the opportunity? We surface TAM signals and demand indicators.",
  },
  {
    title: "Competitors",
    body: "Who's already playing here? See who you'd be up against before you start.",
  },
  {
    title: "Trends",
    body: "Is this tide coming in or going out? Track momentum and timing signals.",
  },
  {
    title: "Customer segments",
    body: "Who actually wants this? Identify the buyers and their burning pains.",
  },
  {
    title: "Risks",
    body: "What could kill it? Regulatory, technical, and go-to-market landmines called out early.",
  },
];

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ctaHref = user ? "/ideas" : "/signup";
  const primaryCtaLabel = user ? "Go to your ideas" : "Start researching your ideas";
  const bottomCtaLabel = user ? "Open your dock" : "Start researching your ideas";

  return (
    <main className="flex-1">
      <section className="px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-balance">
            Stop sitting on startup ideas.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-black/70 dark:text-white/70 max-w-2xl mx-auto text-balance">
            You know that note in your phone with 40 half-baked startup ideas you&apos;ll look into
            eventually? IdeaDock researches them for you on autopilot and tells you which ones are
            actually worth pursuing.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href={ctaHref}
              className="rounded-md bg-foreground text-background px-5 py-3 text-sm sm:text-base font-medium hover:opacity-90 transition-opacity"
            >
              {primaryCtaLabel}
            </Link>
            {!user && (
              <Link
                href="/login"
                className="rounded-md border border-black/[.12] dark:border-white/[.18] px-5 py-3 text-sm sm:text-base font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06] transition-colors"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16 sm:py-20 border-t border-black/[.08] dark:border-white/[.12]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">
            How it works
          </h2>
          <div className="mt-10 grid gap-6 sm:gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="rounded-lg border border-black/[.08] dark:border-white/[.12] p-6"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-foreground text-background font-semibold text-sm">
                  {step.number}
                </div>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-black/70 dark:text-white/70">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16 sm:py-20 border-t border-black/[.08] dark:border-white/[.12]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">
            What we dig into
          </h2>
          <p className="mt-3 text-center text-black/70 dark:text-white/70 max-w-xl mx-auto">
            Every idea gets researched across five categories that actually move the needle on
            whether it&apos;s worth your time.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-black/[.08] dark:border-white/[.12] p-5"
              >
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-black/70 dark:text-white/70">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-16 sm:py-24 border-t border-black/[.08] dark:border-white/[.12]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
            Your next company might already be in your notes app.
          </h2>
          <p className="mt-4 text-black/70 dark:text-white/70 text-balance">
            Find out which one is worth building.
          </p>
          <div className="mt-8">
            <Link
              href={ctaHref}
              className="inline-block rounded-md bg-foreground text-background px-6 py-3 text-base font-medium hover:opacity-90 transition-opacity"
            >
              {bottomCtaLabel}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
