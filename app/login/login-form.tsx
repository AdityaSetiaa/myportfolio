"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm({ checking = false }: { checking?: boolean }) {
  const [error, action, pending] = useActionState(login, "");
  const busy = checking || pending;

  return (
    <form action={action} className="pixel-login-form" aria-busy={busy || undefined}>
      <label className="pixel-login-field">
        Email
        <span className="pixel-login-input">
          <input autoComplete="username" type="email" name="email" required maxLength={254} disabled={checking} />
        </span>
      </label>
      <label className="pixel-login-field">
        Password
        <span className="pixel-login-input">
          <input autoComplete="current-password" type="password" name="password" required maxLength={256} disabled={checking} />
        </span>
      </label>
      <button className="pixel-login-submit" disabled={busy}>
        <span className="pixel-login-submit-face">
          {busy && <span className="pixel-login-loader" aria-hidden="true" />}
          {checking ? "Checking session…" : pending ? "Signing in…" : "Sign in"}
        </span>
      </button>
      {error && <p role="alert" className="pixel-login-error">{error}</p>}
    </form>
  );
}
