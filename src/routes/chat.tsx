
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Accessibility,
  BellRing,
  Loader2,
  Map,
  Menu,
  MessageSquareWarning,
  Plus,
  SendHorizontal,
  Ticket,
  TramFront,
  X,
} from "lucide-react";
import { Brand, Disclaimer } from "@/components/transit/Brand";
import { ResultCard } from "@/components/transit/Cards";
import { sendChat } from "@/lib/transit/chat.functions";
import type { Card, Context } from "@/lib/transit/engine";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat — NammaTransit AI" },
      {
        name: "description",
        content:
          "Chat with NammaTransit AI about Chennai public transport.",
      },
      { property: "og:title", content: "Chat — NammaTransit AI" },
      {
        property: "og:description",
        content: "Multi-turn assistant for Chennai public transport.",
      },
    ],
  }),
  component: ChatPage,
});

type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  cards?: Card[];
  error?: boolean;
};

type Saved = {
  messages: Msg[];
  context: Context;
  suggestions: string[];
};

const KEY = "nammatransit-conversation";

const WELCOME: Msg = {
  id: "w",
  role: "assistant",
  text: "Vanakkam! I'm NammaTransit AI. Ask me anything about Chennai transport, Metro journeys, buses, suburban trains, fares or accessibility. I can also answer general questions and understand follow-up questions.",
};

const START_CHIPS = [
  "How do I travel from Guindy to Chennai Airport?",
  "Koyambedu to Chennai Central",
  "Any service alerts?",
  "Report a problem",
];

const NAV = [
  {
    icon: Map,
    label: "Plan Journey",
    prompt: "How do I travel from Guindy to Chennai Airport?",
  },
  { icon: Ticket, label: "Fares and Tickets", prompt: "What is the fare?" },
  {
    icon: BellRing,
    label: "Service Updates",
    prompt: "Show service updates",
  },
  {
    icon: Accessibility,
    label: "Accessibility",
    prompt: "Is the starting station accessible?",
  },
  {
    icon: MessageSquareWarning,
    label: "Report a Problem",
    prompt: "I want to report a problem",
  },
];

function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [context, setContext] = useState<Context>({});
  const [suggestions, setSuggestions] = useState(START_CHIPS);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(KEY) || "null",
      ) as Saved | null;

      if (saved?.messages?.length) {
        setMessages(saved.messages);
        setContext(saved.context ?? {});
        setSuggestions(saved.suggestions ?? START_CHIPS);
      }
    } catch {
      // Ignore invalid saved conversation
    }

    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        messages,
        context,
        suggestions,
      } satisfies Saved),
    );

    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, context, suggestions]);

  async function send(text: string) {
    const msg = text.trim();

    if (!msg || loading) return;

    setOpen(false);
    setInput("");

    // Keep the previous conversation for Gemini.
    const history = messages
      .filter((m) => m.id !== "w")
      .map((m) => ({
        role: m.role,
        text: m.text,
      }))
      .slice(-16);

    // Display the user's new message.
    setMessages((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        role: "user",
        text: msg,
      },
    ]);

    setLoading(true);

    try {
      const response = await sendChat({
        data: {
          message: msg,
          context,
          history,
        },
      });

      setContext(response.context);
      setSuggestions(response.suggestions);

      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: response.reply,
          cards: response.cards,
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);

      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "I'm having trouble connecting to the assistant right now. Please try again.",
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function reset() {
    setMessages([WELCOME]);
    setContext({});
    setSuggestions(START_CHIPS);
    setOpen(false);

    localStorage.removeItem(KEY);
    inputRef.current?.focus();
  }

  const journey =
    context.origin && context.destination
      ? `${context.origin} → ${context.destination}`
      : context.origin
        ? `From ${context.origin}`
        : context.destination
          ? `To ${context.destination}`
          : null;

  return (
    <div className="flex h-screen bg-background">
      {open && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-sidebar p-5 text-sidebar-foreground transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Link to="/">
            <Brand light />
          </Link>

          <button
            className="lg:hidden"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={reset}
          className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-sidebar-primary px-4 py-2.5 font-semibold text-sidebar-primary-foreground shadow-glow"
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </button>

        <nav className="mt-6 space-y-1">
          {NAV.map((item) => (
            <button
              key={item.label}
              onClick={() => send(item.prompt)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-sidebar-accent"
            >
              <item.icon className="h-4 w-4 text-sidebar-primary" />
              {item.label}
            </button>
          ))}
        </nav>

        {journey && (
          <div className="mt-6 rounded-xl border border-sidebar-border p-3 text-xs">
            <p className="font-semibold uppercase tracking-wide text-sidebar-primary">
              Remembered journey
            </p>
            <p className="mt-1 text-sm">{journey}</p>
          </div>
        )}

        <div className="mt-auto rounded-xl bg-sidebar-accent p-3 text-xs text-sidebar-foreground/70">
          Prototype. Fares, facilities and alerts may contain demo data. No
          tickets or complaints are submitted.
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b bg-card px-4 py-3">
          <button
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <TramFront className="h-5 w-5 text-accent" />

          <h1 className="font-display font-semibold">
            Mobility Assistant
          </h1>

          {journey && (
            <span className="ml-auto hidden rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent sm:inline">
              {journey}
            </span>
          )}
        </header>

        <div className="flex-1 overflow-y-auto" aria-live="polite">
          <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
            {messages.map((message) =>
              message.role === "user" ? (
                <div
                  key={message.id}
                  className="animate-rise ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-primary-foreground"
                >
                  {message.text}
                </div>
              ) : (
                <div key={message.id} className="animate-rise flex gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                    <TramFront className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1 space-y-3">
                    <p className={message.error ? "text-destructive" : ""}>
                      {message.text}
                    </p>

                    {message.cards?.map((card, index) => (
                      <ResultCard key={index} card={card} />
                    ))}
                  </div>
                </div>
              ),
            )}

            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                Thinking and checking available information...
              </div>
            )}

            <div ref={endRef} />
          </div>
        </div>

        <div className="border-t bg-card px-4 py-3">
          <div className="mx-auto max-w-3xl">
            <div className="mb-2 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  disabled={loading}
                  onClick={() => send(suggestion)}
                  className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium hover:border-accent hover:text-accent disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                send(input);
              }}
              className="flex items-end gap-2 rounded-2xl border bg-background p-2 focus-within:ring-2 focus-within:ring-ring"
            >
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Ask anything about Chennai transport..."
                aria-label="Message"
                className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 focus:outline-none"
              />

              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send"
                className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground disabled:opacity-40"
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-2">
              <Disclaimer />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
