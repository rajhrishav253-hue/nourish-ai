import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import type { Database, Json } from "@/integrations/supabase/types";

const RUN_HEADER = "X-Lovable-AIG-Run-ID";

function json(status: number, error: string) {
  return new Response(JSON.stringify({ error }), { status, headers: { "content-type": "application/json" } });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return json(401, "Please sign in again.");
        const url = process.env["SUPABASE_URL"]!;
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return json(500, "AI is not configured.");
        const supabase = createClient<Database>(url, key, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: claims } = await supabase.auth.getClaims(token);
        const userId = claims?.claims?.sub;
        if (!userId) return json(401, "Please sign in again.");

        const { threadId, messages } = (await request.json()) as { threadId: string; messages: UIMessage[] };
        const { data: thread } = await supabase.from("chat_threads").select("id,title").eq("id", threadId).maybeSingle();
        if (!thread) return json(404, "Conversation not found.");

        const last = messages[messages.length - 1];
        if (last?.role === "user") {
          const { error } = await supabase.from("chat_messages").upsert(
            { thread_id: threadId, ui_id: last.id, role: "user", message: last as unknown as Json },
            { onConflict: "thread_id,ui_id" },
          );
          if (error) console.error("save user msg", error);
          if (thread.title === "New chat" || !thread.title) {
            const text = last.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ").slice(0, 60);
            await supabase.from("chat_threads").update({ title: text || "New chat", updated_at: new Date().toISOString() }).eq("id", threadId);
          }
        }

        // Context: profile, last 7 days of logs, recent weights
        const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
        const [profile, logs, weights] = await Promise.all([
          supabase.from("profiles").select("name,age,gender,height_cm,weight_kg,target_weight_kg,goal,diet_pref,restrictions,likes,dislikes,calorie_target,protein_target,carb_target,fat_target,fiber_target,water_target_ml").eq("id", userId).maybeSingle(),
          supabase.from("food_logs").select("log_date,meal_type,food_name,quantity,unit,grams,kcal,protein,carbs,fat,fiber").gte("log_date", since).order("log_date"),
          supabase.from("weight_logs").select("log_date,weight_kg").order("log_date", { ascending: false }).limit(10),
        ]);
        const today = new Date().toISOString().slice(0, 10);
        const instructions = `You are NutriTrack Coach, a friendly, practical nutrition guide. Give concise, specific guidance grounded in the user's actual data below. Use markdown with short bullets. Never give medical diagnoses; suggest a professional for medical concerns. Today is ${today}.

USER PROFILE & DAILY GOALS:
${JSON.stringify(profile.data ?? {})}

FOOD LOGS (last 7 days):
${JSON.stringify(logs.data ?? [])}

RECENT WEIGH-INS (newest first):
${JSON.stringify(weights.data ?? [])}`;

        let runId = request.headers.get(RUN_HEADER) ?? undefined;
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: async (input, init) => {
            const headers = new Headers(init?.headers);
            if (runId) headers.set(RUN_HEADER, runId);
            const res = await fetch(input, { ...init, headers });
            runId ??= res.headers.get(RUN_HEADER) ?? undefined;
            return res;
          },
        });

        const result = streamText({
          model: provider.responses("openai/gpt-6-astra"),
          instructions,
          messages: await convertToModelMessages(messages),
          abortSignal: request.signal,
          providerOptions: {
            openai: {
              store: false,
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              include: ["reasoning.encrypted_content"],
            },
          },
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ responseMessage }) => {
            const { error } = await supabase.from("chat_messages").upsert(
              { thread_id: threadId, ui_id: responseMessage.id, role: "assistant", message: responseMessage as unknown as Json },
              { onConflict: "thread_id,ui_id" },
            );
            if (error) console.error("save assistant msg", error);
            await supabase.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
          },
          onError: (e) => {
            const status = (e as { statusCode?: number })?.statusCode;
            if (status === 402) return "AI credits have run out. Please add credits to keep using the coach.";
            if (status === 429) return "Too many requests right now. Please wait a moment and try again.";
            console.error(e);
            return "The coach couldn't answer right now. Please try again.";
          },
        });
      },
    },
  },
});
