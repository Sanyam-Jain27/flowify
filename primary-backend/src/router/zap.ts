import { Router } from "express";
import { authMiddleware } from "../middleware.js";
import { ZapCreateSchema, ZapUpdateSchema } from "../types/index.js";
import prismaclient from "../db/index.js";
import { getNextRun } from "../workers/cron.js";

const router = Router();

import { isScheduleTrigger, resolveNextRun } from "./zap-helpers.js";

// ==========================================
// CREATE a zap
// ==========================================
router.post("/", authMiddleware, async (req, res) => {
  // @ts-ignore
  const id = req.id;
  const parseddata = ZapCreateSchema.safeParse(req.body);
  if (!parseddata.success) {
    return res.status(411).json({
      message: "incorrect input",
    });
  }

  try {
    const triggerMeta = (parseddata.data.triggerMetadata ?? {}) as any;
    const isSchedule = await isScheduleTrigger(parseddata.data.availableTriggerid);

    let nextRunAt: Date | null = null;
    if (isSchedule) {
      nextRunAt = resolveNextRun(triggerMeta);
      if (!nextRunAt) {
        return res.status(411).json({ message: "invalid cron expression" });
      }
    }

    const zapId = await prismaclient.$transaction(async (tx: any) => {
      const zap = await tx.zap.create({
        data: {
          userid: id,
          triggerId: "",
          name: parseddata.data.name,
          actions: {
            create: parseddata.data.actions.map((x, index) => ({
              actionId: x.availableActionId,
              metadata: x.actionMetadata,
              sortingorder: index,
            })),
          },
        },
      });

      const trigger = await tx.trigger.create({
        data: {
          triggerId: parseddata.data.availableTriggerid,
          zapId: zap.id,
          metadata: triggerMeta,
        },
      });

      if (isSchedule && nextRunAt) {
        await tx.scheduleTrigger.create({
          data: {
            zapId: zap.id,
            cronExpr: String(triggerMeta.cronExpr).trim(),
            nextRunAt,
          },
        });
      }

      await tx.zap.update({
        where: { id: zap.id },
        data: { triggerId: trigger.id },
      });

      return zap.id;
    });

    return res.json({ zapId });
  } catch (error) {
    console.error("Failed to create zap:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// LIST all zaps of the logged-in user
// ==========================================
router.get("/", authMiddleware, async (req, res) => {
  // @ts-ignore
  const id = req.id;
  const zaps = await prismaclient.zap.findMany({
    where: {
      userid: id,
    },
    include: {
      actions: {
        include: {
          type: true,
        },
      },
      trigger: {
        include: {
          type: true,
        },
      },
    },
  });
  console.log("zaps handler");
  return res.json({
    zaps,
  });
});

// ==========================================
// TOGGLE active / paused
// ==========================================
router.patch("/:zapId/toggle", authMiddleware, async (req: any, res: any) => {
  try {
    const id = req.id;
    const { zapId } = req.params;

    const zap = await prismaclient.zap.findFirst({
      where: {
        id: zapId,
        userid: id,
      },
    });

    if (!zap) {
      return res.status(404).json({ error: "Zap not found" });
    }

    const updatedZap = await prismaclient.zap.update({
      where: { id: zapId },
      data: { isActive: !zap.isActive },
    });

    return res.json({ success: true, isActive: updatedZap.isActive });
  } catch (error) {
    console.error("Failed to toggle zap:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// GET one zap (used by the edit page)
// ==========================================
router.get("/:zapId", authMiddleware, async (req: any, res: any) => {
  try {
    const id = req.id;
    const { zapId } = req.params;

    const zap = await prismaclient.zap.findFirst({
      where: {
        id: zapId,
        userid: id,
      },
      include: {
        actions: {
          include: {
            type: true,
          },
          orderBy: {
            sortingorder: "asc",
          },
        },
        trigger: {
          include: {
            type: true,
          },
        },
      },
    });

    if (!zap) {
      return res.status(404).json({ error: "Zap not found" });
    }

    return res.json({ zap });
  } catch (error) {
    console.error("Failed to fetch zap:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// UPDATE a zap
// ==========================================
router.put("/:zapId", authMiddleware, async (req: any, res: any) => {
  try {
    const id = req.id;
    const { zapId } = req.params;

    const parsed = ZapUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(411).json({ message: "incorrect input" });
    }

    const zap = await prismaclient.zap.findFirst({
      where: {
        id: zapId,
        userid: id,
      },
    });

    if (!zap) {
      return res.status(404).json({ error: "Zap not found" });
    }

    const triggerMeta = (parsed.data.triggerMetadata ?? {}) as any;
    const isSchedule = await isScheduleTrigger(parsed.data.availableTriggerid);

    let nextRunAt: Date | null = null;
    if (isSchedule) {
      nextRunAt = resolveNextRun(triggerMeta);
      if (!nextRunAt) {
        return res.status(411).json({ message: "invalid cron expression" });
      }
    }

    await prismaclient.$transaction(async (tx: any) => {
      const trigger = await tx.trigger.upsert({
        where: { zapId },
        update: {
          triggerId: parsed.data.availableTriggerid,
          metadata: triggerMeta,
        },
        create: {
          zapId,
          triggerId: parsed.data.availableTriggerid,
          metadata: triggerMeta,
        },
      });

      await tx.zap.update({
        where: { id: zapId },
        data: {
          triggerId: trigger.id,
          ...(parsed.data.name ? { name: parsed.data.name } : {}),
        },
      });

      if (isSchedule && nextRunAt) {
        const cronExpr = String(triggerMeta.cronExpr).trim();
        await tx.scheduleTrigger.upsert({
          where: { zapId },
          update: { cronExpr, nextRunAt },
          create: { zapId, cronExpr, nextRunAt },
        });
      } else {
        await tx.scheduleTrigger.deleteMany({ where: { zapId } });
      }

      await tx.actions.deleteMany({ where: { zapId } });
      await tx.actions.createMany({
        data: parsed.data.actions.map((a, index) => ({
          zapId,
          actionId: a.availableActionId,
          metadata: a.actionMetadata ?? {},
          sortingorder: index,
        })),
      });
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("Failed to update zap:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================================
// DELETE a zap and everything attached to it
// ==========================================
router.delete("/:zapId", authMiddleware, async (req: any, res: any) => {
  try {
    const id = req.id;
    const { zapId } = req.params;

    const zap = await prismaclient.zap.findFirst({
      where: {
        id: zapId,
        userid: id,
      },
    });

    if (!zap) {
      return res.status(404).json({ error: "Zap not found" });
    }

    await prismaclient.$transaction([
      prismaclient.scheduleTrigger.deleteMany({ where: { zapId } }),
      prismaclient.zapRunOutbox.deleteMany({ where: { zapRun: { zapId } } }),
      prismaclient.zapRun.deleteMany({ where: { zapId } }),
      prismaclient.actions.deleteMany({ where: { zapId } }),
      prismaclient.trigger.deleteMany({ where: { zapId } }),
      prismaclient.zap.delete({ where: { id: zapId } }),
    ]);

    return res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete zap:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export const zapRouter = router;