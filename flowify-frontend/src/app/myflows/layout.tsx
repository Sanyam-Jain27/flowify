"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Menu,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";

interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact: boolean;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: "Overview", href: "/myflows", icon: LayoutDashboard, exact: true },
  { label: "My Flows", href: "/myflows/flows", icon: Workflow, exact: false },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isActive = (item: SidebarItem): boolean => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <AuthGuard>
      <div className="flex min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          className={`fixed bottom-0 left-0 top-16 z-40 flex w-64 flex-col bg-slate-900 transition-transform duration-200 ease-out lg:sticky lg:bottom-auto lg:h-[calc(100vh-4rem)] lg:shrink-0 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-label="Sidebar navigation"
        >
          <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-4 rounded-xl px-4 py-3 text-base font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                    active
                      ? "bg-slate-800 text-amber-400"
                      : "text-slate-200 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      active ? "text-amber-400" : "text-slate-300"
                    }`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 bg-slate-950 px-4 py-8 sm:px-8">
          <div className="mb-6 lg:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen((current) => !current)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
            >
              {sidebarOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
              Menu
            </button>
          </div>

          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}