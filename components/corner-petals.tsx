"use client";

import { useEffect, useRef, type CSSProperties } from "react";

const colors = ["#f2c3d0", "#d58b9b", "#ce8da5"];
const petals = [
  [18, 42, 3, 5.7, .2, -7], [36, 47, 5, 6.4, .8, 9],
  [52, 56, 3, 5.1, 1.5, -9], [92, 67, 5, 6.8, 2.2, -4],
  [13, 39, 5, 6.1, 2.9, 8], [47, 46, 3, 4.8, 3.6, 13],
  [61, 67, 7, 6.9, 4.3, -12], [81, 22, 3, 5.6, 5, 7],
  [27, 37, 3, 6.3, 5.7, -11], [49, 57, 5, 6.6, 6.4, 5],
];

export function CornerPetals() {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = layer.current;
    const branch = element?.parentElement;
    if (!element || !branch) return;
    const burst = Array.from(element.querySelectorAll<HTMLElement>(".corner-petal-burst"));
    const hover = matchMedia("(min-width: 901px) and (prefers-reduced-motion: no-preference)");
    let visible = true;
    let inside = false;

    function sync() {
      element!.toggleAttribute("data-paused", document.hidden || !visible);
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(branch);
    function leave() { inside = false; }

    function trackPointer(event: PointerEvent) {
      if (!hover.matches || document.hidden || !visible || event.pointerType !== "mouse") return;
      if (event.clientX < window.innerWidth / 2) { leave(); return; }
      const rect = branch!.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const overCanopy = x > .06 && x < .66 && y >= 0 && y < .49;
      if (overCanopy && !inside) {
        burst.forEach((flake, index) => {
          flake.style.left = `${event.clientX - rect.left + (index - 1) * 8}px`;
          flake.style.top = `${Math.min(92, Math.max(28, event.clientY - rect.top))}px`;
          for (const animation of flake.getAnimations()) animation.cancel();
          flake.animate([
            { opacity: 0, transform: "translate(0,0)" },
            { opacity: .72, offset: .16 },
            { opacity: 0, transform: `translate(${(index - 1.4) * 11}px, 42px)` },
          ], { duration: 2300 + index * 210, delay: index * 110, easing: "ease-in-out" });
        });
      }
      inside = overCanopy;
    }

    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pointermove", trackPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    sync();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointermove", trackPointer);
      document.documentElement.removeEventListener("pointerleave", leave);
      burst.forEach(flake => flake.getAnimations().forEach(animation => animation.cancel()));
    };
  }, []);

  return (
    <div ref={layer} className="corner-petals">
      {petals.map(([x, y, size, duration, delay, drift], index) => (
        <span key={index} className="corner-petal" style={{
          left: `${x}%`, top: `${y}%`, width: size, height: size,
          background: colors[index % colors.length], animationDuration: `${duration}s`,
          animationDelay: `${-delay}s`, "--petal-drift": `${drift}px`,
        } as CSSProperties} />
      ))}
      {colors.concat(colors[0]).map((color, index) => (
        <span className="corner-petal-burst" key={index} style={{ background: color }} />
      ))}
    </div>
  );
}