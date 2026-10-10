// import type { JsonObject } from "@prisma/client/runtime/client";
// // import twilio from "twilio";

// export async function handleWhatsApp(currentAction: any, zapRunDetails: any) {
//     const bodyTemplate = (currentAction.metadata as JsonObject)?.body as string || "Hello, you have a new notification from Flowify.";
//     const to = (currentAction.metadata as JsonObject)?.to as string; // Recipient phone number (e.g., +919876543210)

//     const rawPayload = zapRunDetails?.metadata;
//     const payload = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;

//     const name = payload?.name || "Someone";
//     const message = payload?.message || "";

//     if (!to) {
//         console.log("Skipping WhatsApp: No target phone number found in action metadata.");
//         return;
//     }

//     const finalBody = bodyTemplate
//         .replace("{name}", name)
//         .replace("{message}", message);

//     // Initialize Twilio client using environment variables
//     const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

//     try {
//         console.log("Sending out WhatsApp message to:", to);

//         await client.messages.create({
//             from: 'whatsapp:+14155238886', // Twilio Sandbox default number
//             to: `whatsapp:${to}`,
//             body: finalBody,
//         });

//         console.log("WhatsApp message sent successfully!");
//     } catch (error) {
//         console.error("Error sending WhatsApp message:", error);
//         throw error;
//     }
// }