import type { JsonObject } from "@prisma/client/runtime/client";
import { sendEmail } from "../actions/sendemail.js";

export async function handleSecurityIssue(currentAction: any, zapRunDetails: any) {
const emailTemplateBody = (currentAction.metadata as JsonObject)?.body as string || "Hello, a GitHub event occurred.";
const to = (currentAction.metadata as JsonObject)?.to as string;

const rawPayload = zapRunDetails?.metadata;

const metadata =
typeof rawPayload === "string"
? JSON.parse(rawPayload)
: rawPayload;

// JSON webhook: issue is directly in metadata.
// Form-encoded webhook: JSON is inside metadata.payload.
const githubPayload =
typeof metadata?.payload === "string"
? JSON.parse(metadata.payload)
: metadata?.payload ?? metadata;

// Ping event or any non-issue event
if (!githubPayload?.issue) {
console.log("Skipping email: Payload has no issue (maybe a GitHub ping event).");
return;
    }

const action = githubPayload?.action;
if (action !== "opened" && action !== "edited") {
console.log(`Skipping email: Issue action '${action}' is ignored.`);
return;
    }

const issueTitle = githubPayload.issue.title || "Untitled Issue";
const issueBody = githubPayload.issue.body || "";
const issueUrl = githubPayload.issue.html_url || "#";
const senderName = githubPayload?.sender?.login || "Someone";
const repoName = githubPayload?.repository?.full_name || "";

console.log("Issue title:", issueTitle);
const containsSecurity = issueTitle.toLowerCase().includes("security") || issueBody.toLowerCase().includes("security");
if (!containsSecurity) {
console.log("Skipping email: Issue does not contain the 'security' keyword.");
return;
    }

if (!to) {
console.log("Skipping email: No target email address found in action metadata.");
return;
    }

const finalEmailBody = emailTemplateBody
        .replace("{title}", issueTitle)
        .replace("{sender}", senderName)
        .replace("{url}", issueUrl)
        .replace("{body}", issueBody)
        .replace("{repo}", repoName);

console.log("Sending out security alert email to:", to);

await sendEmail({
to,
subject: `[Flowify Security Alert] ${issueTitle}`,
text: finalEmailBody
    });
}