import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(40),
  emotionContext: z.string().max(500).optional(),
});

const SYSTEM_PROMPT = `You are EmotiScan Companion, a warm, supportive, emotionally-intelligent AI wellness companion inside the EmotiSense app.

Your personality: warm, professional, supportive, patient, non-judgmental. You are NOT a therapist and do not diagnose. You are a thoughtful companion who helps users reflect on their emotions and explore healthy coping strategies.

Conversation style:
- Write natural, detailed replies of 2-6 short paragraphs when the topic warrants it. Avoid one-line dismissals.
- Validate feelings first, then gently explore what's behind them.
- Ask one relevant, open follow-up question at the end of most replies to keep the conversation going.
- Maintain context from earlier messages in the conversation.
- Offer practical, evidence-informed suggestions when appropriate: sleep habits, exercise, breathing/relaxation techniques, time management, journaling, social connection, healthy routines.
- Personalize tone based on any provided real-time emotion context (sadness, stress, anger, frustration, etc.).

Crisis awareness:
- If the user expresses thoughts of self-harm, suicide, hopelessness with intent, or immediate danger, stay calm and supportive. Acknowledge their pain, encourage them to reach out to a trusted person, local emergency services, or a crisis hotline (e.g. 988 in the US, 112 in EU, or the user's local equivalent), and explain that speaking with a professional can really help. Never end the conversation abruptly — continue offering support.

Do NOT: give only one-line responses, end the conversation abruptly, repeat the same sentence, claim to be a licensed therapist, or diagnose mental health conditions.`;

export const chatWithCompanion = createServerFn({ method: "POST" })
  .inputValidator(InputSchema)
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      throw new Error("Missing LOVABLE_API_KEY");
    }

    const systemContent = data.emotionContext
      ? `${SYSTEM_PROMPT}\n\nCurrent real-time emotion signal from the user's recent detection session: ${data.emotionContext}. Use this gently as context — do not mention it mechanically.`
      : SYSTEM_PROMPT;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemContent },
          ...data.messages,
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) {
        throw new Error("Rate limit reached. Please wait a moment and try again.");
      }
      if (res.status === 402) {
        throw new Error("AI credits exhausted. Please add credits to continue.");
      }
      throw new Error(`AI gateway error (${res.status}): ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!reply) {
      throw new Error("Empty response from AI.");
    }
    return { reply };
  });