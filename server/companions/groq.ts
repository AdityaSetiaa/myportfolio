const scope = globalThis as typeof globalThis & {
  portfolioCompanionBudget?: { contexts: Map<string, number>; day: number; count: number; nextRequest: number; pending: boolean };
};
const budget = scope.portfolioCompanionBudget ??= {
  contexts: new Map(), day: -1, count: 0, nextRequest: 0, pending: false,
};

const cooldowns = { behavior: 600000, leaves: 90000 };

function reserveRequest(visitor: string, purpose: keyof typeof cooldowns) {
  const now = Date.now();
  const day = Math.floor(now / 86400000);
  if (budget.day !== day) { budget.day = day; budget.count = 0; }
  const limit = Math.min(120, Math.max(1, Number(process.env.GROQ_DAILY_LIMIT) || 60));
  if (budget.pending || now < budget.nextRequest || budget.count >= limit) return false;
  for (const [key, expires] of budget.contexts) if (expires <= now) budget.contexts.delete(key);
  const context = `${purpose}:${visitor.slice(0, 96)}`;
  if (budget.contexts.has(context)) return false;
  budget.contexts.set(context, now + cooldowns[purpose]);
  budget.count++;
  budget.nextRequest = now + 15000;
  budget.pending = true;
  return true;
}

export function rejectCompanionRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Invalid origin" }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json({ error: "Expected JSON" }, { status: 415 });
  }
  return null;
}

export async function readCompanionInput(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder();
  let size = 0, json = "";
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 1024) {
        await reader.cancel();
        return null;
      }
      json += decoder.decode(chunk.value, { stream: true });
    }
    return JSON.parse(json + decoder.decode()) as unknown;
  } catch {
    return null;
  }
}

export async function askCompanion(request: Request, purpose: keyof typeof cooldowns, instruction: string, context: object) {
  const visitor = request.headers.get("x-vercel-forwarded-for")?.split(",").at(-1)?.trim() ?? "local";
  const key = process.env.GROQ_API_KEY;
  if (!key || request.signal.aborted || !reserveRequest(visitor, purpose)) return null;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(1800)]),
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        reasoning_effort: "low",
        max_completion_tokens: 240,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: instruction },
          { role: "user", content: JSON.stringify(context) },
        ],
      }),
    });
    if (response.status === 429) {
      const retry = response.headers.get("retry-after");
      const seconds = retry === null ? NaN : Number(retry);
      const delay = Number.isFinite(seconds) ? seconds * 1000 : retry ? Date.parse(retry) - Date.now() : NaN;
      budget.nextRequest = Date.now() + (Number.isFinite(delay) ? Math.max(15000, Math.min(delay, 3600000)) : 60000);
    }
    if (!response.ok) return null;
    const result = await response.json();
    return JSON.parse(result.choices[0].message.content) as unknown;
  } catch {
    return null;
  } finally {
    budget.pending = false;
  }
}
