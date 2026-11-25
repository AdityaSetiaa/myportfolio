import mongoose from "mongoose";
import { sectionKeys } from "../data/cms-schema";
import { seedProjects, seedSections, seedSettings } from "../data/cms-seed";
import { ContentRevision, Project, Section, SiteSettings, type Revision } from "../lib/cms-models";
import { mongo } from "../lib/mongodb";

try {
  const db = await mongo();
  await Promise.all([Section.init(), Project.init(), SiteSettings.init(), ContentRevision.init()]);
  const count = await db.transaction(async session => {
    const time = new Date();
    let inserted = 0;
    const baseline = (kind: Revision["kind"], key: string, snapshot: Revision["snapshot"]) =>
      new ContentRevision({ kind, key, snapshot, number: 1, administrator: "migration", label: "Imported existing content" }).save({ session });

    for (const key of sectionKeys) {
      if (await Section.exists({ key }).session(session)) continue;
      const content = seedSections[key];
      await new Section({ key, draft: content, published: content, revision: 1, publishedAt: time }).save({ session });
      await baseline("section", key, content);
      inserted++;
    }
    for (const content of seedProjects) {
      if (await Project.exists({ slugs: content.slug }).session(session)) continue;
      const project = await new Project({
        draft: content, published: content, slugs: [content.slug],
        publishedSlugs: [content.slug], revision: 1, publishedAt: time,
      }).save({ session });
      await baseline("project", project.id, content);
      inserted++;
    }
    if (!await SiteSettings.exists({ key: "website" }).session(session)) {
      await new SiteSettings({
        key: "website", draft: seedSettings, published: seedSettings, revision: 1, publishedAt: time,
      }).save({ session });
      await baseline("settings", "website", seedSettings);
      inserted++;
    }
    return inserted;
  });
  console.log(`Portfolio migration complete. ${count} records added.`);
} catch (error) {
  console.error("Portfolio migration failed. Check database credentials, permissions, and replica set configuration.", error instanceof Error ? error.name : "");
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
