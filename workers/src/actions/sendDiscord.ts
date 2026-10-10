import axios from "axios";

type DiscordParams = {
    webhookUrl: string;
    content: string;
};

export async function sendDiscordMessage({ webhookUrl, content }: DiscordParams) {
    if (!webhookUrl) {
        throw new Error("Discord webhook URL is missing");
    }

    try {
        await axios.post(webhookUrl, {
            content: content,
        });
        console.log("Discord webhook message sent successfully!");
    } catch (error) {
        console.error("Failed to send Discord message:", error);
        throw error;
    }
}