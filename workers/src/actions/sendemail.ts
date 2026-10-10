import nodemailer from 'nodemailer';
import 'dotenv/config';

// Create a reusable transporter using Gmail SMTP and your App Password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
    try {
        const info = await transporter.sendMail({
            from: `"Flowify Automations" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
        });
        console.log("Email sent successfully:", info.messageId);
        return true;
    } catch (error) {
        console.error("Failed to send email:", error);
        return false;
    }
}