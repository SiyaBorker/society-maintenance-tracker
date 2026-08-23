import { useEffect, useState } from 'react';
import { listNotices } from '../../api/notices';
import NoticeCard from '../../components/NoticeCard';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function NoticeBoardPage() {
  const [notices, setNotices] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    listNotices()
      .then((data) => setNotices(data.notices))
      .catch(() => setError('Failed to load the notice board'));
  }, []);

  if (error) return <div className="page"><p className="error-text">{error}</p></div>;
  if (!notices) return <LoadingSpinner full />;

  return (
    <div className="page page--narrow">
      <h1>Notice board</h1>
      {notices.length === 0 ? (
        <p className="muted">No notices yet.</p>
      ) : (
        <div className="notice-list">
          {notices.map((n) => (
            <NoticeCard key={n.id} notice={n} />
          ))}
        </div>
      )}
    </div>
  );
}
