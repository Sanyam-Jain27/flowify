import express from "express";
import { client } from "@flowify/shared";
import "dotenv/config";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/see/this", (req, res) => {
    res.send("allgood");
});

app.post("/check/this", async (req, res) => {
    res.send("nothing");
});

// Webhook listener - handles incoming webhooks and checks if zap.isActive is true
app.post("/hooks/catch/:userId/:zapId", async (req: any, res: any) => {
    console.log("Hook caught");
    const userId = req.params.userId;
    const zapId = req.params.zapId;
    const body = req.body; 

    try {
        const zap = await client.zap.findFirst({
            where: { 
                id: zapId, 
                userid: userId // Note: ensure field matches schema (userid vs userId)
            }
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
                    metadata: body
                }
            });
            await tx.zapRunOutbox.create({
                data: {
                    zapRunId: run.id
                }
            });
        });

        return res.status(200).json({ status: "success", message: "Webhook processed" });
    } catch (error) {
        console.error("Error processing webhook hook:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

const PORT = process.env.PORT || process.env.HOOKS_PORT || 3011;

app.listen(PORT, () => {
    console.log(`Hooks service listening on port ${PORT}`);
});