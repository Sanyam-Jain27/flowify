"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import Footer from "@/components/layout/Footer.tsx";
import {
  Zap,
  ArrowRight,
  Play,
  Plus,
  Cpu,
  ShieldCheck,
  Workflow,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  // null = still checking (avoids flashing the wrong buttons)
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

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-slate-950 text-slate-100">
      <div className="flex-1">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> Workflow Automation
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-100 max-w-3xl mx-auto leading-tight">
            Automate your processes with <span className="text-amber-400">Flowify</span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto font-normal">
            Build, visualize, and execute automated event pipelines seamlessly without complex setup. Connect triggers, logic, and external services in minutes.
          </p>

          {/* CTA buttons depend on login state */}
          <div className="flex min-h-[3.25rem] flex-wrap items-center justify-center gap-4 pt-4">
            {isLoggedIn === true && (
              <>
                <Link href="/myflows/flows">
                  <Button variant="primary" className="text-base px-6 py-3 gap-2">
                    Go to My Flows <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/createflows">
                  <Button variant="outline" className="text-base px-6 py-3 gap-2">
                    Create Flow <Plus className="w-4 h-4" />
                  </Button>
                </Link>
              </>
            )}

            {isLoggedIn === false && (
              <>
                <Link href="/signup">
                  <Button variant="primary" className="text-base px-6 py-3 gap-2">
                    Get Started Free <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="text-base px-6 py-3 gap-2">
                    Sign In <Play className="w-4 h-4 fill-current" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Feature Overview Grid */}
        <section className="max-w-6xl mx-auto px-4 py-16 border-t border-slate-900">
          <h2 className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-12">
            Everything you need to automate work
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Workflow className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100">Visual Pipeline Builder</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Drag and drop nodes to construct workflow pipelines with conditional logic, loops, and custom integrations.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100">Real-Time Execution Logs</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Monitor workflow runs step-by-step with detailed execution timing, payload inspection, and error tracing.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100">Secure Execution</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Safely trigger webhooks and API endpoints with role-based permissions and isolated step execution.
              </p>
            </div>
          </div>
        </section>

        {/* Feature Checklist Section */}
        <section className="max-w-4xl mx-auto px-4 py-12 mb-16 bg-slate-900/30 border border-slate-800/80 rounded-3xl">
          <div className="grid sm:grid-cols-2 gap-6 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-200">No Complex Boilerplate</h4>
                <p className="text-xs text-slate-400 mt-1">Design workflows visually without setting up custom server infrastructure.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Instant Execution Debugging</h4>
                <p className="text-xs text-slate-400 mt-1">Track failures instantly with node-level execution statuses and logs.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}