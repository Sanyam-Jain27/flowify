"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function Footer() {
  // null = not checked yet (avoids a flash of wrong links on first load)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => setIsLoggedIn(!!localStorage.getItem("token"));
    check();
    window.addEventListener("storage", check);
    window.addEventListener("auth-change", check);
    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener("auth-change", check);
    };
  }, []);

  const linkClass =
    "text-sm text-slate-400 hover:text-amber-400 transition-colors";

  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-slate-950">
                <Zap className="h-4 w-4 fill-current" />
              </span>
              <span className="text-lg font-bold text-slate-100">
                Flow<span className="text-amber-400">ify</span>
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-slate-400">
              Build, visualize and run automated workflows. Connect triggers and
              actions in minutes, without setting up any infrastructure.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Product
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/createflows" className={linkClass}>
                  Create Flow
                </Link>
              </li>
              <li>
                <Link href="/myflows/flows" className={linkClass}>
                  My Flows
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Account
            </h4>
            {isLoggedIn !== null && (
              <ul className="space-y-2">
                {isLoggedIn ? (
                  <li>
                    <Link href="/myflows" className={linkClass}>
                      Dashboard
                    </Link>
                  </li>
                ) : (
                  <>
                    <li>
                      <Link href="/login" className={linkClass}>
                        Sign In
                      </Link>
                    </li>
                    <li>
                      <Link href="/signup" className={linkClass}>
                        Sign Up
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Flowify. All rights reserved.
          </p>
          <p className="text-xs text-slate-600">
            Built for people who hate repetitive work.
          </p>
        </div>
      </div>
    </footer>
  );
}