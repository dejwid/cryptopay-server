import formData from "form-data";
import Mailgun from "mailgun.js";
import {prisma} from "@/libs/db";

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY as string,
});

export async function sendEmail(to:string[], subject:string, message:string, invoiceId?:string|null) {
  let mailgunResponse: string | null = null;
  let status: 'sent' | 'failed' = 'sent';
  let errorMessage: string | null = null;

  try {
    const msg = await mg.messages.create('cryptopayserver.com', {
      from: "CryptoPay Server <no-reply@cryptopayserver.com>",
      to: to,
      subject: subject,
      text: message,
    });
    mailgunResponse = JSON.stringify(msg);
    status = 'sent';
  } catch (err: unknown) {
    status = 'failed';
    errorMessage = err instanceof Error ? err.message : String(err);
    mailgunResponse = JSON.stringify(err, Object.getOwnPropertyNames(err));
  }

  // Log to database
  try {
    await prisma.emailLog.create({
      data: {
        to,
        subject,
        body: message,
        invoiceId: invoiceId || null,
        status,
        mailgunResponse,
        error: errorMessage,
      },
    });
  } catch (logErr) {
    // Don't let logging failure break the email flow
    console.error('Failed to log email:', logErr);
  }

  if (status === 'failed') {
    throw new Error(`Email send failed: ${errorMessage}`);
  }
}
