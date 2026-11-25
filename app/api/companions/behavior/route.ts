import { behaviorContext, behaviorDecision, callAction, type BehaviorContext } from "@/data/companion-contract";
import { askCompanion, readCompanionInput, rejectCompanionRequest } from "@/server/companions/groq";

function isEligible(input: BehaviorContext) {
  if (input.character !== "mario") return false;
  if (input.scene === "spotlight") return input.spotlight && input.section === "projects"
    && input.platform === "section-divider" && input.nearbyObject === "project";
  return !input.spotlight && input.platform === "header" && input.nearbyObject === "ore";
}

export async function POST(request: Request) {
  const rejected = rejectCompanionRequest(request);
  if (rejected) return rejected;
  const input = behaviorContext.safeParse(await readCompanionInput(request));
  if (!input.success || !isEligible(input.data)) return Response.json({ error: "Invalid behavior context" }, { status: 400 });

  const call = callAction(input.data.character);
  const result = await askCompanion(request, "behavior",
    `Choose one nonverbal animation for a tiny character. Respond with a JSON object with exactly one field, action. The only allowed actions are INSPECT_OBJECT and ${call}. Prefer inspecting alone unless the object would benefit from the companion's expertise or they are nearby. Ore can be mined by Steve. Do not add dialogue, commentary, coordinates, or any other fields.`,
    input.data);
  const decision = behaviorDecision.safeParse(result);
  return decision.success && (decision.data.action === "INSPECT_OBJECT" || decision.data.action === call)
    ? Response.json(decision.data) : Response.json({ action: call });
}
