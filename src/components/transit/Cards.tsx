import { useState } from "react";
import { Accessibility, AlertTriangle, ArrowRight, Check, Copy, ExternalLink, Ticket, TrainFront } from "lucide-react";
import type { Card } from "@/lib/transit/engine";
import { OFFICIAL_LINKS } from "@/lib/transit/data";

const Badge = ({ children, tone = "warn" }: { children: React.ReactNode; tone?: "warn" | "ok" | "danger" }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
    tone === "ok" ? "bg-accent-soft text-accent" : tone === "danger" ? "bg-destructive text-destructive-foreground" : "bg-warning-soft text-warning-foreground"}`}>{children}</span>
);

const Shell = ({ icon: Icon, title, badge, children }: { icon: typeof Ticket; title: string; badge?: React.ReactNode; children: React.ReactNode }) => (
  <div className="animate-rise rounded-2xl border bg-card p-4 shadow-soft">
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Icon className="h-4 w-4 text-accent" />
      <h4 className="font-display text-sm font-semibold">{title}</h4>
      <span className="ml-auto">{badge}</span>
    </div>
    {children}
  </div>
);

export function ResultCard({ card }: { card: Card }) {
  if (card.kind === "journey") {
    const j = card.journey;
    return (
      <Shell icon={TrainFront} title={`${j.origin} → ${j.destination}`} badge={<Badge tone="ok">{j.mode}</Badge>}>
        <div className="space-y-4">
          {j.legs.map((l, i) => (
            <div key={i}>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className={`h-2.5 w-2.5 rounded-full ${l.lineId === "blue" ? "bg-line-blue" : "bg-line-green"}`} />
                <b>{l.line}</b><span className="text-muted-foreground">· {l.direction}</span>
              </div>
              <ol className={`mt-2 ml-1 border-l-2 pl-4 text-sm ${l.lineId === "blue" ? "border-line-blue" : "border-line-green"}`}>
                {l.stops.map((s, k) => (
                  <li key={s} className={k === 0 || k === l.stops.length - 1 ? "font-semibold" : "text-muted-foreground"}>{s}</li>
                ))}
              </ol>
              {j.interchange && i === 0 && <p className="mt-2 text-xs font-semibold text-accent">Change trains at {j.interchange}</p>}
            </div>
          ))}
          <p className="text-xs text-muted-foreground">{j.totalStops} stops · Journey duration not available in dataset.</p>
        </div>
      </Shell>
    );
  }
  if (card.kind === "fare") {
    return (
      <Shell icon={Ticket} title="Fare & ticket guidance" badge={<Badge>Demo value — not verified</Badge>}>
        <p className="text-sm text-muted-foreground">{card.journey.origin} → {card.journey.destination} · {card.journey.totalStops} stops</p>
        <p className="mt-2 font-display text-3xl font-semibold">₹{card.fare}</p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>Ticket type: Single journey (QR / token)</li>
          <li>Regular riders: Travel card or NCMC Singara Chennai card</li>
        </ul>
        <a href={OFFICIAL_LINKS.cmrlTickets} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
          Official CMRL ticketing <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <p className="mt-2 text-xs text-muted-foreground">No tickets are sold in this app.</p>
      </Shell>
    );
  }
  if (card.kind === "facility") {
    return (
      <Shell icon={Accessibility} title={`${card.station} — facilities`} badge={<Badge>Published info · not live</Badge>}>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {["Lifts to concourse & platform", "Wheelchair-accessible entry", "Tactile paving", "Accessible ticket counter"].map((f) => (
            <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" />{f}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">Source: sample dataset based on CMRL station facilities. Live lift operating status is not available — check at the station.</p>
      </Shell>
    );
  }
  if (card.kind === "alerts") {
    return (
      <Shell icon={AlertTriangle} title="Service updates" badge={<Badge tone="danger">Simulation — not live</Badge>}>
        <div className="space-y-2">
          {card.alerts.map((a) => (
            <div key={a.id} className="rounded-xl bg-muted p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2"><b>{a.affected}</b><Badge>{a.type}</Badge></div>
              <p className="mt-1 text-muted-foreground">{a.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">Source: {a.source} · {new Date(a.updatedAt).toLocaleString("en-IN")}</p>
            </div>
          ))}
        </div>
      </Shell>
    );
  }
  return <GrievanceCard card={card} />;
}

function GrievanceCard({ card }: { card: Extract<Card, { kind: "grievance" }> }) {
  const [d, setD] = useState(card.draft);
  const [copied, setCopied] = useState(false);
  const text = `Operator: ${d.operator}\nStation/Route: ${d.location}\nCategory: ${d.category}\nDate & time: ${d.datetime}\n\nDescription:\n${d.description}`;
  const fields: [keyof typeof d, string][] = [["operator", "Operator"], ["location", "Station / route"], ["category", "Category"], ["datetime", "Date & time"]];
  return (
    <Shell icon={AlertTriangle} title="Complaint draft" badge={<Badge tone="danger">Draft only — not submitted</Badge>}>
      <div className="grid gap-2 sm:grid-cols-2">
        {fields.map(([k, label]) => (
          <label key={k} className="text-xs font-semibold text-muted-foreground">{label}
            <input value={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.value })} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </label>
        ))}
      </div>
      <label className="mt-2 block text-xs font-semibold text-muted-foreground">Description
        <textarea value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Copied" : "Copy complaint"}
        </button>
        <a href={card.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold">
          Official grievance portal <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </Shell>
  );
}
