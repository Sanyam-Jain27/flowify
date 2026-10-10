"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Plus,
  Zap,
  ArrowRight,
  Play,
  Copy,
  Check,
  Pencil,
  Trash2,
} from "lucide-react";

import { BACKEND_URL, HOOKS_URL } from "@/config";

// Placeholder shown only until Zap.createdAt exists in your DB
const SAMPLE_CREATED_AT = "2026-10-01T09:30:00.000Z";

type Action = {
  id: string;
  sortingorder?: number;
  type: {
    name: string;
  };
};

type ZapType = {
  id: string;
  userid: string;
  createdAt?: string;
  name: string;
  isActive?: boolean;
  trigger: {
    type: {
      name: string;
    };
  } | null;
  actions: Action[];
};

export default function AllFlow() {
  const router = useRouter();

  const [zaps, setZaps] = useState<ZapType[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchZaps = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await axios.get(`${BACKEND_URL}/zap/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data: ZapType[] = (response.data.zaps || []).map(
          (z: ZapType) => ({
            ...z,
            // make sure actions are always in the right order
            actions: [...(z.actions || [])].sort(
              (a, b) => (a.sortingorder ?? 0) - (b.sortingorder ?? 0),
            ),
          }),
        );

        setZaps(data);

        // real value if backend sends isActive, otherwise default ON
        const initial: Record<string, boolean> = {};
        data.forEach((z) => (initial[z.id] = z.isActive ?? true));
        setEnabled(initial);
      } catch (error) {
        console.error("Failed to fetch flows:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchZaps();
  }, []);

  const getFlowName = (zap: ZapType) => {
    const trigger = zap.trigger?.type?.name || "Unknown";
    const actions = (zap.actions || []).map((a) => a.type?.name || "Unknown");
    return [trigger, ...actions].join(" → ");
  };

  const getWebhookUrl = (zap: ZapType) =>
    `${HOOKS_URL}/${zap.userid}/${zap.id}`;

  const formatDate = (date?: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

  const openFlow = (id: string) => {
    router.push(`/myflows/flows/${id}`);
  };

  const handleCopy = async (e: React.MouseEvent, zap: ZapType) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(getWebhookUrl(zap));
      setCopiedId(zap.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleToggle = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `${BACKEND_URL}/zap/${id}/toggle`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const newActiveState = response.data.isActive;

      // Update local UI states with the true database status returned from backend
      setEnabled((prev) => ({ ...prev, [id]: newActiveState }));
      setZaps((prevZaps) =>
        prevZaps.map((z) =>
          z.id === id ? { ...z, isActive: newActiveState } : z,
        ),
      );
    } catch (error) {
      console.error("Failed to toggle flow status:", error);
    }
  };

  const handleEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    openFlow(id);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this flow? This cannot be undone.")) return;

    setDeletingId(id);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BACKEND_URL}/zap/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setZaps((prev) => prev.filter((z) => z.id !== id));
      setEnabled((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (error) {
      console.error("Failed to delete flow:", error);
      alert("Failed to delete flow. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 overflow-y-auto">
      <main className="w-full px-6 py-10">
        {/* ================= HEADER ================= */}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Flows</h1>
            <p className="text-slate-400 mt-1">
              Manage your automated workflows.
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

        {/* ================= FLOW COUNT ================= */}

        {!loading && zaps.length > 0 && (
          <div className="mb-5">
            <p className="text-sm text-slate-500">
              {zaps.length} {zaps.length === 1 ? "flow" : "flows"}
            </p>
          </div>
        )}

        {/* ================= LOADING ================= */}

        {loading && (
          <div className="border border-slate-800 bg-slate-900/40 rounded-2xl py-20 text-center">
            <p className="text-slate-400">Loading your flows...</p>
          </div>
        )}

        {/* ================= EMPTY ================= */}

        {!loading && zaps.length === 0 && (
          <div className="border border-dashed border-slate-700 rounded-2xl py-20 text-center">
            <Zap size={40} className="mx-auto mb-4 text-slate-500" />
            <h2 className="text-xl font-semibold">No flows yet</h2>
            <p className="text-slate-400 mt-2 mb-6">
              Create your first automated workflow.
            </p>
            <button
              onClick={() => router.push("/createflows")}
              className="bg-amber-400 text-slate-950 px-5 py-2.5 rounded-xl font-semibold hover:bg-amber-300 transition"
            >
              Create your first flow
            </button>
          </div>
        )}

        {/* ================= FLOW LIST ================= */}

        {!loading && zaps.length > 0 && (
          <div className="space-y-4">
            {zaps.map((zap) => {
              const isOn = !!enabled[zap.id];
              const isDeleting = deletingId === zap.id;
              const isSchedule =
                zap.trigger?.type?.name?.toLowerCase().includes("schedule") ??
                false;

              return (
                <div
                  key={zap.id}
                  onClick={() => openFlow(zap.id)}
                  className={`group cursor-pointer border border-slate-800 bg-slate-900 rounded-2xl p-5 hover:border-slate-600 hover:bg-slate-900/80 transition ${
                    isDeleting ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  {/* Flow Header */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                        <Zap size={20} className="text-indigo-400" />
                      </div>

                      <div className="min-w-0">
                        <h2 className="font-semibold truncate">{zap.name}</h2>
                        <p className="text-xs text-slate-500 truncate">
                          ID: {zap.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* Toggle */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs ${
                            isOn ? "text-green-400" : "text-slate-500"
                          }`}
                        >
                          {isOn ? "Active" : "Paused"}
                        </span>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={isOn}
                          onClick={(e) => handleToggle(e, zap.id)}
                          className={`relative w-11 h-6 rounded-full transition ${
                            isOn ? "bg-green-500" : "bg-slate-700"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                              isOn ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={(e) => handleEdit(e, zap.id)}
                        className="text-slate-500 hover:text-amber-300 transition"
                        title="Edit flow"
                      >
                        <Pencil size={18} />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, zap.id)}
                        className="text-slate-500 hover:text-red-400 transition"
                        title="Delete flow"
                      >
                        <Trash2 size={18} />
                      </button>

                      <ArrowRight
                        size={20}
                        className="text-slate-600 group-hover:text-slate-300 transition"
                      />
                    </div>
                  </div>

                  {/* Workflow */}
                  <div className="flex items-center gap-3 flex-wrap mb-5">
                    {/* Trigger */}
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
                      <Play size={16} className="text-green-400" />
                      <div>
                        <p className="text-xs text-slate-500">Trigger</p>
                        <p className="text-sm font-medium">
                          {zap.trigger?.type?.name || "Unknown"}
                        </p>
                      </div>
                    </div>

                    {zap.actions?.length > 0 && (
                      <ArrowRight size={18} className="text-slate-600" />
                    )}

                    {/* Actions */}
                    {zap.actions?.map((action, index) => (
                      <div
                        key={action.id || index}
                        className="flex items-center gap-3"
                      >
                        <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
                          <p className="text-xs text-slate-500">
                            Action {index + 1}
                          </p>
                          <p className="text-sm font-medium">
                            {action.type?.name || "Unknown"}
                          </p>
                        </div>

                        {index < zap.actions.length - 1 && (
                          <ArrowRight size={18} className="text-slate-600" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Meta: Created at + Webhook */}
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-t border-slate-800 pt-4">
                    <div className="text-xs text-slate-500">
                      Created:{" "}
                      <span className="text-slate-300">
                        {formatDate(zap.createdAt)}
                      </span>
                    </div>

                    {!isSchedule && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 min-w-0 md:max-w-xl"
                      >
                        <span className="text-xs text-slate-500 shrink-0">
                          Webhook
                        </span>
                        <code className="text-xs text-slate-300 truncate">
                          {getWebhookUrl(zap)}
                        </code>
                        <button
                          onClick={(e) => handleCopy(e, zap)}
                          className="shrink-0 text-slate-400 hover:text-slate-100 transition"
                          title="Copy webhook URL"
                        >
                          {copiedId === zap.id ? (
                            <Check size={14} className="text-green-400" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    )}
                    {isSchedule && (
                      <p className="text-xs text-slate-500">
                        Runs automatically on a schedule
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
