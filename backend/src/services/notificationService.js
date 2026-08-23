const { getTransporter } = require('../config/email');

const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Society Maintenance Tracker';

/**
 * Sends an email if a transporter is configured, otherwise logs it.
 * Failures are swallowed (logged, not thrown) so a broken mail provider
 * never breaks the underlying complaint/notice API call that triggered it.
 */
async function sendMail({ to, subject, html }) {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[email:skipped] to=${to} subject="${subject}"`);
    return { sent: false, reason: 'no-transporter' };
  }

  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error(`[email:error] to=${to} subject="${subject}" —`, err.message);
    return { sent: false, reason: err.message };
  }
}

const STATUS_LABELS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};

async function sendComplaintStatusEmail({ resident, complaint, newStatus, note }) {
  const statusLabel = STATUS_LABELS[newStatus] || newStatus;
  const subject = `Your complaint #${complaint.id.slice(0, 8)} is now ${statusLabel}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px;">
      <h2 style="color:#2563eb;">Complaint status update</h2>
      <p>Hi ${resident.name},</p>
      <p>Your complaint <strong>#${complaint.id.slice(0, 8)}</strong>
      (${complaint.category.replace('_', ' ')}) has been updated to:</p>
      <p style="font-size:18px;"><strong>${statusLabel}</strong></p>
      ${note ? `<p><em>Note from admin: ${note}</em></p>` : ''}
      <p>Description: ${complaint.description}</p>
      <hr/>
      <p style="color:#666; font-size:12px;">Society Maintenance Tracker — automated notification.</p>
    </div>
  `;
  return sendMail({ to: resident.email, subject, html });
}

async function sendImportantNoticeEmail({ resident, notice }) {
  const subject = `[Important Notice] ${notice.title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px;">
      <h2 style="color:#dc2626;">📌 Important Notice</h2>
      <h3>${notice.title}</h3>
      <p>${notice.body}</p>
      <hr/>
      <p style="color:#666; font-size:12px;">Society Maintenance Tracker — automated notification.</p>
    </div>
  `;
  return sendMail({ to: resident.email, subject, html });
}

module.exports = { sendMail, sendComplaintStatusEmail, sendImportantNoticeEmail };
