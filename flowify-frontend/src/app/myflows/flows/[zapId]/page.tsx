"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import {
  Plus,
  Zap,
  Play,
  ArrowDown,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Trash2,
  X,
  Save,
} from "lucide-react";
import FieldInput from "@/components/flows/FieldInput";
import {
  getFields,
  getTriggerFields,
  initialValues,
  mergeValues,
  isVisible,
  isScheduleTrigger,
  buildCron,
  validateTrigger,
  buildTriggerMetadata,
} from "@/lib/flowFields";
import { BACKEND_URL } from "@/config";

export default function EditFlowPage() {
  const { zapId } = useParams<{ zapId: string }>();
  const router = useRouter();

  const [triggers, setTriggers] = useState<any[]>([]);
  const [availableActions, setAvailableActions] = useState<any[]>([]);

  const [flowName, setFlowName] = useState("");
  const [trigger, setTrigger] = useState<any>(null);
  const [triggerValues, setTriggerValues] = useState<Record<string, string>>({});
  // each selected action looks like: { ...availableAction, metadata: { to, body } }
  const [actions, setActions] = useState<any[]>([]);

  const [open, setOpen] = useState<"trigger" | number | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [zapRes, triggerRes, actionRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/zap/${zapId}`, authHeaders()),
          axios.post(`${BACKEND_URL}/trigger/available`),
          axios.post(`${BACKEND_URL}/action/available`),
        ]);

        setTriggers(triggerRes.data);
        setAvailableActions(actionRes.data);

        const zap = zapRes.data.zap;

        setFlowName(zap.name ?? "");

        // zap.trigger.type is the AvailableTrigger (id, name, imageA)
        const triggerType = zap.trigger?.type || null;
        setTrigger(triggerType);
        setTriggerValues(
          mergeValues(getTriggerFields(triggerType), zap.trigger?.metadata)
        );

        const loaded = (zap.actions || []).map((a: any) => {
          const stored =
            a.metadata && typeof a.metadata === "object" ? a.metadata : {};
          const metadata: Record<string, any> = { ...stored };

          // CHANGED: pass triggerType
          getFields(a.type, triggerType).forEach((f) => {
            metadata[f.key] =
              stored[f.key] === undefined || stored[f.key] === null
                ? ""
                : String(stored[f.key]);
          });

          // a.type is the AvailableAction (id, name, imageA)
          return { ...a.type, metadata };
        });

        setActions(loaded);
      } catch (error) {
        console.error("Failed to load flow:", error);
        setLoadError("Could not load this flow.");
      } finally {
        setPageLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zapId]);

  const selectTrigger = (item: any) => {
    // same trigger picked again -> keep what the user already filled in
    if (trigger?.id !== item.id) {
      setTrigger(item);
      setTriggerValues(initialValues(getTriggerFields(item)));
    }
    setOpen(null);
  };

  const updateTriggerValue = (key: string, value: string) =>
    setTriggerValues((prev) => ({ ...prev, [key]: value }));

  const addAction = () => {
    setActions([...actions, null]);
    setOpen(actions.length);
  };

  const selectAction = (index: number, action: any) => {
    const current = actions[index];

    // same action type picked again -> keep what the user already typed
    if (current && current.id === action.id) {
      setOpen(null);
      return;
    }

    const metadata: Record<string, string> = {};
    // CHANGED: pass trigger
    getFields(action, trigger).forEach((f) => (metadata[f.key] = ""));

    const updated = [...actions];
    updated[index] = { ...action, metadata };
    setActions(updated);
    setOpen(null);
  };

  const updateMetadata = (index: number, key: string, value: string) => {
    setActions((prev) =>
      prev.map((a, i) =>
        i === index ? { ...a, metadata: { ...a.metadata, [key]: value } } : a
      )
    );
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
    setOpen(null);
  };

  const moveAction = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= actions.length) return;

    const updated = [...actions];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setActions(updated);
    setOpen(null);
  };

  const saveFlow = async () => {
    if (!flowName.trim()) {
      alert("Please enter a flow name");
      return;
    }

    if (!trigger) {
      alert("Please select a trigger");
      return;
    }

    const triggerError = validateTrigger(trigger, triggerValues);
    if (triggerError) {
      alert(triggerError);
      return;
    }

    if (actions.length === 0 || actions.some((action) => !action)) {
      alert("Please select all actions");
      return;
    }

    for (let i = 0; i < actions.length; i++) {
      // CHANGED: pass trigger
      const fields = getFields(actions[i], trigger);
      const missing = fields.find(
        (f) => !String(actions[i].metadata?.[f.key] ?? "").trim()
      );
      if (missing) {
        alert(
          `Action ${i + 1} (${actions[i].name}): "${missing.label}" is required`
        );
        return;
      }
    }

    try {
      setSaving(true);

      await axios.put(
        `${BACKEND_URL}/zap/${zapId}`,
        {
          name: flowName.trim(),
          availableTriggerid: trigger.id,
          triggerMetadata: buildTriggerMetadata(trigger, triggerValues),
          actions: actions.map((action) => ({
            availableActionId: action.id,
            actionMetadata: action.metadata || {},
          })),
        },
        authHeaders()
      );

      router.push("/myflows/flows");
    } catch (error) {
      console.error("Failed to save flow:", error);
      alert("Failed to save changes. Please check your inputs.");
    } finally {
      setSaving(false);
    }
  };

  const deleteFlow = async () => {
    if (!confirm("Delete this flow? This cannot be undone.")) return;

    try {
      await axios.delete(`${BACKEND_URL}/zap/${zapId}`, authHeaders());
      router.push("/myflows/flows");
    } catch (error) {
      console.error("Failed to delete flow:", error);
      alert("Failed to delete flow. Please try again.");
    }
  };

  if (pageLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-400 p-10">
        Loading flow...
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-10">
        <p className="text-red-400">{loadError}</p>
      </main>
    );
  }

  const triggerFields = getTriggerFields(trigger).filter((f) =>
    isVisible(f, triggerValues)
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <button
          onClick={() => router.push("/myflows/flows")}
          className="mb-6 flex items-center gap-2 text-slate-400 transition hover:text-slate-100"
        >
          <ArrowLeft size={16} /> Back to flows
        </button>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Edit Flow</h1>
            <p className="mt-1 text-xs text-slate-500">ID: {zapId}</p>
          </div>

          <button
            onClick={deleteFlow}
            className="flex items-center gap-2 rounded-xl border border-red-500/40 px-4 py-2 text-red-400 transition hover:bg-red-500/10"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>

        {/* Flow name */}
        <div className="mb-8">
          <label className="mb-2 block text-sm text-slate-300">Flow Name</label>
          <input
            type="text"
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            placeholder="e.g. Send Email Notification"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Trigger */}
        <div className="relative">
          <button
            onClick={() => setOpen("trigger")}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 p-5 text-left hover:border-indigo-500"
          >
            <div className="flex items-center gap-4">
              {trigger ? (
                <img
                  src={trigger.imageA}
                  alt={trigger.name}
                  className="h-10 w-10 rounded-lg object-contain"
                />
              ) : (
                <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                  <Zap size={22} />
                </div>
              )}

              <div>
                <p className="font-semibold">1. Trigger</p>

                <p className="text-sm text-slate-500">
                  {trigger?.name || "Choose a trigger"}
                </p>
              </div>
            </div>
          </button>

          {/* Trigger Selector */}
          {open === "trigger" && (
            <div className="absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold">Select Trigger</p>

                <button onClick={() => setOpen(null)}>
                  <X size={18} className="text-slate-500 hover:text-white" />
                </button>
              </div>

              <div className="space-y-2">
                {triggers.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => selectTrigger(item)}
                    className="flex w-full items-center gap-3 rounded-lg bg-slate-950 p-3 text-left hover:bg-slate-800"
                  >
                    <img
                      src={item.imageA}
                      alt={item.name}
                      className="h-9 w-9 rounded-md object-contain"
                    />

                    <span className="text-sm">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Trigger metadata form */}
        {trigger && triggerFields.length > 0 && (
          <div className="mt-3 space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            {triggerFields.map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                value={triggerValues[field.key] ?? ""}
                onChange={(v) => updateTriggerValue(field.key, v)}
              />
            ))}

            {isScheduleTrigger(trigger) && (
              <p className="text-xs text-slate-500">
                Cron:{" "}
                <code className="text-slate-300">
                  {buildCron(triggerValues) || "-"}
                </code>
              </p>
            )}
          </div>
        )}

        <div className="flex justify-center py-3">
          <ArrowDown size={20} className="text-slate-600" />
        </div>

        {/* Actions */}
        {actions.map((action, index) => {
          // CHANGED: pass trigger
          const fields = getFields(action, trigger);

          return (
            <div key={index}>
              <div className="relative">
                <button
                  onClick={() => setOpen(index)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 p-5 text-left hover:border-indigo-500"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {action ? (
                        <img
                          src={action.imageA}
                          alt={action.name}
                          className="h-10 w-10 rounded-lg object-contain"
                        />
                      ) : (
                        <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                          <Play size={22} />
                        </div>
                      )}

                      <div>
                        <p className="font-semibold">{index + 2}. Action</p>

                        <p className="text-sm text-slate-500">
                          {action?.name || "Choose an action"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          moveAction(index, -1);
                        }}
                        className={
                          index === 0
                            ? "cursor-not-allowed text-slate-700"
                            : "text-slate-500 hover:text-amber-300"
                        }
                        title="Move up"
                      >
                        <ChevronUp size={18} />
                      </span>

                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          moveAction(index, 1);
                        }}
                        className={
                          index === actions.length - 1
                            ? "cursor-not-allowed text-slate-700"
                            : "text-slate-500 hover:text-amber-300"
                        }
                        title="Move down"
                      >
                        <ChevronDown size={18} />
                      </span>

                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAction(index);
                        }}
                        className="text-slate-500 hover:text-red-400"
                        title="Remove action"
                      >
                        <Trash2 size={18} />
                      </span>
                    </div>
                  </div>
                </button>

                {/* Action Selector */}
                {open === index && (
                  <div className="absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-semibold">Select Action</p>

                      <button onClick={() => setOpen(null)}>
                        <X
                          size={18}
                          className="text-slate-500 hover:text-white"
                        />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {availableActions.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => selectAction(index, item)}
                          className="flex w-full items-center gap-3 rounded-lg bg-slate-950 p-3 text-left hover:bg-slate-800"
                        >
                          <img
                            src={item.imageA}
                            alt={item.name}
                            className="h-9 w-9 rounded-md object-contain"
                          />

                          <span className="text-sm">{item.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action metadata form */}
              {action && fields.length > 0 && (
                <div className="mt-3 space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                  {fields.map((field) => (
                    <FieldInput
                      key={field.key}
                      field={field}
                      value={action.metadata?.[field.key] ?? ""}
                      onChange={(v) => updateMetadata(index, field.key, v)}
                    />
                  ))}
                </div>
              )}

              <div className="flex justify-center py-3">
                <ArrowDown size={20} className="text-slate-600" />
              </div>
            </div>
          );
        })}

        {/* Add Action */}
        <button
          onClick={addAction}
          className="mx-auto mb-6 flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm hover:border-indigo-500"
        >
          <Plus size={18} />
          Add Action
        </button>

        {/* Save */}
        <button
          onClick={saveFlow}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </main>
  );
}