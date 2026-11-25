"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { saveContent } from "@/app/admin/actions";
import { CaseStudyView } from "@/components/case-study";
import { PortfolioSection } from "@/components/portfolio-view";
import { projectSchema, sectionVersion, settingsSchema, type ProjectContent, type SectionKey, type SectionVersion } from "@/data/cms-schema";
import { projectFields, sectionFields, sectionOptions, settingsFields, socialFields, type Field } from "./editor-fields";

export type AssetChoice = { id: string; type: "image" | "pdf"; filename: string; alt: string };
type Values = Record<string, unknown>;
type EditorProps = {
  identity: { kind: "section"; key: SectionKey } | { kind: "project" | "settings"; key: string };
  draft: Values; published?: Values | null; version: number; assets: AssetChoice[];
  previewProjects?: ProjectContent[]; previewLink?: string;
};

function AssetSelect({ value, options, onChange }: {
  value: string; options: AssetChoice[]; onChange: (id: string, alt: string) => void;
}) {
  return <select value={value} onChange={event => {
    const id = event.target.value;
    onChange(id, options.find(option => option.id === id)?.alt ?? "");
  }}>
    <option value="">No asset</option>
    {options.map(asset => <option key={asset.id} value={asset.id}>{asset.filename}</option>)}
  </select>;
}

function Fields({ values, fields, onChange, assets }: {
  values: Values; fields: Field[]; onChange: (values: Values) => void; assets: AssetChoice[];
}) {
  const update = (key: string, value: unknown) => onChange({ ...values, [key]: value });
  return <div className="admin-fields">{fields.map(field => {
    const value = values[field.key];
    const change = (next: unknown) => update(field.key, next);
    if (field.type === "list") {
      return <Repeater key={field.key} field={field} items={value as unknown[]} onChange={change} assets={assets} />;
    }
    if (field.type === "image") {
      const current = value as { id: string; alt: string } | null;
      return <fieldset key={field.key} className="admin-media-field"><legend>{field.label}</legend>
        <label>Image<AssetSelect value={current?.id ?? ""} options={assets.filter(asset => asset.type === "image")}
          onChange={(id, alt) => change(id ? { id, alt } : null)} /></label>
        {current && <label>Alt text<input value={current.alt} onChange={event => change({ ...current, alt: event.target.value })} /></label>}
      </fieldset>;
    }
    if (field.type === "checkbox") return <label className="admin-check" key={field.key}>
      <input type="checkbox" checked={Boolean(value)} onChange={event => change(event.target.checked)} />{field.label}
    </label>;
    return <label key={field.key}>{field.label}
      {field.type === "select" ? <select value={String(value ?? "")} onChange={event => change(event.target.value)}>
        {field.options.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select> : field.type === "asset" ? <AssetSelect value={String(value ?? "")} onChange={change}
        options={assets.filter(asset => asset.type === field.file)} />
        : field.type === "multiline" ? <textarea rows={4} value={String(value ?? "")} maxLength={6000}
          onChange={event => change(event.target.value)} />
        : <input type={field.type} value={String(value ?? "")} maxLength={field.type === "url" ? 2048 : 254}
          min={field.type === "number" ? 0 : undefined} max={field.type === "number" ? 9999 : undefined}
          onChange={event => change(field.type === "number" ? event.target.valueAsNumber || 0 : event.target.value)} />}
    </label>;
  })}</div>;
}

function Repeater({ field, items, onChange, assets }: {
  field: Extract<Field, { type: "list" }>; items: unknown[]; onChange: (items: unknown[]) => void; assets: AssetChoice[];
}) {
  const dragging = useRef<number>(null);
  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= items.length) return;
    const ordered = [...items];
    const [item] = ordered.splice(from, 1);
    ordered.splice(to, 0, item);
    onChange(ordered);
  }
  return <fieldset className="admin-repeater"><legend>{field.label}</legend>
    {items.map((item, index) => <div className="admin-repeat-item" key={index} onDragOver={event => event.preventDefault()}
      onDrop={event => {
        event.preventDefault();
        if (dragging.current !== null) move(dragging.current, index);
        dragging.current = null;
      }}>
      <div className="admin-repeat-tools">
        <span draggable onDragStart={event => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", String(index));
          dragging.current = index;
        }} onDragEnd={() => { dragging.current = null; }}>{field.item} {index + 1}</span>
        <button type="button" className="admin-secondary" disabled={index === 0} onClick={() => move(index, index - 1)} aria-label={`Move ${field.item.toLowerCase()} ${index + 1} up`}>↑</button>
        <button type="button" className="admin-secondary" disabled={index === items.length - 1} onClick={() => move(index, index + 1)} aria-label={`Move ${field.item.toLowerCase()} ${index + 1} down`}>↓</button>
        <button type="button" className="admin-secondary" onClick={() => {
          if (window.confirm(`Remove this ${field.item.toLowerCase()}?`)) onChange(items.filter((_, position) => position !== index));
        }}>Remove</button>
      </div>
      {field.fields ? <Fields values={item as Values} fields={field.fields} assets={assets}
        onChange={value => onChange(items.map((entry, position) => index === position ? value : entry))} />
        : field.multiline ? <textarea aria-label={`${field.item} ${index + 1}`} value={String(item)} rows={2} maxLength={6000}
          onChange={event => onChange(items.map((entry, position) => index === position ? event.target.value : entry))} />
        : <input aria-label={`${field.item} ${index + 1}`} value={String(item)} maxLength={180}
          onChange={event => onChange(items.map((entry, position) => index === position ? event.target.value : entry))} />}
    </div>)}
    <button className="admin-secondary" type="button" onClick={() => onChange([...items, field.empty ? structuredClone(field.empty) : ""])}>Add {field.item.toLowerCase()}</button>
  </fieldset>;
}

