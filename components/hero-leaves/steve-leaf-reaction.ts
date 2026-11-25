import { leafObservation, localLeafObservations, reactionKey } from "@/data/companion-contract";
import { delay } from "../companions/effects";
import { actorFor, companionsReserved, currentSection, visibleBox, type Actor } from "../companions/runtime";
import { leafProgress, saveLeaves } from "./leaf-pile";

const thresholds = [4, 8, 12, 16];
const cooldown = 90000;
const interactive = "a, button, input, textarea, select, [contenteditable]";

function bubbleWidth() { return innerWidth <= 700 ? 142 : 154; }

function bubblePosition(hero: HTMLElement, steve: DOMRect, height = 68) {
  const width = bubbleWidth();
  const compact = innerWidth <= 700;
  const viewportBottom = innerHeight - (compact ? 70 : 8);
  const center = steve.left + steve.width / 2;
  const choices = [
    { left: steve.right + 9, top: steve.top - height + 12, side: "left" },
    { left: steve.left - width - 9, top: steve.top - height + 12, side: "right" },
    ...[9, 28, 48].flatMap(gap => [0, -10, 10, -25, 25].map(offset => ({
      left: center - width / 2 + offset, top: steve.top - height - gap, side: "middle",
    }))),
  ];
  const blocks = [...hero.querySelectorAll(interactive),
    ...document.querySelectorAll(".theme-lantern, .selector-window, .mobile-selector, .site-header .brand")]
    .map(control => control.getBoundingClientRect()).filter(rect => rect.width && rect.height);
  const range = document.createRange();
  for (const copy of hero.querySelectorAll(".portfolio-reveal :is(h1,p)")) {
    range.selectNodeContents(copy);
    blocks.push(...Array.from(range.getClientRects()));
  }
  return choices.find(({ left, top }) =>
    left >= 8 && top >= 12 && left + width <= document.documentElement.clientWidth - 8 && top + height <= viewportBottom &&
    blocks.every(box => left + width + 4 < box.left || left - 4 > box.right || top + height + 4 < box.top || top - 4 > box.bottom));
}

function activity(steve: Actor) {
  const phase = steve.platform.dataset.phase;
  if (phase === "mine" || phase === "collect") return "mining";
  return phase && phase !== "portal" ? "exploring" : "idle";
}

async function observation(steve: Actor, height: number, threshold: number, signal: AbortSignal) {
  const state = leafProgress();
  const recent = new Set(state.recent.map(reactionKey));
  if ((threshold === 4 || threshold === 16) && state.requests < 2) {
    state.requests++;
    saveLeaves();
    try {
      const mario = actorFor("mario")?.sprite.getBoundingClientRect();
      const here = steve.sprite.getBoundingClientRect();
      const response = await fetch("/api/companions/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.any([signal, AbortSignal.timeout(2300)]),
        body: JSON.stringify({
          height, section: currentSection(steve), recent: state.recent,
          marioNearby: Boolean(mario && visibleBox(mario) && Math.hypot(here.x - mario.x, here.y - mario.y) < 260),
          steveActivity: activity(steve),
        }),
      });
      if (response.ok) {
        const result = leafObservation.safeParse(await response.json());
        if (result.success && !recent.has(reactionKey(result.data.text))) return result.data.text;
      }
    } catch { /* An offline or limited planner leaves the local observations available. */ }
  }
  const local = localLeafObservations.filter(text => !recent.has(reactionKey(text)));
  return local[Math.floor(Math.random() * local.length)];
}

