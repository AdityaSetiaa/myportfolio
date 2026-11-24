import { names, otherCharacter, type Character } from "../../data/companion-contract";
import { actorFor, visibleBox } from "./runtime";
import { landing, originPipe } from "./geometry";
import { animate, avatar, delay, mark } from "./effects";

type Line = { speaker: Character; text: string };
type Stage = { layer: HTMLElement; signal: AbortSignal; speak: (line: Line | null) => void };

function discoveryUnlocked() {
  try { return sessionStorage.getItem("companion-together") === "1"; } catch { return false; }
}

function groundPositions(target: DOMRect, source: DOMRect, platform: HTMLElement, discovery: boolean) {
  let first: { spot: NonNullable<ReturnType<typeof landing>>; ore: null } | null = null;
  for (const side of [1, -1]) {
    const spot = landing(target, source, platform, 12, side);
    if (!spot) continue;
    const guest = new DOMRect(spot.x, spot.y, source.width, source.height);
    if (!visibleBox(guest)) continue;
    first ??= { spot, ore: null };
    if (!discovery) return first;
    const ore = discovery ? landing(guest, new DOMRect(0, 0, 14, 16), platform, 3, side) : null;
    if (ore) return { spot, ore };
  }
  return first;
}

export function canCall(caller: Character) {
  const receiver = actorFor(caller);
  const traveler = actorFor(otherCharacter(caller));
  if (!receiver?.ready() || !traveler?.ready()) return false;
  const target = receiver.sprite.getBoundingClientRect();
  const source = traveler.sprite.getBoundingClientRect();
  if (!visibleBox(target) || !groundPositions(target, source, receiver.platform, false)) return false;
  return caller !== "steve" || !visibleBox(source) || originPipe(source, traveler.platform) !== null;
}

