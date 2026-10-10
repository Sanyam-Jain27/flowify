import prismaclient from "../db/index.js";
import { getNextRun } from "../workers/cron.js";

// true when the chosen AvailableTrigger is the "Schedule Time" one
export const isScheduleTrigger = async (availableTriggerId: string): Promise<boolean> => {
  const t = await prismaclient.availableTrigger.findUnique({
    where: { id: availableTriggerId },
  });
  return !!t && t.name.toLowerCase().includes("schedule");
};

// validates triggerMetadata for a schedule trigger, returns the first run time
export const resolveNextRun = (triggerMeta: any): Date | null => {
  try {
    const expr = String(triggerMeta?.cronExpr ?? "").trim();
    if (!expr) return null;
    return getNextRun(expr);
  } catch {
    return null;
  }
};

