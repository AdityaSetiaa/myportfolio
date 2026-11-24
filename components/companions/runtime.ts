import type { Character, CompanionAction, Section } from "../../data/companion-contract";

export type Actor = {
  sprite: HTMLElement | SVGElement;
  control: HTMLButtonElement;
  platform: HTMLElement;
  ready: () => boolean;
  perform: () => void;
};
const actors = new Map<Character, Actor>();
let locked = false;
let talking = false;

export function registerActor(character: Character, actor: Actor) {
  actors.set(character, actor);
  return () => { if (actors.get(character) === actor) actors.delete(character); };
}
export function actorFor(character: Character) { return actors.get(character); }
export function companionsReserved() { return locked; }
export function conversationActive() { return talking; }
export function setConversationActive(value: boolean) { talking = value; }
export function reserveCompanions() {
  if (locked) return null;
  locked = true;
  return () => { locked = false; };
}
export function openCompanion(character: Character, anchor: HTMLElement) {
  window.dispatchEvent(new CustomEvent("companion-open", { detail: { character, anchor } }));
}

export function visibleBox(box: DOMRect) {
  return box.width > 0 && box.height > 0 && box.x >= 0 && box.right <= innerWidth &&
    box.y >= 4 && box.bottom <= innerHeight - (innerWidth <= 700 ? 65 : 4);
}

export function sceneContext(character: Character) {
  const sections = Array.from(document.querySelectorAll<HTMLElement>(".portfolio-sections > section"));
  const section = sections.reverse().find(el => el.getBoundingClientRect().top < innerHeight * .58)?.id
    ?? (location.pathname.startsWith("/projects") ? "projects" : "other");
  const card = document.elementFromPoint(innerWidth * .64, innerHeight * .56)?.closest<HTMLAnchorElement>(".project-card");
  const slug = location.pathname.split("/")[2] ?? card?.pathname.split("/")[2];
  const project = (["sapoms", "salon-management", "trello-snap"] as const).find(id => id === slug);
  const self = actorFor(character), other = actorFor(character === "mario" ? "steve" : "mario");
  function summary(actor: Actor | undefined, peer: Actor | undefined) {
    const bounds = actor?.sprite.getBoundingClientRect();
    const adjacent = peer?.sprite.getBoundingClientRect();
    const onTour = Boolean(actor?.sprite.closest(".mario-stop"));
    return {
      state: !actor ? "away" : locked ? "encounter" : actor.ready() ? "ready" : "busy",
      platform: !actor ? "none" : onTour ? "section-divider" : actor.platform.matches(".voxel-world") ? "hero-divider" : "header",
      nearby: Boolean(bounds && adjacent && Math.abs(bounds.bottom - adjacent.bottom) < 3 &&
        Math.max(adjacent.left - bounds.right, bounds.left - adjacent.right) < 160),
    } as const;
  }
  return { section: section as Section, project, context: { self: summary(self, other), other: summary(other, self) } };
}

export function availableActions(character: Character): CompanionAction[] {
  const list: CompanionAction[] = ["IDLE", "SPEAK"];
  const actor = actorFor(character);
  if (locked || !actor?.ready()) return list;
  list.push("GREET", "WAVE", "CELEBRATE", "RESUME_EXPLORATION", character === "mario" ? "JUMP" : "MINE");
  if (actorFor(character === "mario" ? "steve" : "mario")?.ready()) {
    list.push(character === "mario" ? "CALL_STEVE" : "CALL_MARIO");
  }
  return list;
}
