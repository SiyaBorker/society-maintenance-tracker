import { format } from 'date-fns';

export default function NoticeCard({ notice }) {
  return (
    <div className={`card card--notice ${notice.isImportant ? 'card--notice-important' : ''}`}>
      <div className="card__badges">
        {notice.isImportant && <span className="badge badge--overdue">📌 Important</span>}
        <span className="muted">{format(new Date(notice.createdAt), 'dd MMM yyyy, HH:mm')}</span>
      </div>
      <h3>{notice.title}</h3>
      <p>{notice.body}</p>
      <p className="muted card__footer-text">Posted by {notice.author?.name || 'Admin'}</p>
    </div>
  );
}
