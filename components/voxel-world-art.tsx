export function VoxelPortalArt() {
  return (
    <svg viewBox="0 0 30 44" aria-hidden="true" shapeRendering="crispEdges">
      <path fill="#26182d" d="M3 0h24v3h3v41H0V4h3z" />
      <path fill="#40304d" d="M3 0h24v4H3zM0 14h4v13H0zM1 29h3v11H1z" />
      <path fill="#5d4767" d="M5 2h7v2H5zM2 9h3v3H2zM1 23h3v2H1zM21 40h5v2h-5z" />
      <path fill="#18121e" d="M24 5h6v39h-6zM0 41h24v3H0z" />
      <path fill="#573674" d="M5 5h20v35H5z" />
      <path className="voxel-portal-energy" fill="#824b9d" d="M6 6h17v32H6z" />
      <path className="voxel-portal-ripples" fill="#c18bd8" d="M7 8h6v2h-3v2H7zM15 15h7v2h-5v2h-2zM8 24h7v2h-3v3H8zM16 31h5v3h-3v3h-2z" />
      <path fill="#88649a" d="M24 8h2v4h-2zM24 22h2v3h-2zM5 38h19v2H5z" />
    </svg>
  );
}

export function VoxelExplorerArt() {
  return (
    <svg viewBox="0 0 24 32" shapeRendering="crispEdges" aria-hidden="true">
      <g className="voxel-legs">
        <path fill="#38304d" d="M6 22h6v8H6z" />
        <path fill="#493e64" d="M12 22h6v8h-6z" />
        <path fill="#231e2d" d="M5 29h7v3H5zM12 29h8v3h-8z" />
      </g>
      <path fill="#477674" d="M6 13h12v10H6z" />
      <path fill="#669f97" d="M7 13h4v8H7z" />
      <path fill="#2d5357" d="M15 15h3v8h-3z" />
      <path fill="#68494c" d="M4 13h4v9H4z" />
      <path fill="#ad7963" d="M3 18h4v5H3z" />
      <g className="voxel-pick-arm">
        <path fill="#4c8581" d="M17 13h4v6h-4z" />
        <path fill="#c38c72" d="M18 18h4v5h-4z" />
        <g className="voxel-pickaxe">
          <path fill="#8b6355" d="M22 15h2v11h-2z" />
          <path fill="#82c0be" d="M17 12h7v3h-2v2h-2v-2h-3z" />
        </g>
      </g>
      <g className="voxel-explorer-head">
        <path fill="#573a37" d="M6 1h12v11H6z" />
        <path fill="#bb876d" d="M9 5h10v7H9z" />
        <path fill="#daaa89" d="M10 6h7v4h-7z" />
        <path fill="#3e3039" d="M15 7h3v2h-3zM13 11h5v1h-5z" />
        <path fill="#79514c" d="M6 3h4v8H6z" />
      </g>
    </svg>
  );
}

export function VoxelOre({ hits }: { hits: number }) {
  return (
    <svg className="voxel-ore" viewBox="0 0 22 19" aria-hidden="true" shapeRendering="crispEdges">
      <path fill="#827083" d="M0 5 11 0 22 5l-11 5z" />
      <path fill="#625464" d="M0 5l11 5v9L0 14z" />
      <path fill="#473c50" d="M11 10l11-5v9l-11 5z" />
      <path fill="#80c9bf" d="M7 4h3v2H7zM3 9l3 1v2l-3-1zM14 11l4-2v2l-4 2z" />
      <path fill="#b6e1d1" d="M13 3h2v2h-2zM7 13h2v2H7zM18 12h2v2h-2z" />
      {hits > 0 && <path stroke="#332a39" fill="none" d="m12 1-2 4 1 4-1 4" />}
      {hits > 1 && <path stroke="#332a39" fill="none" d="m6 8 2 3 3 1 4 1 2 2" />}
    </svg>
  );
}

export function VoxelWorldProps() {
  return (
    <svg className="voxel-world-props" viewBox="0 0 38 20" aria-hidden="true" shapeRendering="crispEdges">
      <path fill="#694e4d" d="M0 6 9 2l9 4-9 4z" />
      <path fill="#b58263" d="M0 6l9 4v10l-9-4z" />
      <path fill="#775256" d="M9 10l9-4v10l-9 4z" />
      <path fill="#50383d" d="m2 9 5 2v2l-5-2zM3 13l2 1v3l-2-1zM11 11l5-3v2l-5 3z" />
      <path fill="#a57566" d="M5 5h3v2H5zM10 4h3v2h-3z" />
      <path className="voxel-tuft" fill="#87916e" d="M24 20v-7h2v3h2v-6h2v6h2v-3h2v7z" />
    </svg>
  );
}