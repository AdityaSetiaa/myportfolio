type Point = { x: number; y: number };
export type LeafGround = { left: number; width: number; y: number; origins: Point[] };

export function measureLeafGround(hero: HTMLElement, divider: HTMLElement, branch: SVGSVGElement): LeafGround | null {
  const style = getComputedStyle(divider);
  if (!parseFloat(style.borderTopWidth) || style.borderTopStyle === "none" || style.borderTopColor === "rgba(0, 0, 0, 0)") return null;
  const heroBox = hero.getBoundingClientRect();
  const line = divider.getBoundingClientRect();
  const right = Math.min(heroBox.right, line.right, document.documentElement.clientWidth) - 4;
  const left = Math.max(heroBox.left, line.left, right - 360) + 4;
  let spans = [{ left, right }];
  const obstacles = hero.querySelectorAll(".voxel-world, [data-mario-obstacle='tree-trunk'], a, button");
  for (const object of obstacles) {
    const rect = object.getBoundingClientRect();
    if (!rect.width || rect.bottom < line.top - 24 || rect.top >= line.top) continue;
    spans = spans.flatMap(span => {
      if (rect.left - 7 >= span.right || rect.right + 7 <= span.left) return [span];
      return [
        { left: span.left, right: rect.left - 7 },
        { left: rect.right + 7, right: span.right },
      ].filter(room => room.right - room.left >= 30);
    });
  }
  const span = spans.reverse().find(room => room.right - room.left >= 34);
  if (!span) return null;
  const width = Math.min(innerWidth <= 700 ? 60 : 120, Math.floor(span.right - span.left) - 2);
  const x = Math.ceil(span.right - width - 1);
  const origins: Point[] = [];
  // Sample only the painted side faces of the existing voxel blocks.
  for (const face of branch.querySelectorAll<SVGPathElement>("[data-cherry-leaf]")) {
    const rect = face.getBoundingClientRect();
    if (!rect.width || rect.bottom < 0 || rect.left >= innerWidth) continue;
    const matrix = face.getScreenCTM();
    if (!matrix) continue;
    const bounds = face.getBBox();
    for (let i = 0; i < 3; i++) {
      const point = new DOMPoint(bounds.x + bounds.width * Math.random(), bounds.y + bounds.height * (.38 + Math.random() * .61));
      if (!face.isPointInFill(point)) continue;
      const source = point.matrixTransform(matrix);
      if (source.x >= 3 && source.x <= innerWidth - 7 && source.y >= 0 && source.y < innerHeight) {
        origins.push({ x: source.x, y: source.y });
      }
    }
  }
  return { left: x - heroBox.left, width, y: line.top - heroBox.top, origins };
}
