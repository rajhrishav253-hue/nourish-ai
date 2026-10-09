import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero-bowl.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NutriTrack — Track calories, protein & macros" },
      { name: "description", content: "Log foods by portion and see your daily calories, protein, carbs, fat and fiber at a glance." },
      { property: "og:title", content: "NutriTrack — Track calories, protein & macros" },
      { property: "og:description", content: "Easy food logging with accurate, portion-based nutrition." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
        <div className="animate-rise">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">NutriTrack</p>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">Eat smarter. See every gram.</h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Search foods, log real portions, and watch your calories, protein and macros fill up through the day.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg"><Link to="/dashboard">Open my dashboard</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/auth">Sign in</Link></Button>
          </div>
        </div>
        <img src={hero} alt="Colorful healthy bowl" className="aspect-square w-full rounded-3xl object-cover shadow-xl" />
      </div>
    </main>
  );
}
