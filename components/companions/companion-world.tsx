"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { names, otherCharacter, type Character, type CompanionAction, type CompanionDecision, type CompanionRequest } from "../../data/companion-contract";
import { actorFor, availableActions, companionsReserved, conversationActive, reserveCompanions, sceneContext, setConversationActive, visibleBox } from "./runtime";
import { canCall, travelTo } from "./travel";
import { encounterGap } from "./geometry";
import { delay } from "./effects";
import "./companion-world.css";

type Message = CompanionRequest["history"][number];
type AIDecision = CompanionDecision & { source: "groq" | "local" };
type Speech = { speaker: Character; text: string; x: number; y: number };
type OpenDetail = { character: Character; anchor: HTMLElement };
type DividerDetail = { signal: AbortSignal; accept: (result: Promise<void>) => void };

async function ask(input: CompanionRequest, signal: AbortSignal): Promise<AIDecision> {
  const response = await fetch("/api/companions/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok) throw new Error("Companion request failed");
  return response.json();
}

function requestFor(character: Character, message: string, history: Message[], kind: CompanionRequest["kind"] = "chat"): CompanionRequest {
  return { character, message, history, available: availableActions(character), ...sceneContext(character), kind };
}

const clock = () => performance.now();

function visits(key: string, increment = false) {
  try {
    const count = Number(sessionStorage.getItem(`companion-${key}`)) || 0;
    if (increment) sessionStorage.setItem(`companion-${key}`, String(count + 1));
    return count;
  } catch {
    return 0;
  }
}

const introductions = {
  mario: "Hey! Want to explore Aditya’s projects?",
  steve: "Ask me about a project, its architecture, or the tools behind it.",
};
const suggestions = {
  mario: ["What does Aditya do?", "Tell me about SAPOMS"],
  steve: ["How does SAPOMS authentication work?", "Tell me about Trello Snap"],
};

export function CompanionWorld() {
  const [panel, setPanel] = useState<{ character: Character; x: number; y: number } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState("");
  const [speech, setSpeech] = useState<Speech | null>(null);
  const layer = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLElement>(null);
  const chat = useRef<AbortController | null>(null);
  const encounter = useRef<AbortController | null>(null);
  const cooldown = useRef(0);

  function speak(line: Omit<Speech, "x" | "y"> | null) {
    if (!line) { setSpeech(null); return; }
    const sprite = actorFor(line.speaker)?.sprite.getBoundingClientRect();
    if (!sprite || !visibleBox(sprite)) { setSpeech(null); return; }
    setSpeech({ ...line, x: Math.max(112, Math.min(innerWidth - 112, sprite.left + sprite.width / 2)), y: Math.max(60, sprite.top - 7) });
  }

  function close(restoreFocus = true) {
    chat.current?.abort();
    chat.current = null;
    setPanel(null);
    setPending(false);
    setConversationActive(false);
    if (restoreFocus) anchor.current?.focus({ preventScroll: true });
  }

  useEffect(() => {
    function open(event: Event) {
      if (companionsReserved()) return;
      const { character, anchor: button } = (event as CustomEvent<OpenDetail>).detail;
      chat.current?.abort();
      chat.current = null;
      anchor.current = button;
      setConversationActive(true);
      const rect = button.getBoundingClientRect();
      setPanel({ character, x: Math.min(Math.max(rect.left - 16, 12), innerWidth - 336), y: Math.min(Math.max(rect.top - 340, 12), innerHeight - 340) });
      setMessages([{ role: "assistant", text: introductions[character] }]);
      setPending(false);
      setDraft("");
      setNote("");
    }
    const cancelTravel = () => encounter.current?.abort();
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let lastScroll = 0;
    function scroll() {
      lastScroll = performance.now();
      cancelTravel();
      if (!conversationActive() || !anchor.current || visibleBox(anchor.current.getBoundingClientRect())) return;
      chat.current?.abort();
      chat.current = null;
      setPanel(null);
      setPending(false);
      setConversationActive(false);
    }
    function handleResize() {
      cancelTravel();
      if (!conversationActive() || !anchor.current) return;
      const r = anchor.current.getBoundingClientRect();
      setPanel(previous => previous && { ...previous, x: Math.min(Math.max(r.left - 16, 12), innerWidth - 336), y: Math.min(Math.max(r.top - 340, 12), innerHeight - 340) });
    }

    function startAmbient() {
      if (document.hidden || conversationActive() || encounter.current || visits("ambient") >= 1 ||
          performance.now() < cooldown.current || performance.now() - lastScroll < 400 ||
          matchMedia("(prefers-reduced-motion: reduce)").matches || !layer.current) return;
      const caller = canCall("steve") ? "steve" : canCall("mario") && sceneContext("mario").section === "home" ? "mario" : null;
      if (!caller || !actorFor(otherCharacter(caller)) || !visibleBox(actorFor(otherCharacter(caller))!.sprite.getBoundingClientRect())) return;
      const release = reserveCompanions();
      if (!release) return;
      const control = new AbortController();
      encounter.current = control;
      visits("ambient", true);
      void travelTo(caller, { layer: layer.current, signal: control.signal, speak }).catch(() => {}).finally(() => {
        encounter.current = null;
        cooldown.current = performance.now() + 21000;
        release();
      });
    }

    function natural(event: Event) {
      const { signal, accept } = (event as CustomEvent<DividerDetail>).detail;
      if (conversationActive() || encounter.current || performance.now() < cooldown.current ||
          performance.now() - lastScroll < 250 || document.hidden || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const mario = actorFor("mario"), steve = actorFor("steve");
      if (!mario || !steve?.ready()) return;
      const a = mario.sprite.getBoundingClientRect(), b = steve.sprite.getBoundingClientRect();
      const gap = encounterGap(a, b);
      if (Math.abs(a.bottom - b.bottom) > 2 || gap < 10 || gap > 185 || !visibleBox(a) || !visibleBox(b)) return;
      const release = reserveCompanions();
      if (!release) return;
      const control = new AbortController();
      encounter.current = control;
      const combined = AbortSignal.any([signal, control.signal]);
      const vis = mario.sprite.parentElement;
      vis?.style.setProperty("--facing", a.left < b.left ? "1" : "-1");
      vis?.classList.add("companion-wave");
      steve.control.classList.add("companion-wave");
      accept((async () => {
        try {
          speak({ speaker: "mario", text: "Hey Steve! We’re on the same ledge." });
          await delay(1150, combined);
          speak({ speaker: "steve", text: "Good eye. This divider makes a handy walking path." });
          await delay(1150, combined);
        } catch {
          // Both controllers resume when a visitor scrolls away.
        } finally {
          speak(null);
          vis?.classList.remove("companion-wave");
          steve.control.classList.remove("companion-wave");
          encounter.current = null;
          cooldown.current = performance.now() + 21000;
          release();
        }
      })());
    }
    const interval = window.setInterval(startAmbient, 34000);
    window.addEventListener("companion-open", open);
    window.addEventListener("companion-divider", natural);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", cancelTravel);
    motion.addEventListener("change", cancelTravel);
    return () => {
      clearInterval(interval);
      window.removeEventListener("companion-open", open);
      window.removeEventListener("companion-divider", natural);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", cancelTravel);
      motion.removeEventListener("change", cancelTravel);
      chat.current?.abort();
      cancelTravel();
      setConversationActive(false);
    };
  }, []);

  const openCharacter = panel?.character;
  useEffect(() => { if (openCharacter) input.current?.focus({ preventScroll: true }); }, [openCharacter]);
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [messages, pending]);

  async function launch(character: Character) {
    if (encounter.current || clock() < cooldown.current) { setNote("Give them a moment before another call."); return; }
    if (chat.current) { setNote("Let the current reply finish first."); return; }
    if (!layer.current || !canCall(character)) { setNote("They need a clear landing spot. Try again when both characters are free."); return; }
    const release = reserveCompanions();
    if (!release) return;
    const control = new AbortController();
    encounter.current = control;
    close(false);
    const contextual = ["projects", "skills", "education", "contact"].includes(sceneContext(character).section) && visits("encounters") < 2;
    let failure = "";
    try {
      const completed = await travelTo(character, { layer: layer.current, signal: control.signal, speak }, contextual ? async () => {
        visits("encounters", true);
        const result = await ask(requestFor(character, "Share a short observation about this portfolio section.", [], "encounter"),
          AbortSignal.any([control.signal, AbortSignal.timeout(2600)])).catch(() => null);
        return result?.source === "groq" && result.reply ? [{ speaker: character, text: result.dialogue }, { speaker: otherCharacter(character), text: result.reply }] : [];
      } : undefined);
      if (!completed) failure = "There’s no room to land on this ledge yet.";
    } catch {
      if (!control.signal.aborted) {
        failure = "The characters couldn’t reach the ledge.";
      }
    } finally {
      release();
      encounter.current = null;
      cooldown.current = clock() + 18000;
      if (failure) {
        openCompanionFromAnchor(character);
        setNote(failure);
      }
      if (anchor.current?.isConnected && document.activeElement === document.body) anchor.current.focus({ preventScroll: true });
    }
  }

  function openCompanionFromAnchor(character: Character) {
    if (anchor.current) window.dispatchEvent(new CustomEvent("companion-open", { detail: { character, anchor: anchor.current } }));
  }

  function perform(character: Character, action: CompanionAction) {
    if (!availableActions(character).includes(action)) return;
    const actor = actorFor(character);
    if (!actor) return;
    if (action === "JUMP" || action === "MINE") actor.perform();
    if ((action === "WAVE" || action === "GREET" || action === "CELEBRATE") && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      actor.sprite.animate([{ rotate: "-8deg" }, { rotate: "8deg" }, { rotate: "0deg" }], 360);
    }
    if (action === "CALL_MARIO" || action === "CALL_STEVE") void launch(character);
    if (action === "RESUME_EXPLORATION") close();
  }

  async function send(text: string) {
    if (!panel || chat.current || !text.trim()) return;
    if (visits("messages") >= 12) { setNote("This visit has reached its chat limit."); return; }
    const character = panel.character;
    const payload = requestFor(character, text.trim(), messages.slice(1).slice(-6));
    const control = new AbortController();
    chat.current = control;
    visits("messages", true);
    setPending(true);
    setNote("");
    setDraft("");
    setMessages(previous => [...previous, { role: "user", text: payload.message }]);
    try {
      const result = await ask(payload, control.signal);
      if (control.signal.aborted || result.character !== character) return;
      setMessages(previous => [...previous, { role: "assistant", text: result.dialogue }]);
      if (result.source === "local") setNote("Using the portfolio’s built-in answers while AI is unavailable.");
      chat.current = null;
      setPending(false);
      perform(character, result.action);
    } catch {
      if (!control.signal.aborted) setNote("The chat connection dropped. Try sending your question again.");
    } finally {
      if (chat.current === control) { chat.current = null; setPending(false); }
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(draft);
  }
  return <>
    <div ref={layer} className="companion-effects" aria-hidden="true" />
    {speech && <div className="companion-speech" style={{ left: speech.x, top: speech.y }} role="status"><strong>{names[speech.speaker]}</strong> {speech.text}</div>}
    {panel && <section className="companion-panel" role="dialog" aria-modal="false" aria-labelledby="companion-title"
      style={{ left: panel.x, top: panel.y }} onKeyDown={event => { if (event.key === "Escape") close(); }}>
      <header><strong id="companion-title"><span className="companion-portrait" data-character={panel.character} aria-hidden="true" />Talk to {names[panel.character]}</strong><button type="button" aria-label="Close conversation" onClick={() => close()}>×</button></header>
      <div className="companion-log" ref={log} role="log" aria-live="polite">
        {messages.map(({ role, text }, index) => <p key={index} data-role={role}>{text}</p>)}
        {pending && <p>Thinking…</p>}
      </div>
      <div className="companion-options">
        {messages.length < 3 && suggestions[panel.character].map(text =>
          <button key={text} type="button" disabled={pending} onClick={() => void send(text)}>{text}</button>)}
        <button type="button" disabled={pending} onClick={() => void launch(panel.character)}>Call {names[otherCharacter(panel.character)]}</button>
        <button type="button" onClick={() => actorFor(panel.character)?.perform()}>{panel.character === "mario" ? "Jump" : "Explore & mine"}</button>
      </div>
      <form onSubmit={submit}>
        <input ref={input} aria-label="Message" placeholder="Ask about the portfolio" value={draft}
          maxLength={450} onChange={event => setDraft(event.target.value)} />
        <button type="submit" disabled={pending || !draft.trim()}>Send</button>
      </form>
      {note && <p className="companion-note" role="status">{note}</p>}
    </section>}
  </>;
}
