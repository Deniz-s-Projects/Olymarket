import nodemailer, { Transporter } from "nodemailer";

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let transporter: Transporter | null = null;

function resolveTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASSWORD
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD,
            }
          : undefined,
    });
  } else {
    transporter = nodemailer.createTransport({
      streamTransport: true,
      buffer: true,
      newline: "unix",
    });
  }

  return transporter;
}

export async function sendEmail(payload: EmailPayload) {
  const resolvedTransporter = resolveTransporter();
  const from = process.env.EMAIL_FROM ?? "no-reply@olymarket.local";

  const info = await resolvedTransporter.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });

  if ((info as { message?: Buffer }).message) {
    const message = (info as { message: Buffer }).message.toString();
    console.info("Email preview:\n", message);
  }

  return info;
}

export async function sendVerificationEmail(recipient: string, code: string) {
  const subject = "Verify your Olymarket account";
  const text = `Welcome to Olymarket! Use the verification code ${code} to finish creating your account. The code expires in 60 minutes.`;
  const html = `<p>Welcome to Olymarket!</p><p>Use the verification code <strong>${code}</strong> to finish creating your account. The code expires in 60 minutes.</p>`;

  await sendEmail({ to: recipient, subject, text, html });
}

export async function sendNewListingAlert(
  recipients: string[],
  listing: { id: string; title: string; price: string; ownerName: string }
) {
  if (recipients.length === 0) {
    return;
  }

  const subject = `New listing posted: ${listing.title}`;
  const text = `A new listing titled "${listing.title}" was just posted by ${listing.ownerName} for $${Number(
    listing.price
  ).toFixed(2)}.`;
  const html = `<p>A new listing titled <strong>${listing.title}</strong> was just posted by ${listing.ownerName} for $${Number(
    listing.price
  ).toFixed(2)}.</p>`;

  await Promise.all(
    recipients.map((recipient) =>
      sendEmail({
        to: recipient,
        subject,
        text,
        html,
      })
    )
  );
}
