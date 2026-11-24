type SitePoint = { x: number; y: number };

const obstacles = ".mario-door, .voxel-portal svg, [data-mario-obstacle='tree-trunk'], .scene-target, .theme-lantern, a, button";

function clearSpan(x: number, ground: number, width: number, height: number, surface: HTMLElement) {
  return Array.from(document.querySelectorAll(obstacles)).every(obstacle => {
    if (obstacle.matches(".header-mario-runner, .voxel-character-control, .voxel-portal") ||
      obstacle.closest(".companion-panel")) return true;
    const box = obstacle.getBoundingClientRect();
    if (!box.width || !box.height) return true;
    if (surface.contains(obstacle) && obstacle.matches(".scene-target")) return true;
    return x + width <= box.left - 2 || x >= box.right + 2 ||
      ground <= box.top + .5 || ground - height >= box.bottom + 2;
  });
}

export function landing(receiver: DOMRect, traveler: DOMRect, surface: HTMLElement, gap = 12, preferredSide?: number): (SitePoint & { side: number }) | null {
  const bounds = surface.getBoundingClientRect();
  for (const side of preferredSide === undefined ? [1, -1] : [preferredSide]) {
    const x = side > 0 ? receiver.right + gap : receiver.left - gap - traveler.width;
    const ground = bounds.bottom;
    if (x >= bounds.left && x + traveler.width <= bounds.right &&
      clearSpan(x, ground, traveler.width, traveler.height, surface)) {
      return { x, y: ground - traveler.height, side };
    }
  }
  return null;
}

export function originPipe(origin: DOMRect, surface: HTMLElement) {
  const bounds = surface.getBoundingClientRect();
  const width = origin.width;
  for (const step of [30, 20, 46, 10]) {
    for (const direction of [-1, 1]) {
      const x = origin.left + step * direction;
      if (x < bounds.left || x + width > bounds.right) continue;
      const edge = Math.min(x, origin.left);
      const path = Math.abs(x - origin.left) + width;
      if (clearSpan(edge, bounds.bottom, path, origin.height, surface)) return x;
    }
  }
  return null;
}

export const encounterGap = (a: DOMRect, b: DOMRect) => Math.max(a.left - b.right, b.left - a.right);
