"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Plus, Zap, Play, ArrowDown, Trash2, X } from "lucide-react";
import FieldInput from "@/components/flows/FieldInput";
import {
  getFields,
  getTriggerFields,
  initialValues,
  isVisible,
  isScheduleTrigger,
  buildCron,
  validateTrigger,
  buildTriggerMetadata,
} from "@/lib/flowFields";
import { BACKEND_URL } from "@/config";

export default function CreateFlowPage() {
  const router = useRouter();

  const [triggers, setTriggers] = useState<any[]>([]);
  const [availableActions, setAvailableActions] = useState<any[]>([]);

  const [trigger, setTrigger] = useState<any>(null);
  const [triggerValues, setTriggerValues] = useState<Record<string, string>>({});
  // each selected action looks like: { ...availableAction, metadata: { to, body } }
  const [actions, setActions] = useState<any[]>([]);
  const [flowName, setFlowName] = useState("");

  const [open, setOpen] = useState<"trigger" | number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getData = async () => {
      try {
        const [triggerRes, actionRes] = await Promise.all([
          axios.post(`${BACKEND_URL}/trigger/available`),
          axios.post(`${BACKEND_URL}/action/available`),
        ]);

        setTriggers(triggerRes.data);
        setAvailableActions(actionRes.data);
      } catch (error) {
        console.error("Failed to load options:", error);
      }
    };

    getData();
  }, []);

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
    // build empty metadata object from the fields of this action, e.g. { to: "", body: "" }
    const metadata: Record<string, string> = {};
    getFields(action,trigger).forEach((f) => (metadata[f.key] = ""));

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

  const createFlow = async () => {
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

    // all fields of an action are required
    for (let i = 0; i < actions.length; i++) {
      const fields = getFields(actions[i],trigger);
      const missing = fields.find(
        (f) => !String(actions[i].metadata?.[f.key] ?? "").trim()
      );
      if (missing) {
        alert(`Action ${i + 1} (${actions[i].name}): "${missing.label}" is required`);
        return;
      }
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      await axios.post(
        `${BACKEND_URL}/zap`,
        {
          name: flowName.trim(),
          availableTriggerid: trigger.id,
          triggerMetadata: buildTriggerMetadata(trigger, triggerValues),
          actions: actions.map((action) => ({
            availableActionId: action.id,
            actionMetadata: action.metadata || {},
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      router.push("/myflows");
    } catch (error) {
      console.error("Failed to create flow:", error);
      alert("Failed to create flow. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  const triggerFields = getTriggerFields(trigger).filter((f) =>
    isVisible(f, triggerValues)
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-10 text-3xl font-bold">Create Flow</h1>

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
          const fields = getFields(action,trigger);

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

                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAction(index);
                      }}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <Trash2 size={18} />
                    </span>
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

        {/* Create Flow */}
        <button
          onClick={createFlow}
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Flow"}
        </button>
      </div>
    </main>
  );
}