export function startSteveLeafReaction(bubble: HTMLElement, tray: SVGSVGElement) {
  const hero = bubble.parentElement!;
  const state = leafProgress();
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let timer = 0, height = 0, lastInput = -Infinity;
  let active: AbortController | null = null;
  let disposed = false;
  const canReact = () => !disposed && !document.hidden && !motion.matches && height > 4;
  const pending = () => thresholds.find(value => (value === 4 ? height > value : height >= value) && !state.seen.includes(value));

  function schedule(wait = 450) {
    if (timer || active || !canReact() || pending() === undefined) return;
    timer = window.setTimeout(() => {
      timer = 0;
      check();
    }, Math.max(wait, state.reactedAt + cooldown - Date.now()));
  }

  function check() {
    const threshold = pending();
    if (!canReact() || threshold === undefined) return;
    if (companionsReserved() || performance.now() - lastInput < 1100 ||
      document.activeElement?.matches(":is(input,textarea,select,[contenteditable],a,button):focus-visible")) {
      schedule(1000);
      return;
    }
    const steve = actorFor("steve");
    if (!steve?.ready() || !hero.contains(steve.platform)) { schedule(950); return; }
    const sprite = steve.sprite.getBoundingClientRect();
    const floor = tray.getBoundingClientRect();
    const gap = Math.max(floor.left - sprite.right, sprite.left - floor.right, 0);
    if (!visibleBox(sprite) || Math.abs(floor.bottom - sprite.bottom) > 3 || gap > 340) {
      // Scrolling or a new visible pile measurement can make the reaction eligible again.
      return;
    }
    if (!bubblePosition(hero, sprite)) return;
    void react(steve, floor, threshold);
  }

  async function react(steve: Actor, floor: DOMRect, threshold: number) {
    const control = new AbortController();
    active = control;
    const { signal } = control;
    const button = steve.control;
    const facing = button.style.getPropertyValue("--facing");
    const actor = steve.sprite.getBoundingClientRect();
    button.style.setProperty("--facing", floor.left + floor.width / 2 < actor.left + actor.width / 2 ? "-1" : "1");
    button.dataset.reaction = "leaves";
    try {
      const text = await observation(steve, height, threshold, signal);
      signal.throwIfAborted();
      const gauge = bubble.cloneNode(false) as HTMLElement;
      gauge.removeAttribute("role");
      gauge.setAttribute("aria-hidden", "true");
      gauge.style.visibility = "hidden";
      gauge.textContent = text;
      hero.append(gauge);
      const measuredHeight = gauge.getBoundingClientRect().height + 3;
      gauge.remove();
      const position = bubblePosition(hero, steve.sprite.getBoundingClientRect(), measuredHeight);
      if (!position) return;
      const heroBox = hero.getBoundingClientRect();
      bubble.style.left = `${Math.round(position.left - heroBox.left)}px`;
      bubble.style.top = `${Math.round(position.top - heroBox.top)}px`;
      bubble.dataset.side = position.side;
      bubble.style.setProperty("--tail-x", `${Math.round(actor.left + actor.width / 2 - position.left - 2)}px`);
      bubble.textContent = text;
      state.seen.push(threshold);
      state.recent = [...state.recent, text].slice(-3);
      state.reactedAt = Date.now();
      saveLeaves();
      await delay(3500, signal);
    } catch (error) {
      if (!signal.aborted) console.error("Steve’s leaf reaction could not play", error);
    } finally {
      bubble.textContent = "";
      delete button.dataset.reaction;
      if (facing) button.style.setProperty("--facing", facing);
      else button.style.removeProperty("--facing");
      active = null;
      schedule(1100);
    }
  }

  function cancel() {
    clearTimeout(timer);
    timer = 0;
    active?.abort();
  }
  function scroll() {
    lastInput = performance.now();
    if (active) active.abort();
    schedule(1150);
  }
  function interaction(event: Event) {
    if (event.target instanceof Element && event.target.closest(interactive)) scroll();
  }
  function reset() {
    cancel();
    schedule();
  }

  window.addEventListener("scroll", scroll, { passive: true });
  window.addEventListener("resize", reset);
  document.addEventListener("visibilitychange", reset);
  document.addEventListener("pointerdown", interaction, { passive: true });
  document.addEventListener("focusin", interaction);
  document.addEventListener("keydown", interaction);
  motion.addEventListener("change", reset);

  return {
    notify(next: number) {
      height = next;
      if (!canReact()) cancel();
      else schedule();
    },
    dispose() {
      disposed = true;
      cancel();
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", reset);
      document.removeEventListener("visibilitychange", reset);
      document.removeEventListener("pointerdown", interaction);
      document.removeEventListener("focusin", interaction);
      document.removeEventListener("keydown", interaction);
      motion.removeEventListener("change", reset);
    },
  };
}
