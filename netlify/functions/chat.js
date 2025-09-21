// netlify/functions/chat.js
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "use POST" };
  }

  try {
    const { prompt } = JSON.parse(event.body || "{}");
    const apiKey = process.env.OPENAI_API_KEY;
    const assistantId = process.env.OPENAI_ASSISTANT_ID; // asst_xxx

    if (!apiKey) return { statusCode: 500, body: "falta OPENAI_API_KEY" };
    if (!assistantId) return { statusCode: 500, body: "falta OPENAI_ASSISTANT_ID" };

    const commonHeaders = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "assistants=v2",
    };

    // 1) crea thread con el mensaje del usuario
    let res = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: commonHeaders,
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt || "Hola 👋" }]
      })
    });
    let raw = await res.text();
    if (!res.ok) { console.error("threads error:", res.status, raw); return { statusCode: res.status, body: raw }; }
    const { id: threadId } = JSON.parse(raw);

    // 2) lanza run con tu assistant
    res = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: "POST",
      headers: commonHeaders,
      body: JSON.stringify({ assistant_id: assistantId })
    });
    raw = await res.text();
    if (!res.ok) { console.error("runs error:", res.status, raw); return { statusCode: res.status, body: raw }; }
    let run = JSON.parse(raw);

    // 3) polling hasta que termine
    for (let i = 0; i < 25 && (run.status === "queued" || run.status === "in_progress"); i++) {
      await sleep(600);
      const r2 = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
        headers: commonHeaders
      });
      const raw2 = await r2.text();
      if (!r2.ok) { console.error("poll error:", r2.status, raw2); return { statusCode: r2.status, body: raw2 }; }
      run = JSON.parse(raw2);
      if (run.status === "failed") { console.error("run failed:", raw2); return { statusCode: 500, body: raw2 }; }
    }

    // 4) leer mensajes del thread
    res = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: commonHeaders
    });
    raw = await res.text();
    if (!res.ok) { console.error("messages error:", res.status, raw); return { statusCode: res.status, body: raw }; }
    const msgs = JSON.parse(raw);

    const msg = msgs.data?.find(m => m.role === "assistant");
    const text = msg?.content?.[0]?.text?.value || "";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    };
  } catch (e) {
    console.error("ERROR assistants:", e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message, stack: e.stack }) };
  }
};
