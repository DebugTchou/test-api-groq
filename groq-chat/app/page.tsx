"use client";

import { useMemo, useState } from "react";

type Msg = { role: "user" | "assistant" | "system"; content: string };

export default function Page() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Msg[]>([
    { role: "system", content: "Tu es un assistant utile et concis." },
    { role: "assistant", content: "Salut ! Écris un message 🙂" },
  ]);

  const visible = useMemo(
    () => messages.filter((m) => m.role !== "system"),
    [messages]
  );

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur API");

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.text || "(réponse vide)" },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>Groq Chat</h1>

      <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, height: 420, overflow: "auto" }}>
        {visible.map((m, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <b>{m.role === "user" ? "Toi" : "Groq"}:</b>
            <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div>
            <b>Groq:</b> …
          </div>
        )}
      </div>

      <form onSubmit={send} style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ton message…"
          style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
        />
        <button disabled={loading} style={{ padding: "10px 14px", borderRadius: 10 }}>
          Envoyer
        </button>
      </form>
    </main>
  );
}