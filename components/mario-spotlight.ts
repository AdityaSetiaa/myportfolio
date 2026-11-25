import { activeSpotlight, spotlightKey, type MarioSpotlight, type SpotlightFeed } from "@/data/mario-spotlight";
import { between } from "./companions/behavior";
import { animate, delay } from "./companions/effects";

const sessionKey = "mario-spotlight-visits";
const visitLimit = 2;

export function spotlightVisits() {
  let ids: string[] = [];
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(sessionKey) ?? "[]");
    if (Array.isArray(saved)) ids = saved.filter((id): id is string => typeof id === "string").slice(0, visitLimit);
  } catch { /* Browsing without storage still keeps a per-page limit. */ }

  return {
    has(update: MarioSpotlight) { return ids.length >= visitLimit || ids.includes(spotlightKey(update)); },
    add(update: MarioSpotlight) {
      ids.push(spotlightKey(update));
      try { sessionStorage.setItem(sessionKey, JSON.stringify(ids)); } catch { /* Keep the in-memory count. */ }
    },
    get full() { return ids.length >= visitLimit; },
  };
}

export function readSpotlightFeed(onFeed: (feed: SpotlightFeed) => void, motion: MediaQueryList, finished: () => boolean) {
  let timer = 0;
  let request: AbortController | null = null;
  let interval = 45000;
  let disposed = false;
  const canPoll = () => !disposed && !document.hidden && !motion.matches && !finished();

  function stop() {
    window.clearTimeout(timer);
    request?.abort();
    request = null;
  }

  async function refresh() {
    if (!canPoll() || request) return;
    window.clearTimeout(timer);
    const control = new AbortController();
    request = control;
    try {
      const response = await fetch("/api/mario-spotlights", { signal: AbortSignal.any([control.signal, AbortSignal.timeout(6000)]) });
      if (!response.ok || control.signal.aborted) return;
      const feed: SpotlightFeed = await response.json();
      if (control.signal.aborted || !Array.isArray(feed.updates)) return;
      interval = feed.pollEvery;
      onFeed(feed);
    } catch {
      // Keep the previous feed until its timestamps expire.
    } finally {
      if (request === control) {
        request = null;
        if (canPoll()) timer = window.setTimeout(refresh, interval);
      }
    }
  }

  function sync() {
    if (canPoll()) void refresh();
    else stop();
  }

  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
  sync();
  return () => {
    disposed = true;
    stop();
    document.removeEventListener("visibilitychange", sync);
    motion.removeEventListener("change", sync);
  };
}

export function spotlightPlatformRank(slot: HTMLElement, update: MarioSpotlight) {
  const area = slot.closest<HTMLElement>(".portfolio-sections > section[id], [data-mario-area]");
  const name = area?.dataset.marioArea ?? area?.id;
  const project = slot.closest<HTMLElement>("[data-mario-project]")?.dataset.marioProject;
  const heroDivider = slot.parentElement === area && area?.previousElementSibling?.id === "home";

  if (update.project && project === update.project) return 4;
  if (update.section === "hero") return heroDivider ? 3 : name === "home" ? 1 : 0;
  if (name !== update.section) return 0;
  return slot.parentElement === area ? 3 : project ? 1 : 2;
}

export type SpotlightDestination = { slot: HTMLElement; update: MarioSpotlight };

export function chooseSpotlight(feed: SpotlightFeed, visible: Set<HTMLElement>, seen: (update: MarioSpotlight) => boolean) {
  const now = Date.now();
  const freshness = (update: MarioSpotlight) => Number(now - update.publishedAt <= feed.freshFor);
  const updates = feed.updates.filter(update => activeSpotlight(update, now) && !seen(update))
    .sort((a, b) => freshness(b) - freshness(a) || b.publishedAt - a.publishedAt);
  for (const update of updates) {
    let best: SpotlightDestination | null = null;
    let bestRank = 0;
    for (const slot of visible) {
      const rank = spotlightPlatformRank(slot, update);
      if (!slot.isConnected || rank < bestRank || rank === 0) continue;
      if (rank > bestRank || slot.clientWidth > (best?.slot.clientWidth ?? 0)) {
        best = { slot, update };
        bestRank = rank;
      }
    }
    if (best) return best;
  }
  return null;
}

export type SpotlightEncounter = {
  update: MarioSpotlight;
  platform: HTMLElement;
  signal: AbortSignal;
  canTravel: boolean;
  accept: (promise: Promise<void>) => void;
};

export async function walkSpotlight(
  visitor: HTMLElement, sprite: HTMLElement, slot: HTMLElement, update: MarioSpotlight, feed: SpotlightFeed,
  distance: number, signal: AbortSignal, phase: (name: string) => void,
) {
  const facing = Math.sign(distance) || 1;
  const length = Math.abs(distance);
  const speed = length < 125 ? 50 : 72;
  const duration = between(feed.visitMin, feed.visitMax);
  const deadline = performance.now() + Math.min(duration, Math.max(0, update.until - Date.now()));
  let position = 0;

  async function step(next: number) {
    if (next === position) return;
    const direction = next > position ? facing : -facing;
    visitor.style.setProperty("--facing", String(direction));
    sprite.dataset.pose = Math.abs(next - position) > 90 && Math.random() < .23 ? "running" : "walking";
    const point = (x: number) => ({ transform: `translateX(${x * facing}px)` });
    await animate(visitor, [point(position), point(next)], Math.abs(next - position) / speed * (sprite.dataset.pose === "running" ? 760 : 1000), signal, "linear");
    position = next;
  }

  let first = true;
  while (true) {
    const remaining = deadline - performance.now();
    if (remaining < 1250) break;
    // Leave room to turn and retrace the walk before the spotlight expires.
    const rest = first ? update.project && remaining > 14500 ? 7500 : 2300 : 900;
    const reach = Math.min(length, (remaining - rest) * speed / 2000);
    if (reach < 24) break;
    if (first) {
      await step(reach * between(.36, .64));
      phase("spotlight-paused");
      sprite.dataset.pose = "looking";
      const body = visitor.getBoundingClientRect();
      const block = document.querySelector(".scene-target")?.getBoundingClientRect();
      const hop = Math.min(10, slot.clientHeight - visitor.clientHeight);
      const nearBlock = block && Math.abs(block.bottom - body.top) <= hop &&
        body.left < block.right + 12 && body.right > block.left - 12;
      if (hop > 3 && (nearBlock || Math.random() < .46)) {
        sprite.dataset.pose = "jumping";
        await animate(visitor, [{ translate: "0 0" }, { translate: `0 -${hop}px` }, { translate: "0 0" }], 360, signal);
        sprite.dataset.pose = "looking";
      }

      let reaction: Promise<void> | undefined;
      const detail: SpotlightEncounter = {
        update, platform: slot, signal,
        canTravel: !!update.project && deadline - performance.now() - (2 * reach - position) / speed * 1000 > 5600,
        accept: result => { reaction = result; },
      };
      window.dispatchEvent(new CustomEvent("companion-spotlight", { detail }));
      await (reaction ?? delay(between(1050, 2200), signal));
      signal.throwIfAborted();
      first = false;
    }
    phase("spotlight-walking");
    await step(reach);
    phase("spotlight-turning");
    sprite.dataset.pose = Math.random() < .5 ? "turning" : "looking";
    await delay(Math.min(between(600, 1500), Math.max(300, deadline - performance.now() - reach / speed * 1000)), signal);
    phase("spotlight-walking");
    await step(0);
  }
  sprite.dataset.pose = "idle";
}
