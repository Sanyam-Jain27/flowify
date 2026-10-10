import type { JsonObject } from "@prisma/client/runtime/client";
import { sendEmail } from "../actions/sendemail.js";

export async function handleFormSubmission(currentAction: any, zapRunDetails: any) {
    const emailTemplateBody = (currentAction.metadata as JsonObject)?.body as string || "Hello, you have a new contact form submission from {name} ({email}).\n\nMessage:\n{message}";
    const to = (currentAction.metadata as JsonObject)?.to as string;

    const rawPayload = zapRunDetails?.metadata;
    const formPayload = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;

    const name = formPayload?.name || "Anonymous";
    const email = formPayload?.email || "No email provided";
    const message = formPayload?.message || "No message provided";

    if (!to) {
        console.log("Skipping email: No target email address found in action metadata.");
        return;
    }

    const finalEmailBody = emailTemplateBody
        .replace("{name}", name)
        .replace("{email}", email)
        .replace("{message}", message);

    console.log("Sending out contact form notification email to:", to);

    await sendEmail({
        to,
        subject: `[Flowify] New Contact Form Submission: ${name}`,
        text: finalEmailBody
    });
}