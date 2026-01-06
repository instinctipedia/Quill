"use client";

import { NextRequest, NextResponse } from "next/server";

type SupportRequest = {
  text: string;
};

type SupportResponse = {
  reply: string;
  follow_up_question?: string;
  error?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SupportRequest;
    const { text } = body;

    // Dummy logic for demonstration; replace with real support logic or API call
    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "No concern text provided." },
        { status: 400 }
      );
    }

    // Example: simple echo with a follow-up
    const reply = `Thanks for sharing: "${text.slice(0, 120)}"${
      text.length > 120 ? "..." : ""
    }`;
    const follow_up_question =
      "Can you tell me a bit more about what led up to this?";

    const response: SupportResponse = {
      reply,
      follow_up_question,
    };

    return NextResponse.json(response);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}