"use client";

import { useEffect, useRef, useState } from "react";
import { between, varied } from "./companions/behavior";
import { delay } from "./companions/effects";
import { companionsReserved, registerActor, visibleBox } from "./companions/runtime";
import { VoxelExplorerArt, VoxelOre, VoxelPortalArt, VoxelWorldProps } from "./voxel-world-art";
import "./voxel-explorer-world.css";

type Phase = "portal" | "emerge" | "out" | "idle" | "mine" | "collect" | "turn" | "back" | "enter";
const gestures = ["wave", "raise", "look", "turn"] as const;

export function VoxelExplorerWorld() {
  const scene = useRef<HTMLDivElement>(null);
  const control = useRef<HTMLButtonElement>(null);
  const react = useRef<(portal?: boolean) => void>(null);
  const [phase, setPhase] = useState<Phase>("portal");
  const [hits, setHits] = useState(0);
  const [ore, setOre] = useState(false);

  useEffect(() => {
    const world = scene.current, button = control.current;
    const sprite = button?.querySelector("svg");
    if (!world || !button || !sprite) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = matchMedia("(max-width: 700px)");
    let task: AbortController | null = null;
    let timer = 0, reactionTimer = 0;
    let inView = false, disposed = false, lastMined = false;
    let previous: typeof gestures[number] | undefined;
    const ready = () => !task && sprite.parentElement === button && !button.dataset.reaction;
    const awake = () => !disposed && inView && !document.hidden && !motion.matches;
    const unregister = registerActor("steve", { sprite, control: button, platform: world, ready });

    function schedule() {
      window.clearTimeout(timer);
      if (awake()) timer = window.setTimeout(() => {
        if (ready() && !companionsReserved() && visibleBox(sprite!.getBoundingClientRect())) void explore();
        else schedule();
      }, mobile.matches ? between(19000, 32000) : between(10000, 21000));
    }

    async function explore() {
      if (!ready() || companionsReserved() || !awake() || !world) return;
      const trip = new AbortController();
      const { signal } = trip;
      task = trip;
      const mining = !lastMined || Math.random() < .72;
      lastMined = mining;
      const walkTime = Math.round(world.clientWidth * between(7, 12));
      world.style.setProperty("--voxel-walk-time", `${walkTime}ms`);

      function show(step: Phase, duration: number) {
        setPhase(step);
        return delay(duration, signal);
      }

      setOre(mining);
      setHits(0);
      try {
        await show("emerge", 300);
        await show("out", walkTime);
        await show("idle", between(700, 2400));
        if (mining) {
          await show("mine", 410);
          setHits(1);
          await delay(410, signal);
          setHits(2);
          await delay(410, signal);
          await show("collect", 700);
        }
        await show("turn", 190);
        await show("back", walkTime);
        await show("enter", 300);
      } catch (error) {
        if (!signal.aborted) throw error;
      } finally {
        task = null;
        if (!disposed) {
          setOre(false);
          setPhase("portal");
          schedule();
        }
      }
    }

    function clearReaction() {
      window.clearTimeout(reactionTimer);
      delete button!.dataset.reaction;
    }
    react.current = portal => {
      if (companionsReserved() || !ready() || document.hidden) return;
      if (portal && awake()) {
        window.clearTimeout(timer);
        void explore();
      } else {
        previous = varied(gestures, previous);
        button.dataset.reaction = previous;
        reactionTimer = window.setTimeout(clearReaction, 750);
      }
    };
    function sync() {
      world!.toggleAttribute("data-suspended", document.hidden);
      if (!awake()) task?.abort();
      if (document.hidden) clearReaction();
      schedule();
    }
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    observer.observe(world);
    const resize = () => task?.abort();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    return () => {
      disposed = true;
      unregister();
      observer.disconnect();
      clearTimeout(timer);
      clearReaction();
      resize();
      react.current = null;
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
    };
  }, []);

  const active = phase !== "portal";
  return (
    <div className="voxel-world" data-phase={phase} data-mario-obstacle="voxel-world" ref={scene}>
      <VoxelWorldProps />
      <button className="voxel-portal" type="button" onClick={() => react.current?.(true)}
        aria-label="Send Steve through the portal" aria-disabled={active}>
        <VoxelPortalArt />
        <span className="voxel-portal-spark" aria-hidden="true" />
      </button>
      <button className="voxel-explorer voxel-character-control" type="button" ref={control}
        aria-label="Steve reaction" onClick={() => react.current?.()}>
        <VoxelExplorerArt />
      </button>
      {ore && ["emerge", "out", "idle", "mine"].includes(phase) && <VoxelOre hits={hits} />}
      {phase === "collect" && <span className="voxel-diamond" aria-hidden="true" />}
    </div>
  );
}
