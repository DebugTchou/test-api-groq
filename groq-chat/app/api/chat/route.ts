import Groq from "groq-sdk";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "GROQ_API_KEY manquante" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as { messages?: ChatMessage[] };
    const messages = body.messages;

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "Format invalide. { messages: [...] } attendu." },
        { status: 400 }
      );
    }

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages,
      temperature: 0.7,
    });

    const text =
      completion.choices?.[0]?.message?.content ?? "Réponse vide";

    return Response.json({ text });
  } catch (err: any) {
    return Response.json(
      { error: err?.message ?? "Erreur serveur" },
      { status: 500 }
    );
  }
}