export const runtime = "nodejs";

import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export async function POST(req: Request) {
    try {
        const { messages, threadId } = await req.json();

        if (!threadId || !messages?.length) {
            return new Response(
                JSON.stringify({ error: "Invalid request" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Clear and precise system prompt
        const systemPrompt = {
            role: "system" as const,
            content: `You are an AI assistant similar to ChatGPT. Follow these guidelines:

1. **ANSWER ACCURATELY**: Provide correct and fact-based responses
2. **BE CLEAR**: Explain concepts in simple, understandable language
3. **BE COMPLETE**: Give comprehensive answers with proper context
4. **USE PROPER FORMATTING**:
   - Code blocks: \`\`\`language\ncode\n\`\`\`
   - Inline code: \`code\`
   - Lists: Use numbered or bullet points as appropriate
   - Bold important terms: **important**
   - Links: [text](url)
   - Headings: Use #, ##, ### for organization

5. **IF YOU DON'T KNOW**: Admit when you don't have information instead of guessing
6. **BE HELPFUL**: Focus on solving the user's problem
7. **STAY ON TOPIC**: Address the specific question asked

Always respond in a professional, helpful manner. Use markdown formatting for better readability.`
        };

        const model = openai("gpt-4o-mini");

        const result = streamText({
            model,
            messages: [systemPrompt, ...messages],
            system: systemPrompt.content
        });

        return result.toTextStreamResponse();

    } catch (error) {
        console.error("Chat API error:", error);
        return new Response(
            JSON.stringify({ error: "AI service unavailable" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
