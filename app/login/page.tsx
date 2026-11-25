import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/auth";
import { LoginArtwork } from "./login-artwork";
import { LoginForm } from "./login-form";
import "./login.css";

export const metadata: Metadata = { title: "Administrator sign-in", robots: { index: false, follow: false } };

async function SignIn() {
  if (await currentAdmin()) redirect("/admin");
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <main className="pixel-login">
      <section className="pixel-login-panel" aria-labelledby="sign-in-heading">
        <LoginArtwork />
        <Link className="brand pixel-login-brand" href="/" aria-label="Portfolio home">AS<span>.</span></Link>
        <h1 id="sign-in-heading">Administrator<br /><em>sign-in.</em></h1>
        <Suspense fallback={<LoginForm checking />}>
          <SignIn />
        </Suspense>
        <Link className="pixel-login-back" href="/">
          Back to portfolio
          <svg width="11" height="14" viewBox="0 0 11 14" shapeRendering="crispEdges" aria-hidden="true">
            <path fill="currentColor" d="M2 1h3v3h3v3h2v2H8v2H5v2H2V9h3V7H2z" />
          </svg>
        </Link>
      </section>
    </main>
  );
}
