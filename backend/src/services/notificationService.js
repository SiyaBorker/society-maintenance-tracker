const { sendViaResend } = require('../config/email');

/**
 * Sends an email via Resend if configured, otherwise logs it.
 * Failures are swallowed (logged, not thrown) so a broken mail provider
 * never breaks the underlying complaint/notice API call that triggered it.
 */
async function sendMail({ to, subject, html }) {
  try {
    const result = await sendViaResend({ to, subject, html });
    if (!result.sent) {
      console.log(`[email:skipped] to=${to} subject="${subject}"`);
    }
    return result;
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

async function sendNewCommentEmail({ to, complaint, author, message }) {
  const authorLabel = author.role === 'ADMIN' ? 'Admin' : 'Resident';
  const subject = `New comment on complaint #${complaint.id.slice(0, 8)}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px;">
      <h2 style="color:#2563eb;">New comment</h2>
      <p>Hi ${to.name},</p>
      <p><strong>${author.name}</strong> (${authorLabel}) commented on complaint
      <strong>#${complaint.id.slice(0, 8)}</strong> (${complaint.category.replace('_', ' ')}):</p>
      <p style="background:#f8fafc; border-radius:8px; padding:12px 16px;">${message}</p>
      <hr/>
      <p style="color:#666; font-size:12px;">Society Maintenance Tracker — automated notification.</p>
    </div>
  `;
  return sendMail({ to: to.email, subject, html });
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

module.exports = { sendMail, sendComplaintStatusEmail, sendNewCommentEmail, sendImportantNoticeEmail };
