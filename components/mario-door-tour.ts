import type { SpotlightFeed } from "@/data/mario-spotlight";
import { between } from "./companions/behavior";
import { animate, delay } from "./companions/effects";
import { greetingReach } from "./companions/geometry";
import { actorFor, visibleBox } from "./companions/runtime";
import { marioPlatformSelector, marioTourArea, measureMarioPlatform } from "./mario-placement";
import { chooseSpotlight, readSpotlightFeed, spotlightVisits, walkSpotlight, type SpotlightDestination } from "./mario-spotlight";

type TourOptions = {
  enabled: boolean;
  spotlightOnly: boolean;
  lane: HTMLElement;
  runner: HTMLButtonElement;
  sprite: HTMLElement;
  door: HTMLElement;
  ready: () => boolean;
  resumeAt: (x: number) => void;
};

const settleTime = 210;


function swing(door: HTMLElement, open: boolean, signal: AbortSignal) {
  const leaf = door.querySelector<HTMLElement>(".mario-door-leaf")!;
  return animate(leaf, [{ transform: `scaleX(${open ? 1 : .12})` },
    { transform: `scaleX(${open ? .12 : 1})` }], 235, signal);
}

export function createDoorTour({ enabled, spotlightOnly, lane, runner, sprite, door, ready, resumeAt }: TourOptions) {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = matchMedia("(max-width: 700px)");
  const slots = new Set<HTMLElement>();
  const nearby = new Set<HTMLElement>();
  const visible = new Set<HTMLElement>();
  const visited = new Set<HTMLElement>();
  const limit = mobile.matches ? 2 : 3;
  let appearances = 0;
  let feed: SpotlightFeed | null = null;
  let nextCheck = 0;
  let spotlightDue = performance.now() + 4500;
  const spotlights = spotlightVisits();
  let armed: HTMLElement | null = null;
  let due = performance.now() + between(6500, 12000);
  let lastScroll = 0;
  let previousScrollY = window.scrollY;
  let scrollDirection = 1;
  let hiddenSince = 0;
  let hidden = false;
  let returningHome = false;
  let operation: AbortController | null = null;
  let destination: HTMLElement | null = null;
  let disposed = false;

  function phase(name: string) { lane.dataset.tour = name; }
  function headerX() {
    const rect = door.getBoundingClientRect();
    return rect.left + (rect.width - runner.offsetWidth) / 2 - lane.getBoundingClientRect().left;
  }
  function resetSprite() {
    for (const prop of ["clip-path", "scale", "opacity"]) sprite.style.removeProperty(prop);
  }
  function restoreHeader(x = headerX()) {
    if (sprite.parentElement !== runner) runner.append(sprite);
    resetSprite();
    returningHome = false;
    hidden = false;
    runner.style.visibility = "";
    door.querySelector<HTMLElement>(".mario-door-leaf")!.style.removeProperty("transform");
    delete lane.dataset.tour;
    if (!disposed) resumeAt(x);
  }
  function passage(enter: boolean, signal: AbortSignal) {
    const frames = [
      { clipPath: "inset(0 0%)", scale: "1", opacity: 1 },
      { clipPath: "inset(0 49%)", scale: ".68", opacity: 0 },
    ];
    return animate(sprite, enter ? frames : frames.reverse(), 420, signal);
  }
  function arm(slot: HTMLElement) {
    if (armed === slot || motion.matches) return;
    if (armed) clear(armed);
    armed = slot;
    const copy = door.cloneNode(true) as HTMLElement;
    copy.querySelector(".mario-door-leaf")?.removeAttribute("style");
    slot.append(copy);
    slot.dataset.armed = "";
  }
  function clear(slot: HTMLElement) {
    if (armed === slot) armed = null;
    slot.replaceChildren();
    delete slot.dataset.armed;
    delete slot.dataset.spotlight;
    slot.style.removeProperty("opacity");
  }

  async function depart(signal: AbortSignal) {
    const start = runner.getBoundingClientRect().left - lane.getBoundingClientRect().left;
    const goal = headerX();
    phase("approaching");
    sprite.dataset.pose = "walking";
    runner.style.setProperty("--facing", start > goal ? "-1" : "1");
    const centered = { transform: `translateX(${goal}px)` };
    await animate(runner, [{ transform: `translateX(${start}px)` }, centered], Math.max(100, Math.abs(goal - start) * 16), signal, "ease-out");
    sprite.dataset.pose = "idle";
    await delay(160, signal);
    phase("entering");
    await swing(door, true, signal);
    await passage(true, signal);
    runner.style.visibility = "hidden";
    hidden = true;
    await swing(door, false, signal);
    hiddenSince = performance.now();
    phase("hidden");
  }

  async function explore(slot: HTMLElement, signal: AbortSignal, spotlight?: SpotlightDestination, settings?: SpotlightFeed) {
    const guestDoor = slot.querySelector<HTMLElement>(".mario-door")!;
    const visitor = document.createElement("span");
    visitor.className = "mario-visitor";
    const facing = slot.dataset.side === "left" ? 1 : -1;
    if (!spotlight) {
      visited.add(slot);
      appearances++;
    }
    slot.append(visitor);
    visitor.append(sprite);
    const distance = Math.max(0, slot.getBoundingClientRect().width - visitor.getBoundingClientRect().width) * facing;
    const near = { transform: "translateX(0)" };
    visitor.style.setProperty("--facing", String(facing));
    try {
      sprite.dataset.pose = "idle";
      phase("exiting");
      await swing(guestDoor, true, signal);
      await passage(false, signal);
      if (spotlight && settings) {
        slot.dataset.spotlight = spotlight.update.project ?? spotlight.update.section;
        spotlights.add(spotlight.update);
        phase("spotlight-walking");
        await Promise.all([
          swing(guestDoor, false, signal),
          walkSpotlight(visitor, sprite, slot, spotlight.update, settings, distance, signal, phase),
        ]);
      } else {
        phase("exploring");
        const mario = sprite.getBoundingClientRect();
        const steve = actorFor("steve");
        const companion = steve?.ready() ? steve.sprite.getBoundingClientRect() : null;
        let travel = distance * between(.63, 1);
        if (companion && visibleBox(companion) && Math.abs(mario.bottom - companion.bottom) < 2) {
          const gap = facing > 0 ? companion.left - mario.right : mario.left - companion.right;
          if (gap > 25 && gap - Math.abs(distance) <= greetingReach) {
            travel = Math.min(gap - 25, Math.abs(distance)) * facing;
          }
        }
        const far = { transform: `translateX(${travel}px)` };
        const running = Math.abs(travel) > 125 && Math.random() < .3;
        const duration = Math.abs(travel) / (running ? 126 : 86) * 1000;
        sprite.dataset.pose = running ? "running" : "walking";
        await Promise.all([swing(guestDoor, false, signal), animate(visitor, [near, far], duration, signal, "linear")]);
        phase("turning");
        sprite.dataset.pose = "looking";
        let reaction: Promise<void> | undefined;
        window.dispatchEvent(new CustomEvent("companion-divider", { detail: {
          signal,
          accept: (result: Promise<void>) => { reaction = result; },
        } }));
        await (reaction ?? delay(between(1000, 3900), signal));
        signal.throwIfAborted();
        sprite.dataset.pose = "turning";
        visitor.style.setProperty("--facing", String(-facing));
        await delay(270, signal);
        phase("returning");
        sprite.dataset.pose = running ? "walking" : Math.random() < .35 ? "running" : "walking";
        await animate(visitor, [far, near], duration * (sprite.dataset.pose === "running" ? .72 : 1), signal, "linear");
      }
      sprite.dataset.pose = "idle";
      await swing(guestDoor, true, signal);
      await passage(true, signal);
      await swing(guestDoor, false, signal);
      await animate(slot, [{ opacity: 1 }, { opacity: 0 }], 200, signal);
    } finally {
      // Park the one sprite inside its hidden header button between destinations.
      if (!disposed) {
        runner.append(sprite);
        sprite.style.opacity = "0";
        clear(slot);
        hiddenSince = performance.now();
        phase(signal.aborted ? "scroll-interrupted" : "hidden");
      }
    }
  }
  async function comeHome(signal: AbortSignal) {
    phase("header-exit");
    sprite.dataset.pose = "idle";
    runner.style.transform = `translateX(${headerX()}px)`;
    await swing(door, true, signal);
    runner.style.visibility = "";
    await passage(false, signal);
    await swing(door, false, signal);
    restoreHeader();
    due = performance.now() + between(18000, 32000);
    spotlightDue = performance.now() + between(12000, 18000);
  }
  function start(task: (signal: AbortSignal) => Promise<void>) {
    const control = new AbortController();
    operation = control;
    void task(control.signal).catch(error => {
      if (!control.signal.aborted) {
        console.error("Mario door animation failed", error);
        restoreHeader();
        due = performance.now() + 20000;
      }
    }).finally(() => {
      operation = null;
      destination = null;
      if (!disposed && (document.hidden || motion.matches)) restoreHeader();
    });
  }

  const approach = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const slot = entry.target as HTMLElement;
      if (entry.isIntersecting) {
        nearby.add(slot);

      } else {
        nearby.delete(slot);
        if (slot === armed && slot !== destination) clear(slot);
      }
    }
  }, { rootMargin: "55% 0px" });
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const slot = entry.target as HTMLElement;
      if (entry.intersectionRatio >= .99) visible.add(slot);
      else {
        visible.delete(slot);
        if (slot === destination) operation?.abort();
      }
    }
  }, { threshold: [.99], rootMargin: mobile.matches ? "-104px 0px -80px" : "-12px 0px -16px" });

  function layout(slot: HTMLElement) {
    observer.unobserve(slot);
    approach.unobserve(slot);
    visible.delete(slot);
    nearby.delete(slot);
    clear(slot);
    if (measureMarioPlatform(slot, mobile.matches)) {
      observer.observe(slot);
      approach.observe(slot);
    }
  }
  function attachStops() {
    for (const slot of slots) {
      if (slot.isConnected) continue;
      observer.unobserve(slot);
      approach.unobserve(slot);
      slots.delete(slot);
      visible.delete(slot);
      nearby.delete(slot);
      visited.delete(slot);
      if (slot === destination) operation?.abort();
      if (slot === armed) armed = null;
    }
    for (const slot of document.querySelectorAll<HTMLElement>(marioPlatformSelector)) {
      if (slots.has(slot) || !slot.closest(marioTourArea)) continue;
      slots.add(slot);
      layout(slot);
    }

  }
  const mounts = new MutationObserver(attachStops);
  function onScroll() {
    scrollDirection = Math.sign(window.scrollY - previousScrollY) || scrollDirection;
    previousScrollY = window.scrollY;
    lastScroll = performance.now();
  }
  function suspend() {
    operation?.abort();
    if (!operation && hidden) restoreHeader();
    if (motion.matches) slots.forEach(slot => { if (slot !== destination) clear(slot); });

  }
  let layoutFrame = 0;
  function resize() {
    operation?.abort();
    cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(() => {
      if (!operation && hidden) restoreHeader();
      slots.forEach(slot => { if (slot !== destination) layout(slot); });
    });
  }
  const stopPolling = enabled ? readSpotlightFeed(next => { feed = next; }, motion, () => spotlights.full) : undefined;
  if (enabled) {
    mounts.observe(document.body, { childList: true, subtree: true, attributeFilter: ["data-ready"] });
    attachStops();
    void document.fonts.ready.then(() => { if (!disposed && !operation && !hidden) slots.forEach(layout); });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);
    motion.addEventListener("change", suspend);
    document.addEventListener("visibilitychange", suspend);
  }

  return {
    get busy() { return hidden || operation !== null; },
    check(now: number) {
      if (!enabled || disposed || operation || motion.matches || document.hidden || now < nextCheck) return;
      nextCheck = now + 140;
      if (!ready()) return;
      const normal = !spotlightOnly && appearances < limit && (hidden || now >= due);
      if (!hidden && !normal && (!feed?.updates.length || spotlights.full || now < spotlightDue)) return;
      if (now - lastScroll < settleTime) {
        if (normal && hidden && !returningHome && !armed) {
          const approaching = [...nearby].filter(slot => !visited.has(slot) && !visible.has(slot))
            .map(slot => {
              const bounds = slot.getBoundingClientRect();
              const distance = scrollDirection > 0 ? bounds.top - innerHeight : -bounds.bottom;
              return { slot, distance };
            }).filter(({ distance }) => distance >= 0)
            .sort((a, b) => a.distance - b.distance)[0]?.slot;
          if (approaching) arm(approaching);
        }
        return;
      }
      if (returningHome) { start(comeHome); return; }
      const spotlight = feed && !spotlights.full && now >= spotlightDue ? chooseSpotlight(feed, visible, spotlights.has) : null;
      if (spotlight) arm(spotlight.slot);
      else if (normal && (!armed || visited.has(armed) || !visible.has(armed))) {
        // Weight longer edges and favor the existing section dividers for ordinary tours.
        const weighted = [...visible].filter(slot => !visited.has(slot)).map(slot => ({
          slot,
          weight: slot.clientWidth * (slot.parentElement?.dataset.marioPlatform === "divider" ? 2 : 1),
        }));
        let draw = Math.random() * weighted.reduce((sum, item) => sum + item.weight, 0);
        const choice = weighted.find(({ weight }) => (draw -= weight) <= 0)?.slot;
        if (choice) arm(choice);
      }
      if (armed && visible.has(armed) && (spotlight || normal && !visited.has(armed))) {
        const next = armed;
        if (!hidden) start(depart);
        else {
          destination = next;
          start(async signal => {
            await explore(next, signal, spotlight ?? undefined, feed ?? undefined);
            returningHome = true;
          });
        }
      } else if (hidden && now - hiddenSince > 1800) start(comeHome);
    },
    dispose() {
      disposed = true;
      operation?.abort();
      stopPolling?.();
      restoreHeader();
      cancelAnimationFrame(layoutFrame);
      observer.disconnect();
      approach.disconnect();
      mounts.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      motion.removeEventListener("change", suspend);
      document.removeEventListener("visibilitychange", suspend);
      slots.forEach(clear);
    },
  };
}