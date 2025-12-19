export const runtime = "nodejs";

import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { Messages } from "@/db/repository";
import { Role } from "@/db/roles";

export async function POST(req: Request) {
  try {
    const { messages, threadId } = await req.json();

    if (!threadId) {
      return new Response(
        JSON.stringify({ error: "threadId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1️⃣ Oxirgi user messageni DB ga yozish
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === "user") {
      Messages.create(threadId, Role.User, lastMessage.content);
    }

    // 2️⃣ AI model
    const model = openai("gpt-4o-mini");

    // 3️⃣ Streaming javob
    const result = streamText({
      model,
      messages,
      async onFinish({ text }) {
        // 4️⃣ AI javobini DB ga yozish
        Messages.create(threadId, Role.Assistant, text);
      },
    });

    // 5️⃣ Stream response
    return result.toTextStreamResponse();

  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
