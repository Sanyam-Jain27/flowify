import { CronExpressionParser } from "cron-parser";

// Single source of truth for schedule timezone (used by zap.ts and schedule.ts)
export const SCHEDULE_TZ = "Asia/Kolkata";

// Throws if the expression is invalid
export const getNextRun = (cronExpr: string): Date =>
  CronExpressionParser.parse(cronExpr, { tz: SCHEDULE_TZ }).next().toDate();