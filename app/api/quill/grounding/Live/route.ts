import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { concern } = await req.json();

  if (!concern) {
    return NextResponse.json(
      { status: "error", error: "Missing concern." },
      { status: 400 }
    );
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an offshore grounding and HSE reasoning assistant. " +
          "Do not invent legislation or cases. " +
          "Explain what matters most, what is uncertain, and what to pay attention to next. " +
          "Be calm, practical, and concise.",
      },
      {
        role: "user",
        content: concern,
      },
    ],
  });

  return NextResponse.json({
    status: "ok",
    reasoning: completion.choices[0].message.content,
  });
}