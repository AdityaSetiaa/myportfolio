import { z } from "zod";

export const characterSchema = z.enum(["mario", "steve"]);
export type Character = z.infer<typeof characterSchema>;
export const names = { mario: "Mario", steve: "Steve" };
export const otherCharacter = (character: Character): Character => character === "mario" ? "steve" : "mario";
export const actions = ["IDLE", "GREET", "WAVE", "JUMP", "MINE", "CALL_MARIO", "CALL_STEVE", "SPEAK", "CELEBRATE", "RESUME_EXPLORATION"] as const;
export type CompanionAction = typeof actions[number];
export const sections = ["home", "about", "experience", "projects", "skills", "education", "contact", "other"] as const;
export type Section = typeof sections[number];

const actorSchema = z.object({
  state: z.enum(["away", "busy", "ready", "encounter"]),
  platform: z.enum(["header", "hero-divider", "section-divider", "none"]),
  nearby: z.boolean(),
});

export const companionRequest = z.object({
  character: characterSchema,
  message: z.string().trim().min(1).max(450),
  section: z.enum(sections),
  project: z.enum(["sapoms", "salon-management", "trello-snap"]).optional(),
  kind: z.enum(["chat", "encounter"]).default("chat"),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(450) })).max(6).default([]),
  available: z.array(z.enum(actions)).max(actions.length).default([]),
  context: z.object({ self: actorSchema, other: actorSchema }).optional(),
});
export type CompanionRequest = z.infer<typeof companionRequest>;

export const companionDecision = z.object({
  character: characterSchema,
  dialogue: z.string().trim().min(1).max(380),
  action: z.enum(actions),
  reply: z.string().trim().max(180),
});
export type CompanionDecision = z.infer<typeof companionDecision>;
