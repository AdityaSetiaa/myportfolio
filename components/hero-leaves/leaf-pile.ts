export const leafColors = ["#F2C3D0", "#D58B9B", "#CE8DA5", "#AE718B"];
export const leafSizes = [3, 4, 6];
export const pileLimit = 20;
const profile = [2, 5, 4, 2, 0, 6, 10, 12, 16, 18, 20, 18, 16, 13, 9, 7, 9, 14, 17, 20, 16, 14, 10, 8, 4, 0, 5, 4, 3, 2];
const columns = profile.length;
const storageKey = "hero-leaves-v1";
type Cell = { height: number; color: number };
type Progress = {
  cells: Cell[];
  seen: number[];
  recent: string[];
  reactedAt: number;
  requests: number;
};

let progress: Progress | undefined;

export function leafProgress() {
  if (progress) return progress;
  const initial: Progress = {
    cells: Array.from({ length: columns }, () => ({ height: 0, color: 0 })),
    seen: [], recent: [], reactedAt: 0, requests: 0,
  };
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null") as Partial<Progress> | null;
    if (saved?.cells?.length === columns && saved.cells.every(cell =>
      cell && Number.isInteger(cell.height) && cell.height >= 0 && cell.height <= pileLimit &&
      Number.isInteger(cell.color) && cell.color >= 0 && cell.color < leafColors.length)) initial.cells = saved.cells;
    if (Array.isArray(saved?.seen)) initial.seen = saved.seen.filter(value => [4, 8, 12, 16].includes(value));
    if (Array.isArray(saved?.recent)) initial.recent = saved.recent.filter(value => typeof value === "string" && value.length <= 110).slice(-3);
    if (typeof saved?.reactedAt === "number") initial.reactedAt = Math.min(Date.now(), saved.reactedAt);
    if (Number.isInteger(saved?.requests)) initial.requests = Math.max(0, Math.min(2, saved!.requests!));
  } catch { /* In-memory progress also works in private browsing. */ }
  progress = initial;
  return initial;
}

export function saveLeaves() {
  try { if (progress) sessionStorage.setItem(storageKey, JSON.stringify(progress)); } catch { /* Storage is optional. */ }
}

export function createLeafPile(svg: SVGSVGElement) {
  const state = leafProgress();
  const art = svg.querySelector("g")!;
  const paths = Array.from(art.querySelectorAll("path"));
  let columnWidth = 1;

  function fit(width: number) {
    columnWidth = Math.max(1, Math.floor(width / columns));
    svg.setAttribute("width", String(columnWidth * columns));
    return columnWidth * columns;
  }

  function destination(size: number, fraction?: number) {
    const count = Math.ceil(size / columnWidth);
    const random = (Math.random() + Math.random() + Math.random()) / 3;
    const position = fraction === undefined ? random : fraction * .68 + random * .32;
    let start = Math.max(0, Math.min(columns - count, Math.round(position * (columns - count))));
    if (count === 1 && !profile[start]) start++;
    return { start, count, x: start * columnWidth };
  }

  function surface(start: number, count: number) {
    return Math.max(...state.cells.slice(start, start + count).map(cell => cell.height));
  }

  function land(start: number, count: number, size: number, color: number) {
    const peak = Math.min(pileLimit, surface(start, count) + size);
    for (let index = start; index < start + count; index++) {
      const cell = state.cells[index];
      const stagger = index === start ? 0 : Math.floor(Math.random() * 3);
      cell.height = Math.max(cell.height, Math.min(profile[index], peak - stagger));
      cell.color = (color + (index - start)) % leafColors.length;
    }
  }

  function paint(ground: number, still: boolean) {
    const pixels = leafColors.map(() => "");
    const cells = still ? state.cells.map((_, index) => ({
      height: [0, 0, 0, 2, 3, 2, 0, 0, 0, 2, 4, 3, 0][index % 13], color: index % leafColors.length,
    })) : state.cells;
    for (const [index, { height, color }] of cells.entries()) {
      if (!height) continue;
      const x = index * columnWidth;
      const lower = Math.max(0, height - 4);
      const rectangle = (y: number, h: number) => `M${x} ${y}h${columnWidth}v${h}h-${columnWidth}Z`;
      if (lower) pixels[(color + 2) % pixels.length] += rectangle(pileLimit - lower, lower);
      pixels[color] += rectangle(pileLimit - height, height - lower);
    }
    paths.forEach((path, index) => path.setAttribute("d", pixels[index]));
    return Math.max(0, Math.round(ground - (pixels.some(Boolean) ? art.getBoundingClientRect().top : ground)));
  }

  return { destination, fit, land, paint, surface };
}
