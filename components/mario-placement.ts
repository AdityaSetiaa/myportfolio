type Span = { left: number; right: number };

const clearance = 4;
const borderSelector = "[data-mario-platform]";
const obstacleSelector = "a, button, input, select, textarea, svg:not(.hero-biome-art), [data-mario-obstacle], img, .project-visual, [contenteditable]";

export function measureMarioPlatform(slot: HTMLElement, mobile: boolean) {
  const platform = slot.parentElement!;
  const bounds = platform.getBoundingClientRect();
  const style = getComputedStyle(platform);
  const bottom = platform.dataset.marioPlatform === "bottom";
  const border = Number.parseFloat(bottom ? style.borderBottomWidth : style.borderTopWidth);
  const color = bottom ? style.borderBottomColor : style.borderTopColor;
  const edgeStyle = bottom ? style.borderBottomStyle : style.borderTopStyle;
  if (!border || edgeStyle === "none" || edgeStyle === "hidden" ||
    color === "transparent" || color === "rgba(0, 0, 0, 0)" || !bounds.width) return false;

  const ground = bottom ? bounds.bottom - border : bounds.top;
  const size = Number.parseFloat(getComputedStyle(slot).getPropertyValue("--size"));
  const height = 1.5 * size;
  const rail = mobile ? null : document.querySelector(".desktop-nav")?.getBoundingClientRect();
  const left = Math.max(bounds.left + platform.clientLeft, clearance, (rail?.right ?? 0) + clearance);
  const right = Math.min(bounds.left + platform.clientLeft + platform.clientWidth,
    document.documentElement.clientWidth - clearance);
  let spans: Span[] = [{ left, right }];

  function avoid(rect: DOMRect) {
    if (!rect.width || !rect.height || rect.top >= ground - .5 ||
      rect.bottom <= ground - height - clearance) return;
    const start = rect.left - clearance;
    const end = rect.right + clearance;
    spans = spans.flatMap(span => {
      if (end <= span.left || start >= span.right) return [span];
      return [
        { left: span.left, right: start },
        { left: end, right: span.right },
      ].filter(part => part.right - part.left >= size * 2.5);
    });
  }

  // Include neighboring sections because Mario stands above the border he is using.
  const content = platform.closest(".portfolio-sections")!;
  for (const obstacle of content.querySelectorAll(obstacleSelector)) {
    // Card borders can be used if their contents clear the walking band.
    if (obstacle !== platform) avoid(obstacle.getBoundingClientRect());
  }
  const sections = content.querySelectorAll("section");
  const range = document.createRange();
  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    if (rect.top > ground + clearance || rect.bottom < ground - height - clearance) continue;
    const textNodes = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
    for (let node = textNodes.nextNode(); node; node = textNodes.nextNode()) {
      if (!node.textContent?.trim() || node.parentElement?.closest("svg, .mario-stop")) continue;
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) avoid(rect);
    }
  }

  const path = spans.sort((a, b) => (b.right - b.left) - (a.right - a.left))[0];
  if (!path || path.right - path.left < size * 2.5) return false;
  Object.assign(slot.style, {
    left: `${path.left - bounds.left - platform.clientLeft}px`,
    width: `${path.right - path.left}px`,
    height: `${height}px`,
    top: bottom ? "" : `${-height - platform.clientTop}px`,
    bottom: bottom ? "0" : "",
  });
  slot.dataset.side ??= Math.random() < .5 ? "left" : "right";
  return true;
}

export const marioPlatformSelector = `${borderSelector} > .mario-stop[data-ready]`;