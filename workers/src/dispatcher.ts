import { handleSecurityIssue } from "./handlers/githubSecurity.js";
import { handleOpenSourcePr } from "./handlers/githubPr.js";
import { handleFormSubmission } from "./handlers/formSumbission.js";
import { handleSchedule } from "./handlers/scheduleHandler.js";
import { handleDiscordMessage } from "./handlers/discordHandler.js";
// import { handleWhatsApp } from "./handlers/whatsapp.js";

export async function executeActionStep(
  currentAction: any,
  triggerTypename: string | undefined,
  zapRunDetails: any
): Promise<void> {
  if (currentAction.type.id === "sendemail" && triggerTypename === "github-issue(security)") {
    await handleSecurityIssue(currentAction, zapRunDetails);
  } else if (currentAction.type.id === "sendemail" && triggerTypename === "gitHub-opensource(pr)") {
    await handleOpenSourcePr(currentAction, zapRunDetails);
  } else if (currentAction.type.id === "sendemail" && triggerTypename === "form-submission(mail)") {
    await handleFormSubmission(currentAction, zapRunDetails);
  } else if (currentAction.type.id === "sendemail" && triggerTypename === "Schedule Time") {
    await handleSchedule(currentAction, zapRunDetails);
  } else if (currentAction.type.id === "discord" || currentAction.type.id === "senddiscord") {
    await handleDiscordMessage(currentAction, zapRunDetails);
  }
  // else if (currentAction.type.id === "sendwhatsapp") {
  //     await handleWhatsApp(currentAction, zapRunDetails);
  // }
}

