export type Option = { value: string; label: string };

export type Field = {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  type?: "text" | "number" | "time" | "select";
  options?: Option[];
  defaultValue?: string;
  // only show this field when another field has one of these values
  showWhen?: { key: string; in: string[] };
};

// Metadata fields per action type (matched against the name, case-insensitive "contains").
export const ACTION_FIELDS: Record<string, Field[]> = {
  email: [
    {
      key: "to",
      label: "To",
      placeholder: "user@example.com or {comment.email}",
    },
    {
      key: "body",
      label: "Body",
      placeholder: "Write your email. Use {comment.amount} for dynamic values",
      multiline: true,
    },
  ],
  discord: [
    {
      key: "webhookUrl",
      label: "Webhook URL",
      placeholder: "https://discord.com/api/webhooks/...",
    },
    {
      key: "content",
      label: "Message Content",
      placeholder: "Write your message. Use {name}, {email}, {message} or {triggeredAt}",
      multiline: true,
    },
  ],
};

// Metadata fields per trigger type. Same matching rule as ACTION_FIELDS.
export const TRIGGER_FIELDS: Record<string, Field[]> = {
  schedule: [
    {
      key: "frequency",
      label: "Run",
      type: "select",
      defaultValue: "daily",
      options: [
        { value: "minutes", label: "Every N minutes" },
        { value: "hours", label: "Every N hours" },
        { value: "daily", label: "Every day" },
        { value: "weekly", label: "Every week" },
        { value: "custom", label: "Custom cron expression" },
      ],
    },
    {
      key: "interval",
      label: "Every",
      type: "number",
      defaultValue: "15",
      placeholder: "15",
      showWhen: { key: "frequency", in: ["minutes", "hours"] },
    },
    {
      key: "time",
      label: "At time (IST)",
      type: "time",
      defaultValue: "09:00",
      showWhen: { key: "frequency", in: ["daily", "weekly"] },
    },
    {
      key: "weekday",
      label: "On",
      type: "select",
      defaultValue: "1",
      options: [
        { value: "1", label: "Monday" },
        { value: "2", label: "Tuesday" },
        { value: "3", label: "Wednesday" },
        { value: "4", label: "Thursday" },
        { value: "5", label: "Friday" },
        { value: "6", label: "Saturday" },
        { value: "0", label: "Sunday" },
      ],
      showWhen: { key: "frequency", in: ["weekly"] },
    },
    {
      key: "customCron",
      label: "Cron expression",
      placeholder: "15 9 * * *",
      showWhen: { key: "frequency", in: ["custom"] },
    },
  ],
};
// Placeholders each trigger can fill in. Same "contains" matching as the others.
export const TRIGGER_PLACEHOLDERS: Record<string, string[]> = {
  security: ["{title}", "{sender}", "{url}", "{body}", "{repo}"],
  opensource: ["{title}", "{sender}", "{url}", "{body}", "{repo}"],
  form: ["{name}", "{email}", "{message}"],
  schedule: ["{triggeredAt}", "{cronExpr}"],
};

const getPlaceholders = (trigger: any): string[] => {
  const name = String(trigger?.name ?? "").toLowerCase();
  const key = Object.keys(TRIGGER_PLACEHOLDERS).find((k) => name.includes(k));
  return key ? TRIGGER_PLACEHOLDERS[key] : [];
};

const matchFields = (map: Record<string, Field[]>, item: any): Field[] => {
  if (!item?.name) return [];
  const name = String(item.name).toLowerCase();
  const match = Object.keys(map).find((k) => name.includes(k));
  return match ? map[match] : [];
};

export const getFields = (action: any, trigger?: any): Field[] => {
  const fields = matchFields(ACTION_FIELDS, action);
  const hints = getPlaceholders(trigger);
  if (hints.length === 0) return fields;

  return fields.map((f) =>
    f.key === "body" || f.key === "content"
      ? { ...f, placeholder: `Write your message. You can use ${hints.join(" ")}` }
      : f
  );
};
export const getTriggerFields = (trigger: any) =>
  matchFields(TRIGGER_FIELDS, trigger);

export const isScheduleTrigger = (trigger: any) =>
  String(trigger?.name ?? "").toLowerCase().includes("schedule");

export const isVisible = (field: Field, values: Record<string, string>) =>
  !field.showWhen || field.showWhen.in.includes(values[field.showWhen.key]);

// defaults for a fresh form, e.g. { frequency: "daily", time: "09:00", ... }
export const initialValues = (fields: Field[]) => {
  const values: Record<string, string> = {};
  fields.forEach((f) => (values[f.key] = f.defaultValue ?? ""));
  return values;
};

// defaults overlaid with whatever is already saved (used by the edit page)
export const mergeValues = (fields: Field[], stored: any) => {
  const values = initialValues(fields);
  if (stored && typeof stored === "object") {
    fields.forEach((f) => {
      if (stored[f.key] !== undefined && stored[f.key] !== null) {
        values[f.key] = String(stored[f.key]);
      }
    });
  }
  return values;
};

export function buildCron(v: Record<string, string>): string {
  const [h, m] = (v.time || "09:00").split(":").map((x) => parseInt(x, 10));
  const n = parseInt(v.interval, 10);

  switch (v.frequency) {
    case "minutes":
      return `*/${n} * * * *`;
    case "hours":
      return `0 */${n} * * *`;
    case "daily":
      return `${m} ${h} * * *`;
    case "weekly":
      return `${m} ${h} * * ${v.weekday}`;
    case "custom":
      return (v.customCron || "").trim().replace(/\s+/g, " ");
    default:
      return "";
  }
}

// returns an error message, or null when the trigger form is valid
export function validateTrigger(
  trigger: any,
  values: Record<string, string>
): string | null {
  const fields = getTriggerFields(trigger);

  for (const f of fields) {
    if (isVisible(f, values) && !String(values[f.key] ?? "").trim()) {
      return `Trigger: "${f.label}" is required`;
    }
  }

  if (isScheduleTrigger(trigger)) {
    const n = parseInt(values.interval, 10);
    if (values.frequency === "minutes" && !(n >= 1 && n <= 59)) {
      return "Trigger: minutes must be between 1 and 59";
    }
    if (values.frequency === "hours" && !(n >= 1 && n <= 23)) {
      return "Trigger: hours must be between 1 and 23";
    }
    if (values.frequency === "custom") {
      if (buildCron(values).split(" ").length !== 5) {
        return "Trigger: cron needs 5 parts, e.g. 15 9 * * *";
      }
    }
  }

  return null;
}

// what we send as triggerMetadata
export function buildTriggerMetadata(
  trigger: any,
  values: Record<string, string>
) {
  const meta: Record<string, string> = {};
  getTriggerFields(trigger).forEach((f) => {
    if (isVisible(f, values)) meta[f.key] = values[f.key];
  });
  if (isScheduleTrigger(trigger)) meta.cronExpr = buildCron(values);
  return meta;
}
