import { between } from "../companions/behavior";
import { measureLeafGround, type LeafGround } from "./leaf-geometry";
import { createLeafPile, leafColors, leafSizes, pileLimit, saveLeaves } from "./leaf-pile";

export function startFallingLeaves(layer: HTMLDivElement, tray: SVGSVGElement, onPile: (height: number) => void) {
  const hero = layer.parentElement;
  const divider = hero?.nextElementSibling;
  const branch = document.querySelector<SVGSVGElement>(".corner-blossom-art");
  if (!hero || !(divider instanceof HTMLElement) || !branch) return;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const compact = matchMedia("(max-width: 700px)");
  const pile = createLeafPile(tray);
  let ground: LeafGround | null = null;
  let width = 0, timer = 0, saveTimer = 0;
  let inView = false, disposed = false;
  const flights = new Map<HTMLElement, { animation: Animation; start: number; count: number }>();
  const visible = () => inView && !document.hidden;
  const canSpawn = () => !disposed && !document.hidden && !motion.matches && ground !== null;

  function render() {
    if (!ground || !visible()) { onPile(0); return; }
    const bottom = tray.getBoundingClientRect().bottom;
    const height = pile.paint(bottom, motion.matches);
    onPile(motion.matches ? 0 : height);
  }

  function record() {
    if (!saveTimer) saveTimer = window.setTimeout(() => { saveTimer = 0; saveLeaves(); }, 5000);
  }

  function fall() {
    if (!ground || !hero || !ground.origins.length || flights.size >= (compact.matches ? 12 : 16)) return;
    const heroBox = hero.getBoundingClientRect();
    const size = leafSizes[Math.floor(between(0, leafSizes.length))];
    const color = Math.floor(between(0, leafColors.length));
    const source = ground.origins[Math.floor(between(0, ground.origins.length))];
    const drift = between(20, 60) * (Math.random() < .5 ? -1 : 1);
    const preferred = Math.max(0, Math.min(1, (source.x + drift - heroBox.left - ground.left) / width));
    const destination = Array.from({ length: 8 }, () => pile.destination(size, preferred)).find(spot =>
      [...flights.values()].every(flight => spot.start + spot.count <= flight.start || flight.start + flight.count <= spot.start));
    if (!destination) return;
    const x = ground.left + destination.x;
    const endX = heroBox.left + x;
    const nearby = ground.origins.filter(point => Math.abs(point.x - endX) < 68);
    const origin = nearby.length ? nearby[Math.floor(between(0, nearby.length))]
      : ground.origins.reduce((best, point) => Math.abs(point.x - endX) < Math.abs(best.x - endX) ? point : best, source);
    const y = ground.y - size - pile.surface(destination.start, destination.count);
    const startX = Math.round(origin.x - heroBox.left), startY = Math.round(origin.y - heroBox.top);
    const dx = x - startX, dy = y - startY;
    if (dy < 40) return;
    const leaf = document.createElement("span");
    leaf.className = "hero-falling-leaf";
    leaf.style.cssText = `left:${startX}px;top:${startY}px;width:${size}px;height:${size}px;background:${leafColors[color]}`;
    layer.append(leaf);
    const sway = between(-10, 10);
    const frame = (x: number, y: number, offset: number, turn: number, opacity: number) => ({
      transform: `translate(${x}px,${y}px) rotate(${turn}deg)`, offset, opacity,
    });
    const twist = Math.random() < .55 ? 90 : 0;
    const animation = leaf.animate([
      frame(0, 0, 0, 0, .22),
      frame(dx * .17 + sway, dy * .24, .29, 0, .88),
      frame(dx * .52 - sway, dy * .59, .64, 0, .92),
      frame(dx * .52 - sway, dy * .6, .65, twist, .92),
      frame(dx, dy, 1, twist, .94),
    ], { duration: between(5000, 9000), easing: "linear", fill: "forwards" });
    flights.set(leaf, { animation, start: destination.start, count: destination.count });
    animation.onfinish = () => {
      if (!flights.delete(leaf)) return;
      leaf.remove();
      animation.cancel();
      pile.land(destination.start, destination.count, size, color);
      render();
      record();
    };
  }

  function schedule() {
    window.clearTimeout(timer);
    if (!canSpawn()) return;
    timer = window.setTimeout(() => {
      if (!canSpawn()) return;
      if (visible()) fall();
      else {
        // Accumulate a small batch in memory while the hero is out of view.
        for (let i = 0; i < (compact.matches ? 3 : 4); i++) {
          const size = leafSizes[Math.floor(between(0, leafSizes.length))];
          const { start, count } = pile.destination(size);
          pile.land(start, count, size, Math.floor(between(0, leafColors.length)));
        }
        record();
      }
      schedule();
    }, visible() ? between(compact.matches ? 850 : 600, 1200) : between(4500, 6000));
  }

  function clearFlights() {
    for (const [leaf, { animation }] of flights) {
      animation.cancel();
      leaf.remove();
    }
    flights.clear();
  }
  function sync() {
    if (!visible() || motion.matches) clearFlights();
    render();
    schedule();
  }
  function measure() {
    if (!hero || !branch || !(divider instanceof HTMLElement)) return;
    ground = measureLeafGround(hero, divider, branch);
    tray.toggleAttribute("hidden", !ground);
    if (ground) {
      width = pile.fit(ground.width);
      tray.style.left = `${ground.left}px`;
      tray.style.top = `${ground.y - pileLimit}px`;
    }
    clearFlights();
    sync();
  }
  function onVisibility() {
    if (document.hidden) {
      window.clearTimeout(saveTimer);
      saveTimer = 0;
      saveLeaves();
    }
    sync();
  }

  const resize = new ResizeObserver(measure);
  resize.observe(hero);
  resize.observe(divider);
  resize.observe(branch);
  const observer = new IntersectionObserver(([entry]) => {
    const wasVisible = inView;
    inView = entry.intersectionRatio >= .18;
    if (inView !== wasVisible) sync();
  }, { threshold: [0, .18] });
  observer.observe(hero);
  window.addEventListener("resize", measure);
  window.addEventListener("pagehide", saveLeaves);
  document.addEventListener("visibilitychange", onVisibility);
  motion.addEventListener("change", sync);
  void document.fonts.ready.then(() => { if (!disposed) measure(); });
  measure();

  return () => {
    disposed = true;
    clearFlights();
    clearTimeout(timer);
    clearTimeout(saveTimer);
    saveLeaves();
    resize.disconnect();
    observer.disconnect();
    window.removeEventListener("resize", measure);
    window.removeEventListener("pagehide", saveLeaves);
    document.removeEventListener("visibilitychange", onVisibility);
    motion.removeEventListener("change", sync);
  };
}
