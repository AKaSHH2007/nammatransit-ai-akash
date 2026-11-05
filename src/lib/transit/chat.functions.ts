
import { GoogleGenAI } from "@google/genai";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { respond, type Context } from "./engine";

const HistorySchema = z
  .array(
    z.object({
      role: z.enum(["user", "assistant"]),
      text: z.string().max(4000),
    }),
  )
  .max(16)
  .default([]);

export const sendChat = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        message: z.string().min(1).max(1000),
        context: z.record(z.any()).default({}),
        history: HistorySchema,
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const context = data.context as Context;
    const localReply = respond(data.message, context);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing from the server environment.");

      return {
        ...localReply,
        reply: "Gemini API key is missing. Check your .env configuration.",
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const conversationHistory = data.history.map((item) => ({
        role: item.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: item.text }],
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: [
          ...conversationHistory,
          {
            role: "user",
            parts: [
              {
                text: `
USER QUESTION:
${data.message}

CURRENT JOURNEY CONTEXT:
${JSON.stringify(localReply.context)}

EXISTING TRANSPORT ENGINE RESPONSE:
${localReply.reply}

Use the transport engine response as supporting information.
Do not treat demo information as official or live.
Never invent routes, fares, timings or service status.
`,
              },
            ],
          },
        ],
        config: {
          systemInstruction: `
You are NammaTransit AI, an intelligent and friendly conversational assistant for Chennai, India.

YOUR ABILITIES:
1. Understand normal human conversations.
2. Answer general knowledge questions.
3. Help plan Chennai public transport journeys.
4. Explain Metro, MTC buses and suburban trains.
5. Understand follow-up questions using conversation history.
6. Help draft transport complaints.

CONVERSATION RULES:
- Respond naturally and helpfully.
- Do not restrict yourself to predefined questions.
- Understand English and simple Tamil-English (Tanglish).
- Remember previous messages in the conversation.
- Understand references such as "there", "that station", "cheaper option" and "how long?"
- Ask for clarification when necessary.
- Do not repeat your introduction.

TRANSPORT ACCURACY:
- The current app has a sample Metro dataset.
- Demo fares and simulated alerts are not official live information.
- MTC bus and Southern Railway GTFS data are not yet integrated.
- Never invent bus numbers, train schedules, fares, delays or live locations.
- Clearly explain when verified information is unavailable.
- Never claim that a ticket or complaint has been submitted.

RESPONSE STYLE:
- Use simple, understandable English.
- Keep answers concise but useful.
- Use numbered steps for journeys.
- Be friendly and practical.
- Answer unrelated general questions normally.
          `,
          temperature: 0.5,
          maxOutputTokens: 1000,
        },
      });

      return {
        ...localReply,
        reply:
          response.text?.trim() ||
          "Sorry, I couldn't generate a response. Please try again.",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      console.error("GEMINI DEBUG ERROR:", errorMessage);

      return {
        ...localReply,
        reply: `Gemini API error: ${errorMessage}`,
      };
    }
  });
