"use client";

import { useEffect, useRef } from "react";

// The persistent header may mount before the streamed page hydrates.
export function MarioStop() {
  const slot = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = slot.current;
    if (!element) return;
    element.dataset.ready = "";
    return () => { delete element.dataset.ready; };
  }, []);
  return <span className="mario-stop" aria-hidden="true" ref={slot} />;
}