import { format } from 'date-fns';
import { StatusBadge } from './Badges';

export default function ComplaintHistoryTimeline({ history }) {
  if (!history?.length) return <p className="muted">No history yet.</p>;

  return (
    <ol className="timeline">
      {history.map((entry) => (
        <li key={entry.id} className="timeline__item">
          <div className="timeline__dot" />
          <div className="timeline__content">
            <div className="timeline__row">
              <StatusBadge status={entry.status} />
              <span className="timeline__meta">
                {format(new Date(entry.timestamp), 'dd MMM yyyy, HH:mm')} · {entry.actorRole === 'ADMIN' ? 'Admin' : 'Resident'}
              </span>
            </div>
            {entry.note && <p className="timeline__note">{entry.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
