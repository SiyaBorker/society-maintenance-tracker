const nodemailer = require('nodemailer');

// Gmail + an "App Password" (not your normal Gmail password).
// See README.md -> "Setting up Gmail for email notifications" for how to
// generate one. Any other SMTP provider also works if you swap these
// env vars for its host/port/user/pass.
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.warn(
      '[email] EMAIL_USER / EMAIL_APP_PASSWORD not set — emails will be logged to the console instead of sent.'
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
    family: 4,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  return transporter;
}

module.exports = { getTransporter };