export async function travelTo(caller: Character, { layer, signal, speak }: Stage, dialogue?: () => Promise<Line[]>) {
  const receiver = actorFor(caller);
  const guest = otherCharacter(caller);
  const traveler = actorFor(guest);
  if (!receiver?.ready() || !traveler?.ready()) return false;
  const target = receiver.sprite.getBoundingClientRect();
  const source = traveler.sprite.getBoundingClientRect();
  const positions = groundPositions(target, source, receiver.platform, caller === "mario" && !discoveryUnlocked());
  if (!visibleBox(target) || !positions) return false;
  const { spot, ore: discovery } = positions;
  const host = receiver.sprite.parentElement;
  const oldFacing = host?.style.getPropertyValue("--facing") ?? "";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const liveSource = visibleBox(source);
  const compact = matchMedia("(max-width: 700px)").matches;
  const origin = guest === "mario" && liveSource ? originPipe(source, traveler.platform) : null;
  if (guest === "mario" && liveSource && origin === null) return false;
  speak({ speaker: caller, text: discovery ? "Hey Steve, I found ore on this ledge!" : `${names[guest]}, come check this out!` });
  const stage = avatar(layer, traveler.sprite, source, guest);
  const { element } = stage;
  const face = (direction: number) => {
    element.style.setProperty("--facing", String(direction));
    element.dataset.facing = String(direction);
  };
  const move = (x: number, y: number) => `translate3d(${x - source.x}px, ${y - source.y}px, 0)`;
  const place = move(spot.x, spot.y);
  const atOrigin = { transform: move(source.x, source.y) };
  function pipe(x: number, y: number) {
    const p = mark(layer, "companion-pipe", x, y - source.height * 1.15);
    p.style.width = `${source.width}px`;
    p.style.height = `${source.height * 1.15}px`;
    return p;
  }

  try {
    const ore = discovery ? mark(layer, "companion-ore", discovery.x, discovery.y) : null;
    await delay(reduced ? 120 : 280, signal);
    if (guest === "mario") {
      if (origin !== null && !reduced) {
        const entry = pipe(origin, source.bottom);
        face(Math.sign(origin - source.x));
        element.dataset.pose = "walking";
        const top = move(origin, source.y - source.height * 1.15);
        await animate(element, [atOrigin, { transform: move((origin + source.x) / 2, source.y - source.height * 1.28) }, { transform: top }], 520, signal);
        await animate(element, [{ opacity: 1, transform: top, clipPath: "inset(0)" },
          { opacity: 0, transform: move(origin, source.y + 2), clipPath: "inset(100% 0 0)" }], 290, signal);
        entry.remove();
      }
      element.style.opacity = "0";
      const approach = landing(target, source, receiver.platform, 30, spot.side);
      const entrySpot = approach && visibleBox(new DOMRect(approach.x, approach.y, source.width, source.height)) ? approach : spot;
      const exit = pipe(entrySpot.x, entrySpot.y + source.height);
      face(-spot.side);
      if (!reduced) {
        const rim = move(entrySpot.x, entrySpot.y - source.height * 1.15);
        await animate(element, [{ opacity: 0, transform: move(entrySpot.x, entrySpot.y), clipPath: "inset(0 0 100% 0)" },
          { opacity: 1, transform: rim, clipPath: "inset(0)" }], 360, signal);
        exit.remove();
        await animate(element, [{ transform: rim }, { transform: move(entrySpot.x, entrySpot.y) }], 200, signal);
        if (entrySpot !== spot) {
          element.dataset.pose = "walking";
          await animate(element, [{ transform: move(entrySpot.x, entrySpot.y) }, { transform: place }], 260, signal, "linear");
        }
      } else exit.remove();
    } else {
      face(Math.sign(spot.x - source.x) || 1);
      element.dataset.pose = "throwing";
      if (!reduced && liveSource) {
        const held = document.createElement("span");
        held.className = "companion-pearl companion-held-pearl";
        element.append(held);
        await delay(320, signal);
        held.remove();
      } else await delay(110, signal);
      const end = { x: spot.x + source.width / 2, y: spot.y + source.height - 3 };
      const start = liveSource
        ? { x: source.x + source.width / 2, y: source.y + source.height * .45 }
        : { x: end.x + (spot.side * 38), y: Math.max(8, end.y - 80) };
      if (!reduced) {
        const pearl = mark(layer, "companion-pearl", start.x, start.y);
        const dx = end.x - start.x, dy = end.y - start.y;
        const arc = Math.min(105, Math.max(22, Math.abs(dx) / 4));
        const trail = mark(layer, "companion-pearl-trail", start.x, start.y);
        const trajectory = (t: number) => `translate(${dx * t}px, ${dy * t - arc * 4 * t * (1 - t)}px)`;
        const steps = [0, .2, .4, .6, .8, 1];
        const flight = liveSource ? (compact ? 480 : 680) : 370;
        await Promise.all([
          animate(pearl, steps.map(t => ({ transform: trajectory(t) })), flight, signal, "linear"),
          animate(trail, steps.map(t => ({
            transform: trajectory(Math.max(0, t - .08)),
            opacity: Math.sin(Math.PI * t),
          })), flight, signal, "linear"),
        ]);
        pearl.remove();
        trail.remove();
        const burst = mark(layer, "companion-impact", end.x, end.y);
        await animate(burst, [{ opacity: 1, scale: ".35" }, { opacity: 0, scale: "1.8" }], 210, signal);
        burst.remove();
      } else {
        await delay(120, signal);
      }
      // The body moves only after the projectile reaches the selected platform.
      element.dataset.impact = "true";
      face(-spot.side);
    }
    element.style.transform = place;
    element.style.opacity = "1";
    element.style.clipPath = "none";
    element.dataset.pose = "wave";
    element.dataset.arrived = guest;
    host?.style.setProperty("--facing", String(spot.side));
    host?.setAttribute("data-companion-facing", String(spot.side));
    host?.classList.add("companion-wave");
    if (guest === "steve" && !reduced) {
      const arrival = mark(layer, "companion-impact", spot.x + source.width / 2, spot.y + source.height / 2);
      await animate(arrival, [{ opacity: 1, scale: ".45" }, { opacity: 0, scale: "1.65" }], 220, signal);
      arrival.remove();
    }

    const lines = [
      { speaker: guest, text: caller === "mario" ? "Pearl landed. What did you find?" : "I found you! What are we building?" },
      { speaker: caller, text: "Let’s take a look around together." },
    ];
    if (dialogue) {
      const aiLines = await dialogue();
      if (aiLines.length) lines.splice(0, lines.length, ...aiLines);
    }
    for (const line of lines) {
      speak(line);
      await delay(1150, signal);
    }
    if (ore && discovery) {
      face(spot.side);
      element.dataset.pose = "mining";
      speak({ speaker: "mario", text: "There’s ore right on this ledge!" });
      for (let hit = 1; hit <= 3; hit++) {
        await delay(260, signal);
        ore.dataset.hits = String(hit);
      }
      ore.remove();
      const gem = mark(layer, "companion-pearl companion-gem", discovery.x, discovery.y);
      if (!reduced) await animate(gem, [
        { translate: "0 0", opacity: 1 }, { translate: "0 -16px", opacity: 1, offset: .4 },
        { translate: `${spot.x + source.width / 2 - discovery.x}px -2px`, opacity: 0 },
      ], 420, signal);
      gem.remove();
      try { sessionStorage.setItem("companion-together", "1"); } catch { /* Storage can be disabled. */ }
      receiver.sprite.parentElement?.classList.add("companion-celebrate");
      speak({ speaker: "steve", text: "Better Together unlocked. We found a hidden diamond!" });
      await delay(1700, signal);
    }
    if (!reduced) await animate(element, [{ opacity: 1 }, { opacity: 0 }], 160, signal);
    return true;
  } finally {
    host?.classList.remove("companion-wave", "companion-celebrate");
    host?.removeAttribute("data-companion-facing");
    if (oldFacing) host?.style.setProperty("--facing", oldFacing);
    else host?.style.removeProperty("--facing");
    stage.restore();
    layer.replaceChildren();
    speak(null);
  }
}
