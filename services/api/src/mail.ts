import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import nodemailer from "nodemailer";
import type { ServerConfig } from "@formation-zero/config";
export interface AccountMail {
  to: string;
  kind: "verify" | "reset";
  token: string;
}
export type MailDelivery = (mail: AccountMail) => Promise<void>;
export function createMailDelivery(config: ServerConfig): MailDelivery {
  const transport =
    config.MAIL_MODE === "SMTP"
      ? nodemailer.createTransport(config.SMTP_URL!)
      : undefined;
  return async (mail) => {
    const url = `${config.WEB_ORIGIN}/account#${new URLSearchParams({ action: mail.kind, token: mail.token })}`;
    if (transport) {
      await transport.sendMail({
        from: config.MAIL_FROM,
        to: mail.to,
        subject: `Formation Zero: ${mail.kind === "verify" ? "verify email" : "reset password"}`,
        text: `Use this private, expiring link to ${mail.kind === "verify" ? "verify your email" : "reset your password"}: ${url}`,
        disableFileAccess: true,
        disableUrlAccess: true,
      });
    } else {
      await mkdir(".local/mail", { recursive: true, mode: 0o700 });
      await writeFile(
        `.local/mail/${randomUUID()}.json`,
        JSON.stringify({ ...mail, url }),
        { mode: 0o600, flag: "wx" },
      );
    }
  };
}
