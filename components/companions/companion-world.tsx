"use client";

import { useEffect, useRef } from "react";
import { behaviorDecision, callAction, otherCharacter, type BehaviorContext, type Character } from "@/data/companion-contract";
import type { SpotlightEncounter } from "../mario-spotlight";
import { between } from "./behavior";
import { animate, delay } from "./effects";
import { greetingApproach } from "./geometry";
import { actorFor, currentSection, reserveCompanions, visibleBox } from "./runtime";
import { canCall, travelTo } from "./travel";
import "./companion-world.css";

type DividerDetail = { signal: AbortSignal; accept: (result: Promise<void>) => void };

function sessionFlag(key: string) {
  const storageKey = `companion-${key}`;
  let used = false;
  try { used = sessionStorage.getItem(storageKey) === "1"; } catch { /* Use the page lifetime. */ }
  return {
    get used() { return used; },
    mark() {
      used = true;
      try { sessionStorage.setItem(storageKey, "1"); } catch { /* Use the page lifetime. */ }
    },
  };
}

async function decide(input: BehaviorContext, signal: AbortSignal) {
  const fallback = callAction(input.character);
  try {
    const response = await fetch("/api/companions/behavior", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.any([signal, AbortSignal.timeout(2300)]),
    });
    if (!response.ok) return fallback;
    const result = behaviorDecision.safeParse(await response.json());
    return result.success && result.data.action === "INSPECT_OBJECT" ? result.data.action : fallback;
  } catch {
    return fallback;
  }
}

