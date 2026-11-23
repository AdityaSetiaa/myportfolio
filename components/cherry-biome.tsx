import "./cherry-biome.css";

type BlockColors = {
  top: string;
  left: string;
  right: string;
  fleck: string;
};

const blossom: BlockColors = { top: "#e1abbc", left: "#b8738c", right: "#98586f", fleck: "#e4a8bc" };
const blush: BlockColors = { top: "#f0c0cc", left: "#d59aac", right: "#b77891", fleck: "#f1c4ce" };
const shade: BlockColors = { top: "#cb88a0", left: "#a36983", right: "#794d66", fleck: "#d394a8" };
const bark: BlockColors = { top: "#836066", left: "#5e3d47", right: "#452e39", fleck: "#8b6267" };
const dirt: BlockColors = { top: "#798166", left: "#59413f", right: "#47353b", fleck: "#856366" };

function Block({ x, y, radius, depth, colors }: {
  x: number;
  y: number;
  radius: number;
  depth: number;
  colors: BlockColors;
}) {
  const half = radius / 2;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M0 ${-half} ${radius} 0 0 ${half} ${-radius} 0Z`} fill={colors.top} />
      <path d={`M${-radius} 0 0 ${half}v${depth}l${-radius} ${-half}Z`} fill={colors.left} />
      <path d={`M0 ${half} ${radius} 0v${depth}L0 ${half + depth}Z`} fill={colors.right} />
      <path d={`M${-half - 2} ${half + 2}h3v2h-3z M${half} ${half + 4}h2v2h-2z`} fill={colors.fleck} />
    </g>
  );
}

export function CherryBiome() {
  return (
    <svg className="cherry-biome" viewBox="0 0 184 142" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {/* Receding bank, with a low step on the left. */}
      <Block x={47} y={98} radius={19} depth={12} colors={dirt} />
      <Block x={85} y={98} radius={19} depth={13} colors={dirt} />
      <Block x={123} y={98} radius={19} depth={12} colors={dirt} />
      <Block x={161} y={107} radius={19} depth={10} colors={dirt} />
      <Block x={28} y={108} radius={19} depth={13} colors={dirt} />
      <Block x={66} y={108} radius={19} depth={15} colors={dirt} />
      <Block x={104} y={108} radius={19} depth={15} colors={dirt} />
      <Block x={142} y={117} radius={19} depth={11} colors={dirt} />
      <path fill="#8b9773" d="M24 103h3v-5h2v9h-5zM49 107h3v-5h2v7h-5zM117 110h3v-6h2v8h-5zM157 106h3v-6h2v8h-5z" />
      <path fill="#a17780" d="M34 112h3v2h-3zM130 109h3v2h-3zM51 117h4v2h-4z" />

      {/* Stacked wood segments and two branches behind the canopy. */}
      <Block x={88} y={86} radius={9} depth={14} colors={bark} />
      <Block x={87} y={72} radius={9} depth={14} colors={bark} />
      <Block x={87} y={58} radius={8} depth={14} colors={bark} />
      <Block x={73} y={57} radius={8} depth={8} colors={bark} />
      <Block x={100} y={53} radius={8} depth={8} colors={bark} />

      {/* Layered blossom cubes, with the lightest faces toward the upper left. */}
      <Block x={60} y={36} radius={16} depth={15} colors={shade} />
      <Block x={93} y={27} radius={18} depth={18} colors={blossom} />
      <Block x={124} y={37} radius={17} depth={16} colors={shade} />
      <Block x={48} y={47} radius={14} depth={12} colors={blossom} />
      <Block x={66} y={29} radius={17} depth={16} colors={blush} />
      <Block x={89} y={17} radius={15} depth={17} colors={blush} />
      <Block x={112} y={26} radius={16} depth={15} colors={blossom} />
      <Block x={139} y={47} radius={13} depth={10} colors={shade} />
      <Block x={70} y={51} radius={17} depth={14} colors={shade} />
      <Block x={92} y={40} radius={20} depth={17} colors={blush} />
      <Block x={116} y={51} radius={16} depth={13} colors={blossom} />

      <g className="cherry-biome-details">
        <path fill="#e5a7bd" d="M27 58h3v3h-3zM151 70h3v3h-3zM124 85h3v2h-3zM59 79h2v3h-2z" />
        <path fill="#61454e" d="M107 68h2v8h-2z M103 76h10v10h-10z" />
        <path fill="#d9a580" d="M105 78h6v6h-6z" />
        <path fill="#efc5a1" d="M107 79h2v4h-2z" />
      </g>
    </svg>
  );
}