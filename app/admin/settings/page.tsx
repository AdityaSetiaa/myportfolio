import Link from "next/link";
import { Suspense } from "react";
import { Editor } from "@/components/admin/editor";
import { requireAdmin } from "@/lib/auth";
import { SiteSettings } from "@/lib/cms-models";
import { mongo } from "@/lib/mongodb";
import { mediaChoices } from "@/server/portfolio/admin-queries";

async function Settings() {
  await requireAdmin();
  await mongo();
  const [settings, assets] = await Promise.all([SiteSettings.findOne({ key: "website" }).lean(), mediaChoices()]);
  return <>
    <div className="admin-heading"><h1>Website settings</h1><Link className="admin-secondary" href="/admin/sections/contact">Edit contact and social profiles</Link></div>
    {settings ? <Editor identity={{ kind: "settings", key: "website" }} draft={settings.draft} published={settings.published}
      version={settings.__v} assets={assets} /> : <p>Run the portfolio migration to initialize website settings.</p>}
  </>;
}

export default function SettingsPage() {
  return <Suspense fallback={<p>Loading settings…</p>}><Settings /></Suspense>;
}
