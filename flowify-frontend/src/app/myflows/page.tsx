
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Plus,
  Workflow,
  Play,
  Activity,
} from "lucide-react";
import { BACKEND_URL } from "@/config";

type Action = {
  id: string;
  type: {
    name: string;
  };
};

type Zap = {
  id: string;
  trigger: {
    type: {
      name: string;
    };
  };
  actions: Action[];
};

export default function OverviewPage() {
  const router = useRouter();

  const [zaps, setZaps] = useState<Zap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchZaps = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await axios.get(`${BACKEND_URL}/zap/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setZaps(response.data.zaps || []);
      } catch (error) {
        console.error("Failed to fetch flows:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchZaps();
  }, []);

  const totalFlows = zaps.length;

  const activeTriggers = zaps.filter(
    (zap) => zap.trigger?.type?.name
  ).length;

  const totalActions = zaps.reduce(
    (total, zap) => total + (zap.actions?.length || 0),
    0
  );

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 overflow-y-auto">
      <main className="w-full px-6 py-10">

        {/* Header */}

        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-sm text-slate-500 mb-2">
              Overview
            </p>

            <h1 className="text-3xl font-bold tracking-tight">
              Dashboard
            </h1>

            <p className="text-slate-400 mt-1">
              Manage and monitor your workflow automation.
            </p>
          </div>

          <button
            onClick={() => router.push("/createflows")}
            className="flex items-center gap-2 bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-semibold hover:bg-amber-300 transition"
          >
            <Plus size={18} />
            Create Flow
          </button>
        </div>

        {/* Statistics */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Total Flows */}

          <div className="border border-slate-800 bg-slate-900 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Workflow
                  size={20}
                  className="text-indigo-400"
                />
              </div>

              <span className="text-xs text-slate-500">
                FLOWS
              </span>
            </div>

            <p className="text-3xl font-bold">
              {loading ? "—" : totalFlows}
            </p>

            <p className="text-sm text-slate-400 mt-1">
              Total Flows
            </p>
          </div>

          {/* Active Triggers */}

          <div className="border border-slate-800 bg-slate-900 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Play
                  size={20}
                  className="text-green-400"
                />
              </div>

              <span className="text-xs text-slate-500">
                TRIGGERS
              </span>
            </div>

            <p className="text-3xl font-bold">
              {loading ? "—" : activeTriggers}
            </p>

            <p className="text-sm text-slate-400 mt-1">
              Active Triggers
            </p>
          </div>

          {/* Actions */}

          <div className="border border-slate-800 bg-slate-900 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center">
                <Activity
                  size={20}
                  className="text-amber-400"
                />
              </div>

              <span className="text-xs text-slate-500">
                ACTIONS
              </span>
            </div>

            <p className="text-3xl font-bold">
              {loading ? "—" : totalActions}
            </p>

            <p className="text-sm text-slate-400 mt-1">
              Configured Actions
            </p>
          </div>

        </div>

        {/* Empty dashboard area */}

        <div className="mt-8 border border-slate-800 bg-slate-900/40 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity
              size={18}
              className="text-slate-500"
            />

            <h2 className="font-semibold">
              Workflow Status
            </h2>
          </div>

          <p className="text-sm text-slate-500">
            Your workflow statistics are calculated from your
            configured flows.
          </p>
        </div>

      </main>
    </div>
  );
}
