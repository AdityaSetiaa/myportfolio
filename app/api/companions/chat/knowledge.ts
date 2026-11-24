import { portfolio } from "../../../../data/portfolio";
import type { CompanionDecision, CompanionRequest } from "../../../../data/companion-contract";

const profile = "Aditya Setia is a full-stack software developer in Punjab, India, working at MiriSoft Solutions. He builds secure, scalable business platforms and AI-assisted workflows. His experience includes legacy backend migration, authentication and authorization, databases, deployment, and production troubleshooting.";
const catalog = portfolio.projects.map(project => `${project.name}: ${project.description}`);
const aliases = [/sapoms|dealer|warehouse/, /salon|tenant|appointments|loyalty/, /trello|ocr|handwrit/];

export function retrievePortfolio(input: CompanionRequest) {
  const question = input.message.toLowerCase();
  const byName = portfolio.projects.find((_, index) => aliases[index].test(question));
  const fromContext = portfolio.projects.find(project => project.slug === input.project);
  const aboutSecurity = /auth|security|permissions|token|session/.test(question);
  const project = byName ?? fromContext ?? (aboutSecurity ? portfolio.projects[0] : undefined);

  if (project) {
    return {
      context: [project.description, project.architecture, project.security, project.challenges, ...project.highlights].join("\n"),
      answer: aboutSecurity ? `${project.architecture} ${project.security}` : project.description,
    };
  }
  if (/contact|email|connect|reach/.test(question) || input.section === "contact" && input.kind === "encounter") {
    const answer = `You can contact Aditya at ${portfolio.email}.`;
    return { context: answer, answer };
  }
  if (/skills|technolog|stack|postgres|framework/.test(question) || input.section === "skills") {
    const context = portfolio.skills.map(group => `${group.name}: ${group.items.join(", ")}`).join("\n");
    return { context, answer: context.split("\n").slice(0, 3).join(". ") + "." };
  }
  if (/education|degree|college|university/.test(question) || input.section === "education") {
    const answer = portfolio.education.map(item => `${item.degree} at ${item.school} (${item.dates}).`).join(" ");
    return { context: answer, answer };
  }
  if (/project|portfolio|work/.test(question) || input.section === "projects") {
    return { context: catalog.join("\n"), answer: "Explore SAPOMS for dealer operations, Salon Management for multi-tenant business workflows, and Trello Snap for handwritten tasks turned into Trello cards." };
  }
  const answer = /metric|salary|client name|password|api.?key|system prompt|private|secret/.test(question)
    ? "That information isn't available in the public portfolio."
    : /aditya|experience|role|background|do you|introduc|work/.test(question)
      ? profile
      : "I can help with Aditya’s public projects, experience, technical skills, education, or contact information.";
  return { context: profile, answer };
}

export function fallback(input: CompanionRequest, answer: string): CompanionDecision {
  return {
    character: input.character,
    action: "IDLE",
    dialogue: input.character === "mario" ? `Hey! ${answer}`.slice(0, 380) : answer.slice(0, 380),
    reply: input.kind === "encounter" ? "Let’s see what else is on this page." : "",
  };
}
