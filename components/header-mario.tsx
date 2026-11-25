"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { companionsReserved, registerActor } from "./companions/runtime";
import { between, varied } from "./companions/behavior";
import { createDoorTour } from "./mario-door-tour";
import { HeaderMarioScene } from "./header-mario-scene";
import "./header-mario.css";

type Pose = "idle" | "walking" | "running" | "looking" | "turning" | "waving" | "jumping" | "celebrating";
const roaming: readonly Pose[] = ["walking", "walking", "walking", "running", "idle", "idle", "looking", "turning", "jumping"];
const reactions: readonly Pose[] = ["jumping", "waving", "turning", "celebrating"];

export function HeaderMario() {
  const pathname = usePathname();
  const door = useRef<HTMLDivElement>(null);
  const lane = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const sprite = useRef<HTMLSpanElement>(null);
  const block = useRef<HTMLDivElement>(null);
  const respond = useRef<(jump?: boolean) => void>(null);
  const [reward, setReward] = useState(false);

  useEffect(() => {
    const track = lane.current, runner = button.current, body = sprite.current, target = block.current;
    if (!track || !runner || !body || !target || !door.current) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = matchMedia("(max-width: 700px)");
    let x = 0, direction = 1, limit = 0, blockX = -1;
    let height = 0, velocity = 0;
    let request = 0, last = 0, pose: Pose = "walking";
    let due = performance.now() + between(3200, 6100);
    let nextBlock = performance.now() + between(2300, 5300);
    let inspecting = false, reactionUntil = 0, lastReaction: Pose | undefined;

    function paint() {
      runner!.style.transform = `translate(${x}px, ${-height}px)`;
      runner!.style.setProperty("--facing", String(direction));
      if (body!.dataset.pose !== pose) body!.dataset.pose = pose;
    }

    function plan(next: Pose, now: number) {
      pose = next;
      if (next === "turning") direction *= -1;
      if (next === "jumping" || next === "celebrating") {
        const size = body!.offsetHeight;
        velocity = Math.sqrt(2 * size * 42 * size * (next === "jumping" ? 1.4 : .55));
        return;
      }
      const moving = next === "walking" || next === "running";
      due = now + (moving ? between(3000, 7300) : between(1000, 3900)) * (mobile.matches ? 1.2 : 1);
    }

    const airborne = () => height > 0 || velocity > 0;
    const moving = () => pose === "walking" || pose === "running";
    const tour = createDoorTour({
      enabled: pathname === "/" || pathname === "/projects",
      spotlightOnly: pathname !== "/",
      lane: track, runner, sprite: body, door: door.current,
      ready: () => !airborne() && !inspecting && (moving() || performance.now() >= due) &&
        !companionsReserved() && !runner.matches(":focus-visible"),
      resumeAt: value => {
        x = Math.max(0, Math.min(value, limit));
        plan("walking", performance.now());
        paint();
      },
    });

    function tick(now: number) {
      tour.check(now);
      if (tour.busy || companionsReserved()) {
        last = now;
        request = requestAnimationFrame(tick);
        return;
      }
      const dt = last ? Math.min(now - last, 45) / 1000 : 0;
      last = now;
      if (airborne()) {
        const gravity = body!.offsetHeight * 42;
        let next = height + velocity * dt - gravity * dt * dt / 2;
        velocity -= gravity * dt;
        if (pose === "jumping" && next > height) {
          const head = body!.getBoundingClientRect();
          const box = target!.getBoundingClientRect();
          const gap = head.top - box.bottom;
          const inset = head.width * .035;
          if (head.right - inset > box.left && head.left + inset < box.right && gap >= -.01 && next - height >= gap) {
            next = height + gap;
            velocity = 0;
            nextBlock = now + between(17000, 29000);
            setReward(true);
          }
        }
        height = Math.max(0, next);
        if (!airborne()) plan(motion.matches ? "idle" : "walking", now);
      } else if (inspecting && now >= due) {
        inspecting = false;
        nextBlock = now + between(17000, 29000);
        plan("jumping", now);
      } else if (!motion.matches) {
        if (now >= due) {
          let next = varied(roaming, pose);
          if (mobile.matches && next === "jumping") next = "walking";
          plan(next, now);
        }
        if (moving()) {
          const speed = pose === "running" ? 61 : 36;
          const next = x + direction * dt * speed;
          if (now >= nextBlock && blockX >= 0 && (blockX - x) * (blockX - next) <= 0) {
            x = blockX;
            inspecting = true;
            pose = "looking";
            due = now + between(380, 730);
          } else if (next < 0 || next > limit) {
            x = Math.max(0, Math.min(next, limit));
            plan("turning", now);
            due = now + between(260, 540);
          } else {
            x = next;
          }
        }
      } else if (now >= due) {
        pose = "idle";
      }
      paint();
      if (airborne() || !motion.matches || pose !== "idle") request = requestAnimationFrame(tick);
    }

    function syncPlayback() {
      cancelAnimationFrame(request);
      last = 0;
      track!.parentElement?.toggleAttribute("data-suspended", document.hidden);
      if (!document.hidden && (airborne() || !motion.matches || pose !== "idle")) request = requestAnimationFrame(tick);
    }

    function measure() {
      const laneBox = track!.getBoundingClientRect(), blockBox = target!.getBoundingClientRect();
      limit = Math.max(0, track!.clientWidth - runner!.offsetWidth);
      const center = blockBox.left + blockBox.width / 2 - laneBox.left - runner!.offsetWidth / 2;
      blockX = center >= 0 && center <= limit ? center : -1;
      if (motion.matches && blockX >= 0) x = blockX;
      x = Math.max(0, Math.min(x, limit));
      if (!tour.busy && !companionsReserved()) paint();
    }

    function updatePreference() {
      height = velocity = 0;
      inspecting = false;
      plan(motion.matches ? "idle" : "walking", performance.now());
      measure();
      syncPlayback();
    }

    respond.current = forceJump => {
      if (airborne() || tour.busy || companionsReserved() || document.hidden) return;
      inspecting = false;
      const choices: readonly Pose[] = motion.matches ? ["waving", "turning"] : reactions;
      const next = forceJump && !motion.matches ? "jumping" : varied(choices, lastReaction);
      lastReaction = next;
      const now = performance.now();
      plan(next, now);
      if (!airborne()) due = reactionUntil = now + 750;
      paint();
      syncPlayback();
    };

    const unregister = registerActor("mario", {
      sprite: body, control: runner, platform: track,
      ready: () => !airborne() && !inspecting && !tour.busy && performance.now() >= reactionUntil && body.parentElement === runner,
    });
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    observer.observe(runner);
    updatePreference();
    motion.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", syncPlayback);
    return () => {
      unregister();
      tour.dispose();
      respond.current = null;
      cancelAnimationFrame(request);
      observer.disconnect();
      motion.removeEventListener("change", updatePreference);
      document.removeEventListener("visibilitychange", syncPlayback);
    };
  }, [pathname]);

  return (
    <div className="header-mario-strip">
      <HeaderMarioScene blockRef={block} reward={reward} onRewardEnd={() => setReward(false)} />
      <div ref={lane} className="header-mario-lane">
        <div ref={door} className="mario-door" aria-hidden="true"><span className="mario-door-leaf" /></div>
        <button ref={button} type="button" className="header-mario-runner" aria-label="Mario reaction"
          onClick={() => respond.current?.()} onKeyDown={event => {
            if (event.key === "ArrowUp") {
              event.preventDefault();
              if (!event.repeat) respond.current?.(true);
            }
          }}>
          <span ref={sprite} className="header-mario-sprite" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
