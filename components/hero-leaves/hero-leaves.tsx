"use client";

import { useEffect, useRef } from "react";
import { startFallingLeaves } from "./falling-leaves";
import { leafColors, pileLimit } from "./leaf-pile";
import { startSteveLeafReaction } from "./steve-leaf-reaction";
import "./hero-leaves.css";

export function HeroLeaves() {
  const layer = useRef<HTMLDivElement>(null);
  const tray = useRef<SVGSVGElement>(null);
  const bubble = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!layer.current || !tray.current || !bubble.current) return;
    const reaction = startSteveLeafReaction(bubble.current, tray.current);
    const stop = startFallingLeaves(layer.current, tray.current, reaction.notify);
    return () => { reaction.dispose(); stop?.(); };
  }, []);

  return <>
    <div className="hero-leaves" ref={layer} aria-hidden="true">
      <svg className="hero-leaf-pile" ref={tray} width="0" height={pileLimit} shapeRendering="crispEdges" focusable="false">
        <g>{leafColors.map(color => <path key={color} fill={color} />)}</g>
      </svg>
    </div>
    <div className="steve-leaf-reaction" ref={bubble} role="status" aria-atomic="true" />
  </>;
}
