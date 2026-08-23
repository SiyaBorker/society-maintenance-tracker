const RESEND_API_URL = 'https://api.resend.com/emails';

// Resend (https://resend.com) — plain HTTPS API, sent with the built-in
// fetch (Node 18+). Render's free tier blocks outbound SMTP ports
// (25/465/587) entirely as of Sep 2025, so raw SMTP (Gmail/Nodemailer)
// cannot work there — see docs/SYSTEM_DESIGN.md. An HTTPS API sidesteps
// that restriction completely.
async function sendViaResend({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.warn(
      '[email] RESEND_API_KEY / EMAIL_FROM not set — emails will be logged to the console instead of sent.'
    );
    return { sent: false, reason: 'no-api-key' };
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API ${response.status}: ${body}`);
  }

  return { sent: true };
}

module.exports = { sendViaResend };
