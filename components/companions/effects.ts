export function animate(el: Element, frames: Keyframe[], duration: number, signal: AbortSignal, easing = "ease-in-out") {
  signal.throwIfAborted();
  const animation = el.animate(frames, { duration, fill: "forwards", easing });
  const cancel = () => animation.cancel();
  signal.addEventListener("abort", cancel, { once: true });
  return animation.finished.then(() => {
    signal.throwIfAborted();
    animation.commitStyles();
  }).finally(() => {
    signal.removeEventListener("abort", cancel);
    animation.cancel();
  });
}

export function delay(duration: number, signal: AbortSignal) {
  signal.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = window.setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, duration);
    signal.addEventListener("abort", abort, { once: true });
  });
}

export function mark(layer: HTMLElement, name: string, x: number, y: number) {
  const element = document.createElement("span");
  element.className = name;
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  layer.append(element);
  return element;
}

export function avatar(layer: HTMLElement, sprite: HTMLElement | SVGElement, rect: DOMRect, character: string) {
  const parent = sprite.parentNode!;
  const next = sprite.nextSibling;
  const element = mark(layer, `companion-traveler companion-traveler-${character}`, rect.x, rect.y);
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
  element.style.setProperty("--facing", "1");
  element.append(sprite);
  return {
    element,
    restore() { parent.insertBefore(sprite, next?.parentNode === parent ? next : null); element.remove(); },
  };
}
