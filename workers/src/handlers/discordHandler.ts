import type { JsonObject } from "@prisma/client/runtime/client";
import { sendDiscordMessage } from "../actions/sendDiscord.js";

export async function handleDiscordMessage(currentAction: any, zapRunDetails: any) {
    console.log("yes i am here")
    const webhookUrl = (currentAction.metadata as JsonObject)?.webhookUrl as string;
    const contentTemplate = (currentAction.metadata as JsonObject)?.content as string || "Flowify alert triggered at {triggeredAt}!";

    const rawPayload = zapRunDetails?.metadata;
    const payload = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;

    const triggeredAt = payload?.triggeredAt ? new Date(payload.triggeredAt).toLocaleString() : new Date().toLocaleString();
    const name = payload?.name || "Flowify User";
    const email = payload?.email || "No email";
    const message = payload?.message || "No message";

    if (!webhookUrl) {
        console.log("Skipping Discord message: No webhook URL provided in action metadata.");
        return;
    }

    // Replace placeholders with live context
    const finalContent = contentTemplate
        .replace("{triggeredAt}", triggeredAt)
        .replace("{name}", name)
        .replace("{email}", email)
        .replace("{message}", message);

    console.log("Sending Discord message to webhook...");

    await sendDiscordMessage({
        webhookUrl,
        content: finalContent,
    });
}