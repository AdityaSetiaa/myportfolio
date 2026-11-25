function Lantern() {
  return (
    <svg className="login-art-lantern" viewBox="0 0 120 132" shapeRendering="crispEdges" focusable="false">
      <g>
        <path fill="#301d19" d="M1 2h108v4h5v20H51v8h-7v8h-7v9h-8v10H8V22H1z" />
        <path fill="#75442b" d="M13 25h34v6h-7v8h-7v8h-7v9H13z" />
        <path fill="#ad693c" d="M14 28h23v5h-7v8h-6v9h-8v5h-3z" />
        <path fill="#d09050" d="M4 5h101v4H4zM13 32h4v11h-4z" />
        <path fill="#92552f" d="M4 9h101v12H4z" />
        <path fill="#583422" d="M109 9h3v15H4v-3h101V9zM20 13h30v3H20zm39 3h25v3H59zM33 46h4v6h-4z" />
        <path fill="#bb7945" d="M11 9h5v4h-5zm43 1h7v7h-7zm30 2h14v4H84zM18 18h9v3h-9zm51-8h10v3H69z" />
        <path fill="#d29055" d="M5 9h3v8H5zm13 0h4v3h-4zm64-4h12v3H82z" />
        <path fill="#573321" d="M28 5h3v16h-3zm70 5h3v11h-3z" />
      </g>
      <g>
        <path fill="#32232a" d="M30 47h9v6h3v21h5v7h8v7h7v35h3v7H8v-7h3V88h6v-7h7v-7h6z" />
        <path fill="#8b6762" d="M32 50h6v5h-6zm-3 10h7v7h-7zm5 7h5v7h-5zM23 81h25v3H23z" />
        <path fill="#5e4142" d="M32 55h7v5h-7zm-1 20h12v7H31zM16 85h40v7H16zM10 122h52v6H10z" />
        <path fill="#a2786b" d="M16 86h39v3H16zm-4 37h48v3H12z" />
        <path fill="#75483a" d="M13 92h45v30H13z" />
        <path fill="#ca763c" d="M17 94h36v25H17z" />
        <path fill="#ffbe56" d="M20 97h11v20H20zm17-1h14v21H37z" />
        <path fill="#ffe2a0" d="M22 103h5v9h-5zm17-1h9v12h-9z" />
        <path fill="#fff1bd" d="M40 105h6v7h-6z" />
        <path fill="#9d5a35" d="M18 96h3v22h-3zM50 94h4v24h-4z" />
        <path fill="#654542" d="M29 92h6v30h-6z" />
        <path fill="#ad7c65" d="M30 93h2v25h-2zM13 117h4v5h-4zm41-1h4v6h-4z" />
        <path fill="#4a302f" d="M24 84h4v3h-4zm9 41h13v3H33z" />
      </g>
    </svg>
  );
}

const blossoms = [
  [1, 32, 13], [10, 29, 15], [23, 20, 18], [33, 33, 16], [43, 28, 17],
  [57, 35, 16], [66, 23, 16], [79, 28, 19], [88, 18, 16], [100, 31, 19],
  [111, 22, 18], [124, 28, 16], [134, 19, 17], [142, 28, 17], [154, 15, 16],
  [165, 24, 18], [173, 13, 18], [189, 8, 18], [199, 0, 17], [206, 16, 20],
  [222, 11, 16], [235, 20, 17], [244, 8, 16], [256, 16, 18], [270, 13, 17],
  [282, 22, 16], [292, 18, 19], [304, 26, 16], [318, 26, 18], [327, 33, 17],
  [317, 46, 16], [306, 54, 18], [322, 62, 15], [333, 49, 15], [340, 30, 14],
] as const;

const blossomColors = [
  ["#edadc4", "#c9789b", "#9e5576", "#f7c3d3"],
  ["#d78eae", "#b3688a", "#844760", "#e9a8be"],
  ["#e6a4bd", "#c17a9b", "#9b5774", "#f2c3d0"],
] as const;

function Blossoms() {
  return (
    <svg className="login-art-blossoms" viewBox="0 0 357 90" shapeRendering="crispEdges" focusable="false">
      <path fill="#3d2a2b" d="M3 38h49v-5h34v-8h42v4h38V17h56v7h57v7h35v6h23v12h-9v15h-9V51h-19V40h-26v-6h-54v-4h-51v10h-46v-4H85v8H53v5H3z" />
      <path fill="#6a403a" d="M22 39h37v-5h55v-7h28v7h-26v6H64v6H22zm135-8h35v-7h39v5h-38v7h-36zm101 0h40v7h24v7h-26v-8h-38z" />
      <path fill="#223524" d="M26 34h20v21h-7v9h-8V49h-5zm32 5h14v18h-8zm25-5h16v16H83zm27-4h9v22h-9zm38-6h17v24h-8v12h-8zm45-23h18v26h-11zm38 19h14v21h-14zm40 10h13v18h-13zm45 13h21v8h9v15h-8v11h-8V58h-14z" />
      <path fill="#3a5135" d="M30 43h8v11h-8zm57-8h8v8h-8zm44 1h8v10h-8zm23 7h8v10h-8zm48-41h9v8h-9zm26 21h8v11h-8zm48 11h7v10h-7zm48 21h10v12h-10zm12 10h7v10h-7z" />
      {blossoms.map(([x, y, size], index) => {
        const [top, front, side, fleck] = blossomColors[index % blossomColors.length];
        return <svg key={x + ":" + y} x={x} y={y} width={size} height={size} viewBox="0 0 18 18">
          <path fill={side} d="M0 5h4V2h10v3h4v8h-4v5H5v-4H0z" />
          <path fill={front} d="M1 7h7v3h7v5h-4v3H5v-5H1z" />
          <path fill={top} d="M4 2h5V0h5v3h4v5h-5v3H7V8H1V5h3z" />
          <path fill={fleck} d={index % 2 ? "M5 4h4v3H5zm5 6h3v3h-3z" : "M9 2h4v4H9zM3 8h3v4H3z"} />
          <path fill="#a25b75" d="M14 9h3v4h-3z" opacity=".65" />
        </svg>;
      })}
      <path fill="#f5b782" d="M79 37h3v3h-3zm83-14h3v3h-3zm93-4h3v3h-3zm88 15h3v3h-3z" />
    </svg>
  );
}

