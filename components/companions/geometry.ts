type SitePoint = { x: number; y: number };

const obstacles = ".mario-door, .voxel-portal svg, [data-mario-obstacle='tree-trunk'], .scene-target, .theme-lantern, a, button";

function clearSpan(x: number, ground: number, width: number, height: number, surface: HTMLElement) {
  return Array.from(document.querySelectorAll(obstacles)).every(obstacle => {
    if (obstacle.matches(".header-mario-runner, .voxel-character-control, .voxel-portal")) return true;
    const box = obstacle.getBoundingClientRect();
    if (!box.width || !box.height) return true;
    if (surface.contains(obstacle) && obstacle.matches(".scene-target")) return true;
    if (surface.matches(".mario-stop") && obstacle.matches(".project-card") && obstacle.contains(surface)) return true;
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

const greetingRange = 185;
const maxApproach = 52;
export const greetingReach = greetingRange + maxApproach;

export function greetingApproach(mario: DOMRect, steve: DOMRect, surface: HTMLElement) {
  const gap = Math.max(mario.left - steve.right, steve.left - mario.right);
  if (Math.abs(mario.bottom - steve.bottom) > 2 || gap < 10 || gap > greetingReach) return null;
  if (gap <= greetingRange) return 0;

  const direction = mario.left < steve.left ? -1 : 1;
  const step = Math.min(maxApproach, gap - 145) * direction;
  const bounds = surface.getBoundingClientRect();
  const end = steve.left + step;
  if (end < bounds.left || end + steve.width > bounds.right ||
    !clearSpan(Math.min(steve.left, end), steve.bottom, steve.width + Math.abs(step), steve.height, surface)) return null;
  return step;
}
