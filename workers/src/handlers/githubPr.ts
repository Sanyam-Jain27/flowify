import type { JsonObject } from "@prisma/client/runtime/client";
import { sendEmail } from "../actions/sendemail.js";

export async function handleOpenSourcePr(currentAction: any, zapRunDetails: any) {
    const emailTemplateBody = (currentAction.metadata as JsonObject)?.body as string || "Hello, a GitHub event occurred.";
    const to = (currentAction.metadata as JsonObject)?.to as string;

    const rawMetadata = zapRunDetails?.metadata;
    const githubPayload = typeof rawMetadata === 'string' ? JSON.parse(rawMetadata) : rawMetadata;

    const prItem = githubPayload?.pull_request;
    if (!prItem) {
        console.log("Skipping email: Webhook payload is not a Pull Request.");
        return;
    }

    const senderLogin = githubPayload?.sender?.login;
    const repoOwner = githubPayload?.repository?.owner?.login;
    if (senderLogin === repoOwner) {
        console.log("Skipping email: PR was opened by repository owner.");
        return;
    }

    const title = prItem.title || "Untitled PR";
    const bodyContent = prItem.body || "No description provided.";
    const url = prItem.html_url || "#";
    const repoName = githubPayload?.repository?.full_name || "";

    if (!to) {
        console.log("Skipping email: No target email address found.");
        return;
    }

    const finalEmailBody = emailTemplateBody
        .replace("{title}", title)
        .replace("{sender}", senderLogin)
        .replace("{url}", url)
        .replace("{body}", bodyContent)
        .replace("{repo}", repoName);

    console.log("Sending out external contribution email to:", to);

    await sendEmail({
        to,
        subject: `🚀 New External Contribution on ${repoName}: ${title}`,
        text: finalEmailBody
    });
}