function Brick({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path fill="#301e20" d="M0 0h34v33H0z" />
      <path fill="#783824" d="M2 2h30v28H2z" />
      <path fill="#a75133" d="M3 3h28v7H3zm0 10h28v7H3zm0 10h28v6H3z" />
      <path fill="#d48453" d="M3 3h28v2H3zm0 10h28v2H3zm0 10h28v2H3z" />
      <path fill="#542b23" d="M3 10h28v3H3zm0 10h28v3H3zM15 3h3v8h-3zm-5 11h3v7h-3zm14 0h3v7h-3zm-8 10h3v6h-3z" />
      <path fill="#ba6843" d="M5 6h6v2H5zm16 0h7v2h-7zm-4 10h4v2h-4zM5 25h7v2H5zm18 1h5v2h-5z" />
    </g>
  );
}

function QuestionRow() {
  return (
    <svg className="login-art-blocks" viewBox="0 0 110 43" shapeRendering="crispEdges" focusable="false">
      <Brick x={0} y={6} />
      <Brick x={76} y={6} />
      <path fill="#3e261c" d="M36 1h38v3h3v35h-3v3H36v-3h-3V4h3z" />
      <path fill="#cb842c" d="M37 3h35v3h3v32h-3v2H37v-2h-2V6h2z" />
      <path fill="#eda940" d="M38 5h33v2h2v29h-3v2H38v-2h-2V7h2z" />
      <path fill="#ffcf69" d="M38 5h33v2H40v3h-2zM38 9h2v24h-2z" />
      <path fill="#754218" d="M40 8h3v3h-3zm26 0h3v3h-3zm-26 25h3v3h-3zm26 0h3v3h-3z" />
      <path fill="#b87829" d="M48 14h15v2h3v10h-6v3h-4v3h-7v-8h7v-4h-5v4h-7v-8h4zm1 19h8v5h-8z" />
      <path fill="#fff4d7" d="M46 12h14v2h3v9h-6v3h-4v3h-6v-7h7v-4h-6v3h-6v-7h4zm1 19h7v5h-7z" />
      <path fill="#ddbd8e" d="M57 19h3v4h-3zm-8 7h4v3h-4zm-2 8h7v2h-7z" />
    </svg>
  );
}

function Pipe() {
  return (
    <svg className="login-art-pipe" viewBox="0 0 62 43" shapeRendering="crispEdges" focusable="false">
      <path fill="#202920" d="M1 1h60v21h-5v21H6V22H1z" />
      <path fill="#436b2c" d="M9 20h44v23H9z" />
      <path fill="#537e36" d="M13 21h29v22H13z" />
      <path fill="#7ba841" d="M16 22h11v21H16zm13 0h5v21h-5z" />
      <path fill="#a4c450" d="M19 23h7v20h-7z" />
      <path fill="#34592c" d="M43 21h7v22h-7zm-33 0h3v22h-3z" />
      <path fill="#2e4725" d="M3 4h56v15H3z" />
      <path fill="#68963b" d="M5 8h52v9H5z" />
      <path fill="#a7c957" d="M5 7h52v2H5zm13 2h8v8h-8z" />
      <path fill="#40642d" d="M46 9h8v8h-8zm-10 0h4v8h-4z" />
      <path fill="#779e44" d="M9 8h4v9H9zm20 2h5v7h-5z" />
    </svg>
  );
}

export function LoginArtwork() {
  return (
    <div className="login-artwork" aria-hidden="true">
      <Lantern />
      <Blossoms />
      <QuestionRow />
      <div className="login-art-ground" />
      <Pipe />
      <svg className="login-art-brick-stack" viewBox="0 0 67 64" preserveAspectRatio="none" shapeRendering="crispEdges" focusable="false">
        <Brick x={0} y={31} /><Brick x={33} y={31} /><Brick x={0} y={0} />
      </svg>
      <span className="login-art-petal login-art-petal-left" />
      <span className="login-art-petal login-art-petal-right" />
      <span className="login-art-petal login-art-petal-lower" />
    </div>
  );
}
