"use client";

import { useLayoutEffect, useRef } from "react";
import "./minecart-active-indicator.css";

export function MinecartGlyph() {
  return (
    <svg className="minecart-glyph" width="26" height="24" viewBox="0 0 32 28" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <path fill="#211a24" d="M5 18h9v6h-2v3H6v-2H4v-6zM22 16h8v6h-2v3h-6v-2h-2v-6z" />
      <path fill="#826e80" d="M7 21h5v5H7zM23 19h5v5h-5z" />
      <path fill="#3b2f3d" d="M9 23h2v2H9zM25 21h2v2h-2z" />
      <path fill="#9f899d" d="M2 9 13 2 30 6 29 17 18 24 3 20Z" />
      <path fill="#685768" d="M19 13 30 6 29 17 18 24Z" />
      <path fill="#887386" d="M3 14 19 18 18 24 3 20Z" />
      <path fill="#bca8b9" d="M2 9 13 2 30 6 19 14Z" />
      <path fill="#332934" d="M6 9 14 4 26 7 18 11Z" />
      <path fill="#594759" d="M6 9 14 4 26 7 23 8 14 6 9 10Z" />
      <path fill="#ddd0d9" d="M2 9 6 9 18 12 26 7 30 6 19 14Z" />
      <path fill="#ac95a8" d="M5 14h3v2H5zM11 15h3v2h-3zM5 18h4v1H5zM14 19h2v2h-2zM24 14h2v2h-2z" />
      <path fill="#4e3d50" d="M21 18h2v2h-2zM26 16h2v1h-2zM3 20l15 4 11-7v2l-11 6-15-4Z" />
    </svg>
  );
}

export function MinecartActiveIndicator({ index }: { index: number }) {
  const cart = useRef<HTMLDivElement>(null);
  const previous = useRef(index);

  useLayoutEffect(() => {
    if (previous.current === index) return;
    previous.current = index;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const sprite = cart.current;
    if (motion.matches || !sprite?.getClientRects().length) return;

    const bounce = sprite.animate([
      { transform: "translateY(0)" },
      { transform: "translateY(-2px)", offset: .45 },
      { transform: "translateY(0)" },
    ], { delay: 300, duration: 100, easing: "ease-out" });
    const stop = () => bounce.cancel();
    motion.addEventListener("change", stop);
    return () => {
      stop();
      motion.removeEventListener("change", stop);
    };
  }, [index]);

  return (
    <div className="minecart-indicator" aria-hidden="true">
      <div className="minecart-frame"><span /></div>
      <div className="minecart-slot"><div ref={cart}><MinecartGlyph /></div></div>
      <svg className="minecart-track" viewBox="0 0 108 6" preserveAspectRatio="none" shapeRendering="crispEdges" focusable="false">
        <path fill="#674653" d="M4 0h4v6H4zM16 0h4v6h-4zM28 0h4v6h-4zM40 0h4v6h-4zM52 0h4v6h-4zM64 0h4v6h-4zM76 0h4v6h-4zM88 0h4v6h-4zM100 0h4v6h-4z" />
        <path fill="#9a687a" d="M5 0h2v5H5zM17 0h2v5h-2zM29 0h2v5h-2zM41 0h2v5h-2zM53 0h2v5h-2zM65 0h2v5h-2zM77 0h2v5h-2zM89 0h2v5h-2zM101 0h2v5h-2z" />
        <path fill="var(--minecart-rail)" d="M0 1h108v1H0zM0 4h108v1H0z" />
        <path fill="#43303d" d="M0 2h108v1H0zM0 5h108v1H0z" />
      </svg>
    </div>
  );
}
