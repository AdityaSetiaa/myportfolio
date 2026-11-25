import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { AdminNavigation, AdminTopTitle } from "@/components/admin/admin-navigation";
import { logout } from "./actions";
import "@/components/admin/admin.css";

export const metadata: Metadata = { title: { default: "Portfolio admin", template: "%s | Portfolio admin" }, robots: { index: false, follow: false } };

async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return <div className="admin-shell">
    <AdminNavigation />
    <div className="admin-main">
      <header className="admin-topbar">
        <AdminTopTitle />
        <span title={admin.email}>{admin.email}</span>
        <Link href="/" prefetch={false} target="_blank" rel="noopener">View website ↗</Link>
        <form action={logout}><button className="admin-secondary">Log out</button></form>
      </header>
      <main className="admin-content">{children}</main>
    </div>
  </div>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<p className="admin-loading">Checking session…</p>}><PrivateLayout>{children}</PrivateLayout></Suspense>;
}
