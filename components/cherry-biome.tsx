import "./cherry-biome.css";
import { VoxelExplorerWorld } from "./voxel-explorer-world";
import { ContactLanternToggle, ThemeLanternToggle } from "./theme-lantern-toggle";

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
      <g className="cherry-voxel-texture" fill={colors.fleck} opacity=".44">
        <path transform={`matrix(${radius / 16} ${radius / 32} ${-radius / 16} ${radius / 32} 0 ${-half})`}
          d="M2 2h3v2H2zM8 3h4v2H8zM5 9h2v2H5zM10 11h3v2h-3z" />
        <path transform={`matrix(${radius / 16} ${radius / 32} 0 ${depth / 16} ${-radius} 0)`}
          d="M2 5h3v2H2zM7 3h4v3H7zM11 9h3v3h-3zM4 11h3v3H4z" />
        <path transform={`matrix(${radius / 16} ${-radius / 32} 0 ${depth / 16} 0 ${half})`}
          d="M3 4h2v3H3zM8 1h4v2H8zM11 7h3v3h-3zM6 11h3v2H6z" />
      </g>
    </g>
  );
}

function BiomeArt() {
  return (
    <svg className="contact-biome-art" viewBox="0 0 184 142" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
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
      </g>
      <g>
        <path fill="#61454e" d="M107 68h2v8h-2z M103 76h10v10h-10z" />
        <path fill="#d9a580" d="M105 78h6v6h-6z" />
        <path fill="#efc5a1" d="M107 79h2v4h-2z" />
      </g>
    </svg>
  );
}

const canopy: { x: number; y: number; radius: number; depth: number; colors: BlockColors }[] = [
  { x: 88, y: 32, radius: 24, depth: 15, colors: shade },
  { x: 122, y: 37, radius: 22, depth: 17, colors: blossom },
  { x: 147, y: 50, radius: 18, depth: 15, colors: shade },
  { x: 38, y: 62, radius: 20, depth: 17, colors: shade },
  { x: 61, y: 43, radius: 21, depth: 23, colors: blossom },
  { x: 94, y: 24, radius: 22, depth: 21, colors: blush },
  { x: 131, y: 44, radius: 16, depth: 23, colors: blossom },
  { x: 163, y: 65, radius: 18, depth: 14, colors: blossom },
  { x: 28, y: 72, radius: 18, depth: 15, colors: blossom },
  { x: 58, y: 78, radius: 23, depth: 18, colors: shade },
  { x: 92, y: 61, radius: 28, depth: 25, colors: blush },
  { x: 128, y: 77, radius: 22, depth: 17, colors: blossom },
  { x: 157, y: 83, radius: 15, depth: 12, colors: shade },
];

function HeroTreeArt() {
  return (
    <svg className="hero-biome-art" viewBox="0 0 184 190" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <g>
        {/* Three stepped boughs support the clusters and the lantern. */}
        <path fill="#49303f" d="M103 121 84 115 70 108 70 103 54 99 54 91 61 89 78 97 78 103 94 108 106 113Z" />
        <path fill="#8b536b" d="M103 113 94 110 74 103 74 100 56 94 62 91 78 98 78 102 96 109 107 112Z" />
        <path fill="#49303f" d="m105 105 2-24 9-11 9 4-9 12-1 19z" />
        <path fill="#694052" d="M112 135 125 128 138 122 138 118 153 112 161 113 161 121 149 122 145 127 130 133 130 138 113 144Z" />
        <path fill="#8b536b" d="M114 134 127 127 137 123 137 119 152 112 160 112 158 116 144 120 144 124 131 130 131 134 114 141Z" />
        <path fill="#49303f" d="M130 133 145 126 145 124 159 119 159 122 148 125 144 130 132 136Z" />
      </g>
      <g>
        <path fill="#694052" d="M96 95 110 90 119 96V125L115 134V155L111 159V184L104 190H87V160L92 155V131L96 124Z" />
        <path fill="#49303f" d="m106 102 13-6v29l-4 9v21l-4 4v25l-7 6h-9l5-13v-25l4-6v-23z" />
        <path fill="#8b536b" d="M95 125 104 122 104 126 94 130ZM91 149 100 153 100 156 91 152ZM88 165 95 168 95 171 88 168Z" />
        <path fill="#a66b81" opacity=".52" d="M97 105h4v3h-4zM108 117l6-3v3l-6 3zM101 140l7-3v3l-7 3zM91 157h4v4h-4zM100 171l7-3v3l-7 3z" />
      </g>
      {/* This lower silhouette is the solid obstruction along the divider. */}
      <g data-mario-obstacle="tree-trunk">
        <path fill="#694052" d="M87 159 95 162 95 178 100 180 106 176 111 176 111 184 118 185 118 190H76v-4l7-3v-19z" />
        <path fill="#8b536b" d="M83 179 89 181 85 185 77 187 77 190H72v-5l7-2zM112 183l7 2v5h-8v-3z" />
        <path fill="#49303f" d="M101 181 110 177 110 185 119 186v4h-18z" />
        <path fill="#a66b81" opacity=".52" d="M87 166h3v3h-3zM104 186h3v2h-3z" />
      </g>

      {canopy.map(block => <Block key={block.x} {...block} />)}

      <g className="hero-petals">
        <rect className="hero-petal" x="39" y="94" width="2.3" height="1.8" fill="#dda1b7" />
        <rect className="hero-petal" x="64" y="105" width="1.8" height="1.8" fill="#f2c3d0" />
        <rect className="hero-petal" x="159" y="96" width="2" height="2" fill="#ce8da5" />
        <rect className="hero-petal" x="173" y="90" width="2" height="1.8" fill="#dda1b7" />
      </g>
    </svg>
  );
}
export function CherryBiome({ hero = false, artworkOnly = false }: { hero?: boolean; artworkOnly?: boolean }) {
  if (!hero) return (
    <div className="cherry-biome">
      <BiomeArt />
      {!artworkOnly && <ContactLanternToggle />}
    </div>
  );
  return (
    <div className="hero-biome">
      <HeroTreeArt />
      {!artworkOnly && <><VoxelExplorerWorld /><ThemeLanternToggle variant="branch" /></>}
    </div>
  );
}