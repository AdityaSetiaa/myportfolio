"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, type FormEvent } from "react";
import { saveAlt } from "@/app/admin/media/actions";

export function UploadMedia() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    if (!(file instanceof File) || !file.size || file.size > 3 * 1024 * 1024) {
      setFeedback("Select a file up to 3 MB.");
      return;
    }
    setPending(true);
    setFeedback("");
    try {
      const response = await fetch("/api/admin/media", { method: "POST", body: data });
      const body = await response.json();
      setFeedback(body.message);
      if (response.ok) {
        form.reset();
        router.refresh();
      }
    } catch {
      setFeedback("Upload failed. Try again.");
    } finally {
      setPending(false);
    }
  }

  return <form className="admin-form" onSubmit={upload}>
    <label>File<input type="file" name="file" accept="image/png,image/jpeg,image/webp,application/pdf" required disabled={pending} /></label>
    <label>Default alt text<input name="alt" maxLength={180} disabled={pending} /></label>
    <button className="admin-primary" disabled={pending}>{pending ? "Uploading…" : "Upload asset"}</button>
    {feedback && <p role="status">{feedback}</p>}
  </form>;
}

export function MediaAlt({ id, alt }: { id: string; alt: string }) {
  const [status, action, pending] = useActionState(saveAlt.bind(null, id), "");
  return <form action={action} className="admin-form">
    <label>Default alt text<input name="alt" defaultValue={alt} maxLength={180} /></label>
    <button className="admin-secondary" disabled={pending}>Save alt text</button>
    {status && <p role="status">{status}</p>}
  </form>;
}
