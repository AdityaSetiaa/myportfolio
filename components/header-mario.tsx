"use client";

import { useEffect, useRef, useState } from "react";
import "./header-mario.css";

const speed = 36; // CSS pixels per second
const frameDistance = 5;

export function HeaderMario() {
  const lane = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const position = useRef(0);
  const direction = useRef(1);
  const stride = useRef(0);
  const [jumping, setJumping] = useState(false);

  useEffect(() => {
    const track = lane.current;
    const runner = button.current;
    if (!track || !runner) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let limit = 0;
    let request = 0;
    let last = 0;

    function paint() {
      if (!runner) return;
      runner.style.transform = `translateX(${position.current}px)`;
      runner.style.setProperty("--facing", String(direction.current));
      runner.style.setProperty("--frame", String(Math.floor(stride.current / frameDistance) % 3));
    }

    function tick(now: number) {
      const distance = last ? speed * Math.min(now - last, 50) / 1000 : 0;
      last = now;
      if (limit > 0) {
        // Reflect the excess distance at each end so the turn has no position reset.
        const period = 2 * limit;
        const along = direction.current > 0 ? position.current : period - position.current;
        const phase = (along + distance) % period;
        direction.current = phase < limit ? 1 : -1;
        position.current = Math.min(phase, period - phase);
        stride.current += distance;
        paint();
      }
      request = requestAnimationFrame(tick);
    }

    function syncPlayback() {
      cancelAnimationFrame(request);
      last = 0;
      if (!motion.matches && !document.hidden && !jumping) request = requestAnimationFrame(tick);
    }

    function measure() {
      if (!track || !runner) return;
      limit = Math.max(0, track.clientWidth - runner.offsetWidth);
      position.current = Math.min(position.current, limit);
      paint();
    }

    const observer = new ResizeObserver(measure);
    observer.observe(track);
    observer.observe(runner);
    measure();
    syncPlayback();
    motion.addEventListener("change", syncPlayback);
    document.addEventListener("visibilitychange", syncPlayback);
    return () => {
      cancelAnimationFrame(request);
      observer.disconnect();
      motion.removeEventListener("change", syncPlayback);
      document.removeEventListener("visibilitychange", syncPlayback);
    };
  }, [jumping]);

  return (
    <div ref={lane} className="header-mario-lane">
      <button ref={button} type="button" className="header-mario-runner"
        aria-label="Make Mario jump" onClick={() => setJumping(true)}>
        <span className={jumping ? "header-mario-jump" : undefined}
          onAnimationEnd={() => setJumping(false)} aria-hidden="true">
          <span className="header-mario-sprite" />
        </span>
      </button>
    </div>
  );
}