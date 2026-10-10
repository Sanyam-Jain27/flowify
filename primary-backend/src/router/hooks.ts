import { Router } from "express";
import { client } from "@flowify/shared";

export const hooksRouter = Router();

// Webhook listener - handles incoming webhooks and checks if zap.isActive is true
hooksRouter.post("/catch/:userId/:zapId", async (req: any, res: any) => {
  console.log("Hook caught via primary-backend");
  const userId = req.params.userId;
  const zapId = req.params.zapId;
  const body = req.body;

  try {
    const zap = await client.zap.findFirst({
      where: {
        id: zapId,
        userid: userId,
      },
    });

    if (!zap) {
      return res.status(404).json({ error: "Zap not found" });
    }

    // Ignore the request if the toggle is turned OFF
    if (!zap.isActive) {
      console.log(`Zap ${zapId} is currently paused (inactive). Skipping webhook.`);
      return res.status(200).json({ status: "ignored", message: "Zap is paused" });
    }

    await client.$transaction(async (tx: any) => {
      const run = await tx.zapRun.create({
        data: {
          zapId: zapId,
          metadata: body,
        },
      });
      await tx.zapRunOutbox.create({
        data: {
          zapRunId: run.id,
        },
      });
    });

    return res.status(200).json({ status: "success", message: "Webhook processed" });
  } catch (error) {
    console.error("Error processing webhook hook:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

