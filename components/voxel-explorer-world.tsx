"use client";

import { useEffect, useRef, useState } from "react";
import { companionsReserved, openCompanion, registerActor } from "./companions/runtime";
import { VoxelExplorerArt, VoxelOre, VoxelPortalArt, VoxelWorldProps } from "./voxel-world-art";
import "./voxel-explorer-world.css";

type Phase = "portal" | "emerge" | "out" | "idle" | "mine" | "collect" | "turn" | "back" | "enter";

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>(resolve => {
    const finish = () => {
      window.clearTimeout(timer);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const timer = window.setTimeout(finish, ms);
    signal.addEventListener("abort", finish, { once: true });
    if (signal.aborted) finish();
  }).then(() => signal.throwIfAborted());
}

export function VoxelExplorerWorld() {
  const scene = useRef<HTMLDivElement>(null);
  const task = useRef<AbortController | null>(null);
  const control = useRef<HTMLButtonElement>(null);
  const startTrip = useRef<() => void>(null);
  const trips = useRef(0);
  const [phase, setPhase] = useState<Phase>("portal");
  const [hits, setHits] = useState(0);
  const [ore, setOre] = useState(false);

  useEffect(() => {
    const element = scene.current;
    const trigger = control.current;
    const sprite = trigger?.querySelector("svg");
    if (!element || !trigger || !sprite) return;
    const unregister = registerActor("steve", {
      sprite, control: trigger, platform: element,
      ready: () => !task.current && sprite.parentElement === trigger,
      perform: () => startTrip.current?.(),
    });
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) task.current?.abort();
    });
    observer.observe(element);
    const stop = () => task.current?.abort();
    window.addEventListener("resize", stop);
    return () => {
      unregister();
      window.removeEventListener("resize", stop);
      observer.disconnect();
      stop();
      task.current = null;
    };
  }, []);

  async function explore() {
    if (task.current || companionsReserved() || !scene.current) return;
    const trip = new AbortController();
    const { signal } = trip;
    task.current = trip;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mining = trips.current++ % 3 !== 2;
    const walkTime = Math.round(scene.current.clientWidth * 6);
    scene.current.style.setProperty("--voxel-walk-time", `${walkTime}ms`);

    function show(step: Phase, duration: number) {
      setPhase(step);
      return wait(duration, signal);
    }

    setOre(mining);
    setHits(0);
    try {
      await show("emerge", reduced ? 120 : 300);
      await show("out", reduced ? 150 : walkTime);
      if (mining) {
        await show("mine", 410);
        setHits(1);
        await wait(410, signal);
        setHits(2);
        await wait(410, signal);
        await show("collect", 920);
      } else {
        await show("idle", 440);
      }
      await show("turn", 190);
      await show("back", reduced ? 150 : walkTime);
      await show("enter", reduced ? 120 : 300);
    } catch (error) {
      if (!signal.aborted) throw error;
    } finally {
      if (task.current === trip) {
        task.current = null;
        setOre(false);
        setPhase("portal");
      }
    }
  }

  useEffect(() => {
    startTrip.current = () => { void explore(); };
    return () => { startTrip.current = null; };
  });

  const active = phase !== "portal";
  return (
    <div className="voxel-world" data-phase={phase} data-mario-obstacle="voxel-world" ref={scene}>
      <VoxelWorldProps />
      <button className="voxel-portal" type="button" onClick={() => void explore()}
        aria-label="Send the explorer through the portal" aria-disabled={active}
        title={active ? "Explorer is out" : "Send the explorer through the portal"}>
        <VoxelPortalArt />
        <span className="voxel-portal-spark" aria-hidden="true" />
      </button>
      <button className="voxel-explorer voxel-character-control" type="button" ref={control}
        aria-label="Talk to Steve" aria-haspopup="dialog"
        onClick={event => openCompanion("steve", event.currentTarget)}>
        <VoxelExplorerArt />
      </button>
      {ore && (phase === "emerge" || phase === "out" || phase === "mine") && <VoxelOre hits={hits} />}
      {phase === "collect" && <span className="voxel-diamond" aria-hidden="true" />}
      <span className="voxel-reward" role="status">{phase === "collect" ? "+1 Diamond" : ""}</span>
    </div>
  );
}