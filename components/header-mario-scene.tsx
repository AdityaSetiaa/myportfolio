import { type RefObject, useId } from "react";

function Cloud({ className }: { className: string }) {
  return <svg className={`scene-cloud ${className}`} viewBox="0 0 22 8" shapeRendering="crispEdges">
    <path fill="#CEB0CC" d="M0 5h3V3h4V0h6v2h4v2h3v2h2v2H0z" />
    <path fill="#776777" d="M2 7h17v1H2z" />
  </svg>;
}

type SceneProps = {
  blockRef: RefObject<HTMLDivElement | null>;
  reward: boolean;
  onRewardEnd: () => void;
};

export function HeaderMarioScene({ blockRef, reward, onRewardEnd }: SceneProps) {
  const floorPattern = useId();
  return (
    <div className="header-mario-scene" aria-hidden="true">
      <Cloud className="scene-cloud-first" />
      <Cloud className="scene-cloud-last" />
      <div ref={blockRef} className="scene-target">
        <svg className={`scene-question ${reward ? "scene-question-hit" : ""}`}
          viewBox="0 0 15 15" shapeRendering="crispEdges">
          <path fill="#705362" d="M0 0h15v15H0z" />
          <path fill="#D79AAA" d="M1 1h12v12H1z" />
          <path fill="#E1A3B3" d="M1 1h12v1H2v10H1z" />
          <path fill="#45313E" d="M5 3h4v1h1v3H9v1H8v1H6V7h1V6h1V5H6v1H4V4h1zM6 10h2v2H6z" />
        </svg>
        {reward && <div className="scene-coin" onAnimationEnd={event => {
          if (event.target === event.currentTarget) onRewardEnd();
        }}>
          <svg viewBox="0 0 10 14" shapeRendering="crispEdges">
            <path fill="#A97832" d="M3 0h4v1h2v2h1v8H9v2H7v1H3v-1H1v-2H0V3h1V1h2z" />
            <path fill="#F4C95D" d="M3 2h4v1h1v8H7v1H3v-1H2V3h1z" />
            <path fill="#FFE49A" d="M3 3h2v1H4v5H3z" />
          </svg>
        </div>}
      </div>
      <svg className="scene-frame" width="18" height="21" viewBox="0 0 18 21" shapeRendering="crispEdges">
        <path fill="#89758B" d="M0 21V4h3V1h11v3h3v17h-3V5H4v16z" />
        <path fill="#D8C0D9" d="M1 5h1v15H1zM4 2h9v1H4z" />
      </svg>
      <svg className="header-mario-floor" width="100%" focusable="false" shapeRendering="crispEdges">
        <defs>
          <pattern id={floorPattern} width="20" height="8" patternUnits="userSpaceOnUse">
            <rect width="20" height="8" fill="#4A3C4A" />
            <path fill="#786273" d="M0 0h20v1H0z" />
            <path fill="#2A202A" d="M15 1h1v3h-1zM0 4h20v1H0zM5 5h1v3H5z" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${floorPattern})`} />
      </svg>
    </div>
  );
}