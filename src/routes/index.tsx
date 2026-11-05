import { createFileRoute, Link } from "@tanstack/react-router";
import { Accessibility, ArrowRight, BellRing, Map, MessageSquareWarning, Ticket } from "lucide-react";
import { Brand, Disclaimer } from "@/components/transit/Brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NammaTransit AI — Your Chennai Journey, Simplified" },
      { name: "description", content: "Ask about Chennai Metro journeys, fares, accessibility, service alerts and complaints in a natural conversation." },
      { property: "og:title", content: "NammaTransit AI — Your Chennai Journey, Simplified" },
      { property: "og:description", content: "Conversational mobility assistant for Chennai public transport." },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Map, title: "Journey planning", text: "Metro routes, directions and interchanges." },
  { icon: Ticket, title: "Fares & tickets", text: "Fare lookups and official booking guidance." },
  { icon: Accessibility, title: "Accessibility", text: "Lifts, wheelchair access and counters." },
  { icon: BellRing, title: "Service updates", text: "Disruptions with clear source labels." },
  { icon: MessageSquareWarning, title: "Grievances", text: "Guided complaint drafts, ready to submit." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-6">
          <nav className="flex items-center justify-between">
            <Brand light />
            <Link to="/chat" className="rounded-full border border-primary-foreground/20 px-4 py-2 text-sm font-medium hover:bg-primary-foreground/10">Open assistant</Link>
          </nav>
          <div className="mt-16 grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-rise">
              <span className="inline-flex rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent">Chennai Metro · MTC · Suburban</span>
              <h1 className="mt-5 font-display text-5xl font-semibold leading-tight tracking-tight md:text-6xl">Your Chennai Journey, Simplified.</h1>
              <p className="mt-5 max-w-md text-lg text-primary-foreground/75">Your intelligent companion for Chennai public transport.</p>
              <Link to="/chat" className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground shadow-glow transition hover:translate-y-[-1px]">
                Start Chatting <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="animate-rise rounded-3xl border border-primary-foreground/10 bg-primary-foreground/5 p-5 backdrop-blur" style={{ animationDelay: "120ms" }}>
              <div className="space-y-3 text-sm">
                <div className="ml-auto w-fit rounded-2xl rounded-br-sm bg-accent px-4 py-2 text-accent-foreground">Guindy to Chennai Airport?</div>
                <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-primary-foreground/10 px-4 py-2">Blue Line, towards Chennai Airport — 4 stops.</div>
                <div className="ml-auto w-fit rounded-2xl rounded-br-sm bg-accent px-4 py-2 text-accent-foreground">What is the fare?</div>
                <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-primary-foreground/10 px-4 py-2">For Guindy → Chennai Airport, the demo fare is ₹20.</div>
                <div className="ml-auto w-fit rounded-2xl rounded-br-sm bg-accent px-4 py-2 text-accent-foreground">What about starting from Alandur?</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto -mt-12 grid max-w-6xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-5">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border bg-card p-5 shadow-soft">
            <f.icon className="h-6 w-6 text-accent" />
            <h3 className="mt-3 font-display font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
      <footer className="mx-auto max-w-6xl px-6 py-10"><Disclaimer /></footer>
    </div>
  );
}
