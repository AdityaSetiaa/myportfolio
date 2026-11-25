"use client";

import { useState, useTransition } from "react";

export function ConfirmAction({ label, question, action, alert }: {
  label: string; question: string; action: () => Promise<{ ok: boolean; message: string }>; alert?: boolean;
}) {
  const [status, setStatus] = useState("");
  const [pending, start] = useTransition();
  return <div className="admin-confirm">
    <button type="button" className={alert ? "admin-secondary admin-danger" : "admin-secondary"} disabled={pending}
      onClick={() => {
        if (window.confirm(question)) start(async () => {
          try { setStatus((await action()).message); }
          catch { setStatus("The request failed. Reload and try again."); }
        });
      }}>{pending ? "Working…" : label}</button>
    {status && <small role="status">{status}</small>}
  </div>;
}