export function Editor({ identity, draft, published, version, assets, previewProjects, previewLink }: EditorProps) {
  const [values, setValues] = useState(draft);
  const [saved, setSaved] = useState(draft);
  const [live, setLive] = useState(published);
  const [expected, setExpected] = useState(version);
  const [feedback, setFeedback] = useState({ ok: true, message: "" });
  const [pending, startTransition] = useTransition();
  const [showPreview, setShowPreview] = useState(true);
  const router = useRouter();
  const changed = JSON.stringify(values) !== JSON.stringify(saved);
  const schema = useMemo(() => identity.kind === "section" ? sectionVersion(identity.key)
    : identity.kind === "project" ? projectSchema : settingsSchema, [identity.kind, identity.key]);
  useEffect(() => {
    if (!changed) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const guardLinks = (event: MouseEvent) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || (link.target && link.target !== "_self") || link.getAttribute("href")?.startsWith("#")) return;
      if (!window.confirm("Leave this page and discard unsaved edits?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", guardLinks, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", guardLinks, true);
    };
  }, [changed]);

  function submit(publish: boolean, data = values) {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setFeedback({ ok: false, message: [first?.path.join(" › "), first?.message].filter(Boolean).join(". ") });
      return;
    }
    startTransition(async () => {
      try {
        const result = await saveContent({ ...identity, expected, input: parsed.data, publish });
        setFeedback(result);
        if (!result.ok) return;
        const next = parsed.data as Values;
        setValues(next);
        setSaved(next);
        setExpected(result.version);
        if (publish) setLive(next);
        if (identity.key === "new") router.replace(`/admin/projects/${result.key}`);
      } catch {
        setFeedback({ ok: false, message: "The request failed. Reopen the editor to check your session and changes." });
      }
    });
  }

  const editSection = identity.kind === "section" ? identity.key : null;
  const preview = showPreview && identity.kind !== "settings";
  return <div className={preview ? "admin-editor admin-editor-split" : "admin-editor"}>
    <form className="admin-edit-form" onSubmit={event => { event.preventDefault(); submit(false); }}>
      <div className="admin-save-bar">
        <button className="admin-secondary" type="submit" disabled={pending}>Save draft</button>
        <button className="admin-primary" type="button" disabled={pending} onClick={() => submit(true)}>Publish</button>
        {identity.kind !== "settings" && <button className="admin-secondary" type="button" onClick={() => setShowPreview(shown => !shown)}>
          {showPreview ? "Hide preview" : "Preview"}
        </button>}
        {previewLink && <Link className="admin-secondary" href={previewLink} target="_blank" rel="noopener">Open saved preview ↗</Link>}
        {live && <button className="admin-link-button" type="button" disabled={pending} onClick={() => {
          if (window.confirm("Replace this draft with the published version?")) submit(false, live);
        }}>Restore published version</button>}
        <span role="status" className="admin-edit-state">{pending ? "Saving…" : changed ? "Unsaved edits" : "Saved"}</span>
      </div>
      {feedback.message && <p role={feedback.ok ? "status" : "alert"} className="admin-form-status" data-ok={feedback.ok}>{feedback.message}</p>}
      <fieldset className="admin-editor-body" disabled={pending}>
        {editSection ? <>
          <Fields values={values} fields={sectionOptions} assets={assets} onChange={setValues} />
          <Fields values={values.content as Values} fields={sectionFields[editSection]} assets={assets} onChange={content => setValues({ ...values, content })} />
          {editSection === "contact" && <fieldset className="admin-media-field"><legend>Social profiles</legend>
            <Fields values={(values.content as Values).social as Values} fields={socialFields} assets={assets}
              onChange={social => setValues({ ...values, content: { ...(values.content as Values), social } })} />
          </fieldset>}
        </> : <Fields values={values} fields={identity.kind === "project" ? projectFields : settingsFields} assets={assets} onChange={setValues} />}
        {(identity.kind === "project" || identity.kind === "settings") &&
          <div className="admin-inline">
            <Link className="admin-back" href="/admin/media" target="_blank" rel="noopener">Upload or replace media ↗</Link>
            <button className="admin-link-button" type="button" onClick={() => router.refresh()}>Refresh media choices</button>
          </div>}
      </fieldset>
    </form>
    {preview && <aside className="admin-preview">
      <h2>Live preview</h2>
      <div className="admin-preview-surface" inert>
        {editSection ? <PortfolioSection section={editSection} version={values as SectionVersion} projects={previewProjects} preview />
          : <CaseStudyView project={{ ...values, images: (values.images as ProjectContent["images"]).filter(image => image.id) } as ProjectContent} preview />}
      </div>
    </aside>}
  </div>;
}
