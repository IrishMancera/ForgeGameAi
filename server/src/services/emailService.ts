import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

export function getMailTransporter() {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER || '';
  const smtpPass = process.env.SMTP_PASS || '';

  if (!smtpUser || !smtpPass) {
    console.warn('[Email] SMTP credentials not set. Email invitations will be logged to console.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string, text: string) {
  const mailer = getMailTransporter();
  const fromEmail = process.env.SMTP_FROM || 'noreply@gameforgeai.com';

  if (!mailer) {
    console.log(`
========================================================================
[EMAIL PERSISTENCE MOCK LOG]
To: ${to}
Subject: ${subject}
Text: ${text}
========================================================================
    `);
    return { mock: true };
  }

  return mailer.sendMail({
    from: `"GameForgeAI" <${fromEmail}>`,
    to,
    subject,
    text,
    html,
  });
}
