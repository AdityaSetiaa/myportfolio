import { CornerPetals } from "./corner-petals";
import "./corner-blossom.css";

const pink = ["#f2c3d0", "#d58b9b", "#bf7898"];
const rose = ["#e6a4bd", "#bf7898", "#925a79"];
const deep = ["#bf7898", "#925a79", "#70425d"];

const bunch = [
  { x: -23, y: 1, size: 12, depth: 11, colors: deep },
  { x: -8, y: -12, size: 16, depth: 13, colors: rose },
  { x: 13, y: -9, size: 19, depth: 13, colors: deep },
  { x: 25, y: 7, size: 12, depth: 10, colors: deep },
  { x: -27, y: 12, size: 9, depth: 9, colors: rose },
  { x: -13, y: 12, size: 14, depth: 12, colors: rose },
  { x: 12, y: 16, size: 13, depth: 10, colors: deep },
  { x: 1, y: 1, size: 20, depth: 17, colors: pink },
  { x: 20, y: 5, size: 12, depth: 10, colors: rose },
];

function VoxelLeafCluster({ x, y, scale = 1, className }: {
  x: number;
  y: number;
  scale?: number;
  className?: string;
}) {
  return (
    <g className={className} transform={`translate(${x} ${y}) scale(${scale})`}>
      {bunch.map((leaf, index) => {
        const { size, depth, colors } = leaf;
        const half = size / 2;
        return (
          <g key={index} transform={`translate(${leaf.x} ${leaf.y})`}>
            <path d={`M0 ${-half} ${size} 0 0 ${half} ${-size} 0Z`} fill={colors[0]} />
            <path d={`M${-size} 0 0 ${half}v${depth}l${-size} ${-half}Z`} fill={colors[1]} />
            <path d={`M0 ${half} ${size} 0v${depth}L0 ${half + depth}Z`} fill={colors[2]} />
            <path d={`M${-half - 1} ${half + 2}h3v2h-3z M${half - 2} ${half + 1}h2v2h-2z`} fill="#f8d7e1" opacity=".55" />
          </g>
        );
      })}
    </g>
  );
}

export function CherryBlossomBranch() {
  return (
    <div className="corner-blossom" aria-hidden="true">
      <svg className="corner-blossom-art" viewBox="0 0 430 184" shapeRendering="crispEdges" focusable="false">
        <VoxelLeafCluster x={212} y={7} scale={1.35} />
        <VoxelLeafCluster x={295} y={13} scale={1.22} />

        <g>
          <path fill="#4a302c" d="M430 14h-38l-35 14-27 19-48 17-32-9-26-16-41-6-12 8 47 12 27 18 37 12 56-20 26-18 39-13h27z" />
          <path fill="#704632" d="M430 14h-38l-35 14-27 19-48 17-32-9-26-16-41-6-12 8 48 9 28 17 36 12 51-19 28-19 40-15h28z" />
          <path fill="#95613f" d="M430 14h-38l-35 14-27 19-48 17-32-9-26-16-41-6-6 4 46 7 26 17 34 11 48-18 28-19 41-15h30z" />
          <path fill="#4a302c" d="M326 57l-25 28-33 13-25 23-17 2v-8l12-5 25-22 31-14 20-20zM260 66l-41 7-24 19-50 4-16 8-12-7 26-13 48-5 23-17 38-7zM430 75l-27 11-13 26-16 9 4 10 23-11 16-25 13-5z" />
          <path fill="#704632" d="M317 56l-23 23-31 13-24 22-12 3 11 2 29-22 31-13 23-24zM250 60l-35 6-23 17-48 6-17 8 16-3 51-6 23-17 36-6zM430 78l-25 13-10 24-14 9 18-5 14-25 17-10z" />
          <path fill="#b47b50" opacity=".62" d="m337 48 13-7 1 3-13 7zM291 64l14-5 1 3-14 5zM245 57l9 4-1 2-9-4zM250 105l7-6 2 2-7 6zM395 22h12v2h-12z" />
        </g>

        <VoxelLeafCluster x={67} y={56} scale={1.12} className="corner-blossom-outer" />
        <VoxelLeafCluster x={126} y={34} scale={1.4} className="corner-blossom-outer" />
        <VoxelLeafCluster x={184} y={62} scale={1.43} />
        <VoxelLeafCluster x={230} y={94} scale={1.07} className="corner-blossom-under" />
        <VoxelLeafCluster x={414} y={93} scale={.89} />
      </svg>
      <CornerPetals />
    </div>
  );
}