export function CompanionWorld() {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const effects = layer.current;
    if (!effects) return;
    const stage = effects;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = matchMedia("(max-width: 700px)");
    const calls = { mario: sessionFlag("visit-from-mario"), steve: sessionFlag("visit-from-steve") };
    const planner = sessionFlag("behavior-planner");
    let active: AbortController | null = null;
    let cooldown = 0, lastScroll = 0, timer = 0;
    const awake = () => !document.hidden && !motion.matches;
    const free = () => awake() && !active && performance.now() >= cooldown && performance.now() - lastScroll >= 450;

    function start(run: (signal: AbortSignal) => Promise<void>, parent?: AbortSignal) {
      if (!free() || parent?.aborted) return;
      const release = reserveCompanions();
      if (!release) return;
      const controller = new AbortController();
      active = controller;
      const signal = parent ? AbortSignal.any([parent, controller.signal]) : controller.signal;
      return run(signal).catch(error => {
        if (!signal.aborted) console.error("Companion animation interrupted", error);
      }).finally(() => {
        active = null;
        cooldown = performance.now() + (mobile.matches ? 30000 : 19000);
        release();
      });
    }

    function call(character: Character, platform?: HTMLElement, parent?: AbortSignal, askPlanner = false) {
      const actor = actorFor(character);
      const guest = actorFor(otherCharacter(character));
      if (!actor || !guest || calls[character].used || !canCall(character, platform)) return;
      return start(async signal => {
        if (character === "mario" && askPlanner && !planner.used) {
          planner.mark();
          const decision = await decide({
            character,
            scene: platform ? "spotlight" : "discovery",
            section: currentSection(actor),
            platform: platform ? "section-divider" : "header",
            nearbyObject: platform ? "project" : "ore",
            spotlight: Boolean(platform),
            companionNearby: visibleBox(guest.sprite.getBoundingClientRect()),
          }, signal);
          signal.throwIfAborted();
          if (decision === "INSPECT_OBJECT") {
            const pose = actor.sprite.dataset.pose;
            actor.sprite.dataset.pose = "looking";
            try { await delay(900, signal); } finally {
              if (pose) actor.sprite.dataset.pose = pose;
              else delete actor.sprite.dataset.pose;
            }
            return;
          }
        }
        if (canCall(character, platform) && await travelTo(character, { layer: stage, signal }, platform)) calls[character].mark();
      }, parent);
    }

    function schedule() {
      clearTimeout(timer);
      if (!awake() || calls.steve.used && calls.mario.used) return;
      timer = window.setTimeout(() => {
        if (free() && Math.random() < .62) {
          const steve = actorFor("steve");
          if (steve && visibleBox(steve.sprite.getBoundingClientRect())) {
            const order: Character[] = Math.random() < .5 ? ["steve", "mario"] : ["mario", "steve"];
            for (const character of order) if (call(character, undefined, undefined, character === "mario")) break;
          }
        }
        schedule();
      }, mobile.matches ? between(42000, 62000) : between(22000, 37000));
    }

    function natural(event: Event) {
      const { signal, accept } = (event as CustomEvent<DividerDetail>).detail;
      const mario = actorFor("mario"), steve = actorFor("steve");
      if (!mario || !steve?.ready()) return;
      const a = mario.sprite.getBoundingClientRect(), b = steve.sprite.getBoundingClientRect();
      const approach = greetingApproach(a, b, steve.platform);
      if (approach === null || !visibleBox(a) || !visibleBox(b)) return;
      const visitor = mario.sprite.parentElement;
      if (!visitor?.matches(".mario-visitor")) return;
      const facing = a.left < b.left ? 1 : -1;
      const oldFacing = visitor.style.getPropertyValue("--facing");
      const oldPose = mario.sprite.dataset.pose;
      const result = start(async combined => {
        visitor.style.setProperty("--facing", String(facing));
        steve.control.style.setProperty("--facing", String(-facing));
        try {
          if (approach) {
            mario.sprite.dataset.pose = "looking";
            steve.control.dataset.reaction = "approach";
            await animate(steve.control, [{ translate: "0 0" }, { translate: `${approach}px 0` }], Math.abs(approach) * 15, combined, "linear");
          }
          mario.sprite.dataset.pose = "waving";
          await delay(340, combined);
          const room = visitor.parentElement!.clientHeight - a.height;
          if (room > 4 && Math.random() < .35) {
            mario.sprite.dataset.pose = "jumping";
            await animate(mario.sprite, [{ translate: "0 0" }, { translate: `0 -${Math.min(room, 9)}px` }, { translate: "0 0" }], 360, combined);
            mario.sprite.dataset.pose = "waving";
          }
          steve.control.dataset.reaction = Math.random() < .5 ? "wave" : "raise";
          await delay(850, combined);
          if (approach) {
            steve.control.style.setProperty("--facing", String(facing));
            steve.control.dataset.reaction = "approach";
            await animate(steve.control, [{ translate: `${approach}px 0` }, { translate: "0 0" }], Math.abs(approach) * 15, combined, "linear");
          }
        } finally {
          mario.sprite.style.removeProperty("translate");
          if (oldPose) mario.sprite.dataset.pose = oldPose;
          else delete mario.sprite.dataset.pose;
          visitor.style.setProperty("--facing", oldFacing);
          steve.control.style.removeProperty("--facing");
          steve.control.style.removeProperty("translate");
          delete steve.control.dataset.reaction;
        }
      }, signal);
      if (result) accept(result);
    }

    function spotlight(event: Event) {
      const { signal, platform, canTravel, accept } = (event as CustomEvent<SpotlightEncounter>).detail;
      if (canTravel && Math.random() < (mobile.matches ? .15 : .32)) {
        const result = call("mario", platform, signal, true);
        if (result) {
          accept(result);
          return;
        }
      }
      natural(event);
    }

    const cancel = () => active?.abort();
    const sync = () => { cancel(); schedule(); };
    function scroll() {
      lastScroll = performance.now();
      cancel();
    }
    schedule();
    window.addEventListener("companion-divider", natural);
    window.addEventListener("companion-spotlight", spotlight);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", cancel);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    return () => {
      clearTimeout(timer);
      cancel();
      window.removeEventListener("companion-divider", natural);
      window.removeEventListener("companion-spotlight", spotlight);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", cancel);
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
    };
  }, []);

  return <div ref={layer} className="companion-effects" aria-hidden="true" />;
}
