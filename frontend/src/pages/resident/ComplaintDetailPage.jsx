import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getComplaint } from '../../api/complaints';
import { StatusBadge, PriorityBadge, CategoryBadge, OverdueBadge } from '../../components/Badges';
import ComplaintHistoryTimeline from '../../components/ComplaintHistoryTimeline';
import LoadingSpinner from '../../components/LoadingSpinner';
import { format } from 'date-fns';

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getComplaint(id)
      .then((data) => setComplaint(data.complaint))
      .catch(() => setError('Failed to load this complaint'));
  }, [id]);

  if (error) return <div className="page"><p className="error-text">{error}</p></div>;
  if (!complaint) return <LoadingSpinner full />;

  return (
    <div className="page page--narrow">
      <Link to="/" className="back-link">← Back to my complaints</Link>
      <div className="card detail-card">
        <div className="card__badges">
          <StatusBadge status={complaint.status} />
          <PriorityBadge priority={complaint.priority} />
          <CategoryBadge category={complaint.category} />
          {complaint.isOverdue && <OverdueBadge />}
        </div>
        <p className="detail-desc">{complaint.description}</p>
        {complaint.photoUrl && <img src={complaint.photoUrl} alt="Complaint" className="detail-photo" />}
        <p className="muted">Raised on {format(new Date(complaint.createdAt), 'dd MMM yyyy, HH:mm')} · {complaint.daysOpen} day{complaint.daysOpen === 1 ? '' : 's'} open</p>

        <h2>Status history</h2>
        <ComplaintHistoryTimeline history={complaint.history} />
      </div>
    </div>
  );
}
