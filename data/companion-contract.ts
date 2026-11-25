import { z } from "zod";

const characters = z.enum(["mario", "steve"]);
export type Character = z.infer<typeof characters>;
export const otherCharacter = (character: Character): Character => character === "mario" ? "steve" : "mario";

const sections = z.enum(["home", "about", "experience", "projects", "skills", "education", "contact", "other"]);

const actions = z.enum(["INSPECT_OBJECT", "CALL_MARIO", "CALL_STEVE"]);
export const behaviorContext = z.strictObject({
  character: characters,
  scene: z.enum(["discovery", "spotlight"]),
  section: sections,
  platform: z.enum(["header", "hero-divider", "section-divider"]),
  nearbyObject: z.enum(["portal", "project", "ore"]),
  spotlight: z.boolean(),
  companionNearby: z.boolean(),
});
export type BehaviorContext = z.infer<typeof behaviorContext>;

export const behaviorDecision = z.strictObject({ action: actions });
export type BehaviorAction = z.infer<typeof actions>;

export function callAction(character: Character) {
  return character === "mario" ? "CALL_STEVE" : "CALL_MARIO";
}

const observation = z.string().trim().max(110).regex(/^[\p{L}\p{N} ,.!?'’–-]+$/u).refine(text => {
  const words = text.split(/ +/).length;
  return words >= 8 && words <= 15;
});

export const leafReactionContext = z.strictObject({
  height: z.number().int().min(5).max(20),
  section: sections,
  marioNearby: z.boolean(),
  steveActivity: z.enum(["idle", "exploring", "mining"]),
  recent: z.array(observation).max(3),
});

export const leafObservation = z.strictObject({ text: observation });

export const reactionKey = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, "").replace(/ +/g, " ").trim();

export const localLeafObservations = [
  "I brought a pickaxe. The leaves seem unimpressed by it.",
  "Apparently this tree has an unlimited supply of cherry leaves.",
  "I may have underestimated how much inventory space leaves need.",
  "These leaves are doing a better job of building than I am.",
  "I left for one mining trip and the tree redecorated.",
  "I think the tree is trying to claim this biome.",
  "The leaves appear to be winning. I need a shovel.",
  "I could mine a whole mountain before this tree finishes.",
];
