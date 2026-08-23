import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { getComplaint, updateComplaintStatus, updateComplaintPriority } from '../../api/complaints';
import { StatusBadge, PriorityBadge, CategoryBadge, OverdueBadge } from '../../components/Badges';
import ComplaintHistoryTimeline from '../../components/ComplaintHistoryTimeline';
import LoadingSpinner from '../../components/LoadingSpinner';
import { STATUSES, PRIORITIES } from '../../utils/constants';

export default function AdminComplaintDetailPage() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState(null);
  const [statusDraft, setStatusDraft] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () =>
    getComplaint(id)
      .then((data) => {
        setComplaint(data.complaint);
        setStatusDraft(data.complaint.status);
      })
      .catch(() => setError('Failed to load this complaint'));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onUpdateStatus = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateComplaintStatus(id, { status: statusDraft, note: note || undefined });
      toast.success('Status updated and resident notified by email');
      setNote('');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const onPriorityChange = async (e) => {
    const priority = e.target.value;
    try {
      await updateComplaintPriority(id, { priority });
      toast.success('Priority updated');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update priority');
    }
  };

  if (error) return <div className="page"><p className="error-text">{error}</p></div>;
  if (!complaint) return <LoadingSpinner full />;

  const isClosed = complaint.status === 'RESOLVED';

  return (
    <div className="page page--narrow">
      <Link to="/admin" className="back-link">← Back to all complaints</Link>
      <div className="card detail-card">
        <div className="card__badges">
          <StatusBadge status={complaint.status} />
          <PriorityBadge priority={complaint.priority} />
          <CategoryBadge category={complaint.category} />
          {complaint.isOverdue && <OverdueBadge />}
        </div>

        <p className="detail-desc">{complaint.description}</p>
        {complaint.photoUrl && <img src={complaint.photoUrl} alt="Complaint" className="detail-photo" />}
        <p className="muted">
          Raised by {complaint.resident?.name} {complaint.resident?.flatNumber ? `(${complaint.resident.flatNumber})` : ''} on{' '}
          {format(new Date(complaint.createdAt), 'dd MMM yyyy, HH:mm')} · {complaint.daysOpen} day{complaint.daysOpen === 1 ? '' : 's'} open
        </p>

        <div className="admin-actions">
          <label>
            Priority
            <select value={complaint.priority} onChange={onPriorityChange} disabled={isClosed}>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
        </div>

        {isClosed ? (
          <p className="closed-note">✔ This complaint is Resolved and closed. No further updates are possible.</p>
        ) : (
          <form className="status-form" onSubmit={onUpdateStatus}>
            <h2>Update status</h2>
            <label>
              New status
              <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
            <label>
              Note (optional, shown to the resident)
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Plumber scheduled for tomorrow morning" />
            </label>
            <button className="btn btn--primary" type="submit" disabled={submitting}>
              {submitting ? 'Updating…' : 'Update status'}
            </button>
          </form>
        )}

        <h2>Status history</h2>
        <ComplaintHistoryTimeline history={complaint.history} />
      </div>
    </div>
  );
}
