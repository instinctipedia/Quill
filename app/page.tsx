"use client"

import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Hello 👋</h1>
        <p className="mt-2 text-zinc-600">This is my app. I built this.</p>

        <div className="mt-6 flex gap-2">
          <input
            className="flex-1 rounded-lg border px-3 py-2"
            placeholder="Type something..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <button
            className="rounded-lg bg-zinc-900 px-4 py-2 text-white font-medium"
          >
            Submit
          </button>
        </div>
      </div>
    </main>
  );
}