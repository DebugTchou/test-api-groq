"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type MsgRole = "system" | "user" | "assistant";
type Msg = { role: MsgRole; content: string; id: string };

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function Page() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [messages, setMessages] = useState<Msg[]>([
    { role: "system", content: "Tu es un assistant utile, clair et concis.", id: uid() },
    { role: "assistant", content: "Salut ! Écris-moi un message 🙂", id: uid() },
  ]);

  const visible = useMemo(() => messages.filter((m) => m.role !== "system"), [messages]);

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [visible, loading]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const next: Msg[] = [...messages, { role: "user", content: text, id: uid() }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      // ✅ Payload EXACT pour ton backend actuel: { messages }
      const payload = {
        messages: next.map(({ role, content }) => ({ role, content })),
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Erreur API (${res.status})`);

      const answer = (data?.text ?? "").toString() || "(réponse vide)";
      setMessages((prev) => [...prev, { role: "assistant", content: answer, id: uid() }]);
      queueMicrotask(() => inputRef.current?.focus());
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${err?.message || "Erreur"}`, id: uid() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function clear() {
    setMessages([
      { role: "system", content: "Tu es un assistant utile, clair et concis.", id: uid() },
      { role: "assistant", content: "Ok, on repart à zéro. Dis-moi 🙂", id: uid() },
    ]);
    setToast("Historique effacé");
    queueMicrotask(() => inputRef.current?.focus());
  }

  async function copyLastSafe() {
    const last = [...visible].reverse().find((m) => m.role === "assistant")?.content;
    if (!last) return setToast("Rien à copier");

    // ✅ ultra-safe : si clipboard indispo, on affiche un toast
    try {
      if (!("clipboard" in navigator)) throw new Error("Clipboard indisponible");
      await navigator.clipboard.writeText(last);
      setToast("Copié ✅");
    } catch {
      setToast("Copie non autorisée ici");
    }
  }

  function fillPrompt(p: string) {
    setInput(p);
    queueMicrotask(() => inputRef.current?.focus());
  }

  return (
    <main className="app">
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />

      <header className="topbar">
        <div className="brand">
          <div className="logo" aria-hidden />
          <div>
            <div className="title">Groq Chat</div>
            <div className="subtitle">Design premium • interactions • sans streaming</div>
          </div>
        </div>

        <div className="actions">
          <button className="btn ghost" onClick={copyLastSafe} title="Copier la dernière réponse">
            Copier
          </button>
          <button className="btn danger" onClick={clear}>
            Effacer
          </button>
        </div>
      </header>

      <div className="shell">
        <aside className="side">
          <div className="card">
            <div className="cardTitle">Raccourcis</div>
            <ul className="list">
              <li><b>Entrée</b> : envoyer</li>
              <li><b>Shift + Entrée</b> : nouvelle ligne</li>
              <li><b>Effacer</b> : reset conversation</li>
            </ul>
          </div>

          <div className="card">
            <div className="cardTitle">Prompts rapides</div>
            <div className="chips">
              <button className="chip" onClick={() => fillPrompt("Fais-moi un plan de projet en 5 points.")}>
                Plan projet
              </button>
              <button className="chip" onClick={() => fillPrompt("Explique-moi un concept compliqué comme si j’avais 10 ans.")}>
                ELI10
              </button>
              <button className="chip" onClick={() => fillPrompt("Donne-moi 10 idées de posts LinkedIn sur l’IA.")}>
                Idées
              </button>
              <button className="chip" onClick={() => fillPrompt("Résume ce sujet en 5 bullet points: ...")}>
                Résumé
              </button>
            </div>
          </div>

          <div className="card">
            <div className="cardTitle">Status</div>
            <div className="statusRow">
              <span className={loading ? "dot on" : "dot"} />
              <span className="muted">{loading ? "Génération..." : "Prêt"}</span>
            </div>
          </div>
        </aside>

        <section className="chat">
          <div className="chatHeader">
            <div className="chatHeaderLeft">
              <div className="chatTitle">Conversation</div>
              <div className="muted">Réponses stables (pas de streaming)</div>
            </div>
            <div className="chatHeaderRight">
              <span className="pill soft">{visible.length} messages</span>
            </div>
          </div>

          <div className="chatBody" ref={listRef}>
            {visible.map((m) => (
              <MessageBubble key={m.id} role={m.role} content={m.content} />
            ))}

            {loading && (
              <div className="typing">
                <span className="typingDot" />
                <span className="typingDot" />
                <span className="typingDot" />
                <span className="typingText">Groq réfléchit…</span>
              </div>
            )}
          </div>

          <div className="composer">
            <div className="composerInner">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Écris ton message… (Entrée pour envoyer)"
                className="textarea"
                rows={2}
              />
              <button className="btn primary" onClick={send} disabled={loading || !input.trim()}>
                Envoyer
              </button>
            </div>

            <div className="composerHint">
              Astuce : clique sur un prompt à gauche, ou fais <b>Entrée</b> pour envoyer.
            </div>
          </div>
        </section>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

function MessageBubble({ role, content }: { role: MsgRole; content: string }) {
  const isUser = role === "user";
  return (
    <div className={cx("row", isUser ? "rowUser" : "rowBot")}>
      <div className={cx("bubble", isUser ? "bubbleUser" : "bubbleBot")}>
        <div className="meta">
          <span className="who">{isUser ? "Toi" : "Groq"}</span>
        </div>
        <div className="text">{content}</div>
      </div>
    </div>
  );
}