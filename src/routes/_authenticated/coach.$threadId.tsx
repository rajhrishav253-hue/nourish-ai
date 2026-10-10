import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo } from "react";
import { ArrowLeft, Plus, Trash2, Apple } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

export const Route = createFileRoute("/_authenticated/coach/$threadId")({
  head: () => ({
    meta: [
      { title: "AI Coach — NutriTrack" },
      { name: "description", content: "Ask nutrition questions and get guidance based on your food logs and goals." },
      { property: "og:title", content: "AI Coach — NutriTrack" },
      { property: "og:description", content: "Personal nutrition guidance from your own logs and goals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CoachPage,
});

const SUGGESTIONS = ["How am I doing on protein this week?", "What should I eat for dinner to hit my goals?", "Am I eating enough fiber?"];

function CoachPage() {
  const { threadId } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  const threads = useQuery({
    queryKey: ["threads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("chat_threads").select("id,title,updated_at").order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const history = useQuery({
    queryKey: ["thread", threadId],
    queryFn: async () => {
      const { data, error } = await supabase.from("chat_messages").select("message").eq("thread_id", threadId).order("created_at");
      if (error) throw error;
      return data.map((r) => r.message as unknown as UIMessage);
    },
  });

  async function newThread() {
    const { data, error } = await supabase.from("chat_threads").insert({}).select("id").single();
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries({ queryKey: ["threads"] });
    nav({ to: "/coach/$threadId", params: { threadId: data.id } });
  }
  async function deleteThread(id: string) {
    const { error } = await supabase.from("chat_threads").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries({ queryKey: ["threads"] });
    if (id === threadId) nav({ to: "/coach" });
  }

  return (
    <main className="flex h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-card p-3 md:flex">
        <Link to="/dashboard" className="mb-3 flex items-center gap-2 px-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
        <Button onClick={newThread} className="mb-3"><Plus className="mr-1 h-4 w-4" />New chat</Button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {threads.data?.map((t) => (
            <div key={t.id} className={`group flex items-center rounded-lg ${t.id === threadId ? "bg-muted" : "hover:bg-muted/60"}`}>
              <Link to="/coach/$threadId" params={{ threadId: t.id }} className="flex-1 truncate px-3 py-2 text-sm">{t.title}</Link>
              <button aria-label="Delete chat" onClick={() => deleteThread(t.id)} className="p-2 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </aside>
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="md:hidden" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Link>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><Apple className="h-4 w-4" /></span>
            <h1 className="font-display font-semibold">NutriTrack Coach</h1>
          </div>
          <Button size="sm" variant="outline" className="md:hidden" onClick={newThread}><Plus className="h-4 w-4" /></Button>
        </header>
        {history.isLoading ? (
          <div className="p-6"><Skeleton className="h-32 w-full" /></div>
        ) : history.isError ? (
          <div className="p-6 text-center"><p className="text-destructive">Couldn't load this chat.</p><Button variant="outline" size="sm" onClick={() => history.refetch()}>Retry</Button></div>
        ) : (
          <ChatWindow key={threadId} threadId={threadId} initial={history.data ?? []} onDone={() => qc.invalidateQueries({ queryKey: ["threads"] })} />
        )}
      </section>
    </main>
  );
}

function ChatWindow({ threadId, initial, onDone }: { threadId: string; initial: UIMessage[]; onDone: () => void }) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { threadId },
        headers: async (): Promise<Record<string, string>> => {
          const { data } = await supabase.auth.getSession();
          return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
        },
      }),
    [threadId],
  );
  const { messages, sendMessage, status, stop, error } = useChat({ id: threadId, messages: initial, transport, onFinish: onDone });

  useEffect(() => { if (error) toast.error(error.message || "Something went wrong"); }, [error]);
  useEffect(() => { if (status === "ready") document.querySelector<HTMLTextAreaElement>("textarea[name=message]")?.focus(); }, [status]);

  return (
    <>
      <Conversation>
        <ConversationContent className="mx-auto w-full max-w-3xl">
          {messages.length === 0 ? (
            <ConversationEmptyState title="Ask about your nutrition" description="I can see your goals, recent food logs and weigh-ins.">
              <div className="space-y-3 text-center">
                <h3 className="font-display text-lg font-semibold">Ask about your nutrition</h3>
                <p className="text-sm text-muted-foreground">I can see your goals, recent food logs and weigh-ins.</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => <Button key={s} variant="outline" size="sm" onClick={() => sendMessage({ text: s })}>{s}</Button>)}
                </div>
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent className="group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground">
                  {m.parts.map((p, i) => (p.type === "text" ? (m.role === "assistant" ? <MessageResponse key={i}>{p.text}</MessageResponse> : <p key={i} className="whitespace-pre-wrap">{p.text}</p>) : null))}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && <Shimmer>Looking at your logs…</Shimmer>}
          {error && <p className="text-sm text-destructive">{error.message}</p>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="mx-auto w-full max-w-3xl p-3">
        <PromptInput onSubmit={({ text }) => { if (text.trim()) sendMessage({ text }); }}>
          <PromptInputTextarea name="message" autoFocus placeholder="Ask a nutrition question…" />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </>
  );
}
