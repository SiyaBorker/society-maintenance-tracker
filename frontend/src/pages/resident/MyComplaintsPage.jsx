import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listComplaints } from '../../api/complaints';
import ComplaintCard from '../../components/ComplaintCard';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function MyComplaintsPage() {
  const [complaints, setComplaints] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    listComplaints()
      .then((data) => setComplaints(data.complaints))
      .catch(() => setError('Failed to load your complaints'));
  }, []);

  if (error) return <div className="page"><p className="error-text">{error}</p></div>;
  if (!complaints) return <LoadingSpinner full />;

  return (
    <div className="page">
      <div className="page__header">
        <h1>My complaints</h1>
        <Link to="/new" className="btn btn--primary">+ Raise complaint</Link>
      </div>

      {complaints.length === 0 ? (
        <p className="muted">You haven't raised any complaints yet.</p>
      ) : (
        <div className="card-grid">
          {complaints.map((c) => (
            <ComplaintCard key={c.id} complaint={c} linkBase="/complaints" />
          ))}
        </div>
      )}
    </div>
  );
}
