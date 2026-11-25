import type { SectionKey } from "./cms-schema";

export type MarioSpotlight = {
  section: SectionKey;
  publishedAt: number;
  until: number;
  project?: string;
};

export type SpotlightFeed = {
  updates: MarioSpotlight[];
  freshFor: number;
  visitMin: number;
  visitMax: number;
  pollEvery: number;
};

export function activeSpotlight(update: MarioSpotlight, now: number) {
  return update.publishedAt <= now && update.until > now;
}

export function spotlightKey(update: MarioSpotlight) {
  return `${update.section}:${update.project ?? ""}:${update.publishedAt}`;
}
