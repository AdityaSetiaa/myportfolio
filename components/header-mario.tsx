"use client";

import { useEffect, useRef, useState } from "react";
import "./header-mario.css";
import { usePathname } from "next/navigation";
import { createDoorTour } from "./mario-door-tour";
import { HeaderMarioScene } from "./header-mario-scene";

const speed = 36; // CSS pixels per second
const frameDistance = 5;

export function HeaderMario() {
  const pathname = usePathname();
  const door = useRef<HTMLDivElement>(null);
  const lane = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const sprite = useRef<HTMLSpanElement>(null);
  const block = useRef<HTMLDivElement>(null);
  const jump = useRef<(() => void) | null>(null);
  const [reward, setReward] = useState(false);

  useEffect(() => {
    const track = lane.current;
    const runner = button.current;
    const body = sprite.current;
    const target = block.current;
    if (!track || !runner || !body || !target || !door.current) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let x = 0, direction = 1, stride = 0;
    let height = 0, velocity = 0, gravity = 0;
    let airborne = false;
    let limit = 0, request = 0, last = 0;

    function paint() {
      runner!.style.transform = `translate(${x}px, ${-height}px)`;
      runner!.style.setProperty("--facing", String(direction));
      runner!.style.setProperty("--frame", String(airborne ? 1 : Math.floor(stride / frameDistance) % 3));
    }

    const tour = createDoorTour({
      enabled: pathname === "/", lane: track, runner, sprite: body, door: door.current,
      ready: () => !airborne && !runner.matches(":focus-visible"),
      resumeAt: value => {
        x = Math.max(0, Math.min(value, limit));
        paint();
      },
    });

    function tick(now: number) {
      tour.check(now);
      if (tour.busy) {
        last = now;
        request = requestAnimationFrame(tick);
        return;
      }
      const dt = last ? Math.min(now - last, 50) / 1000 : 0;
      last = now;
      if (airborne) {
        let next = height + velocity * dt - gravity * dt * dt / 2;
        velocity -= gravity * dt;
        if (next > height) {
          const head = body!.getBoundingClientRect();
          const box = target!.getBoundingClientRect();
          const gap = head.top - box.bottom;
          if (head.right > box.left && head.left < box.right && gap >= -0.01 && next - height >= gap) {
            next = height + gap;
            velocity = 0;
            setReward(true);
          }
        }
        height = Math.max(0, next);
        airborne = height > 0 || velocity > 0;
      } else if (limit > 0 && !motion.matches) {
        // Reflect excess travel at the boundary without resetting the stride.
        const distance = speed * dt;
        const period = 2 * limit;
        const along = direction > 0 ? x : period - x;
        const phase = (along + distance) % period;
        direction = phase < limit ? 1 : -1;
        x = Math.min(phase, period - phase);
        stride += distance;
      }
      paint();
      if (airborne || !motion.matches) request = requestAnimationFrame(tick);
    }

    function syncPlayback() {
      cancelAnimationFrame(request);
      last = 0;
      if (!document.hidden && (airborne || !motion.matches)) request = requestAnimationFrame(tick);
    }

    function measure() {
      limit = Math.max(0, track!.clientWidth - runner!.offsetWidth);
      if (motion.matches) {
        const box = target!.getBoundingClientRect();
        x = box.left - track!.getBoundingClientRect().left + (box.width - runner!.offsetWidth) / 2;
      }
      x = Math.max(0, Math.min(x, limit));
      paint();
    }

    function updatePreference() {
      height = velocity = 0;
      airborne = false;
      measure();
      syncPlayback();
    }

    jump.current = () => {
      if (airborne || tour.busy) return;
      const size = body.getBoundingClientRect().height;
      gravity = size * 42;
      velocity = Math.sqrt(2 * gravity * size * 1.4);
      airborne = true;
      syncPlayback();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    observer.observe(runner);
    measure();
    syncPlayback();
    motion.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", syncPlayback);
    return () => {
      tour.dispose();
      jump.current = null;
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
        <div ref={door} className="mario-door" aria-hidden="true">
          <span className="mario-door-leaf" />
        </div>
        <button ref={button} type="button" className="header-mario-runner"
          aria-label="Make Mario jump" onClick={() => jump.current?.()}
          onKeyDown={event => {
            if (event.key === "ArrowUp" || event.key === " ") {
              event.preventDefault();
              if (!event.repeat) jump.current?.();
            }
          }}>
          <span ref={sprite} className="header-mario-sprite" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}