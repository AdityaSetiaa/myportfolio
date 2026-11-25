import { behaviorContext, type Character, type BehaviorContext } from "@/data/companion-contract";

export type Actor = {
  sprite: HTMLElement | SVGElement;
  control: HTMLButtonElement;
  platform: HTMLElement;
  ready: () => boolean;
};

const actors = new Map<Character, Actor>();
let locked = false;

export function registerActor(character: Character, actor: Actor) {
  actors.set(character, actor);
  return () => { if (actors.get(character) === actor) actors.delete(character); };
}
export function actorFor(character: Character) { return actors.get(character); }
export function companionsReserved() { return locked; }
export function reserveCompanions() {
  if (locked) return null;
  locked = true;
  return () => { locked = false; };
}

export function visibleBox(box: DOMRect) {
  return box.width > 0 && box.height > 0 && box.x >= 0 && box.right <= innerWidth &&
    box.y >= 4 && box.bottom <= innerHeight - (innerWidth <= 700 ? 65 : 4);
}

export function currentSection(actor: Actor): BehaviorContext["section"] {
  const area = actor.sprite.closest<HTMLElement>(".portfolio-sections > section[id], [data-mario-area]");
  const onScreen = Array.from(document.querySelectorAll<HTMLElement>(".portfolio-sections > section"))
    .reverse().find(section => section.getBoundingClientRect().top < innerHeight * .58);
  return behaviorContext.shape.section.safeParse(area?.dataset.marioArea ?? area?.id ?? onScreen?.id).data ?? "other";
}
