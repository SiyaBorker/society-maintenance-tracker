import { useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { addComplaintComment } from '../api/complaints';

export default function CommentThread({ complaintId, comments, onCommentAdded }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    setSending(true);
    try {
      await addComplaintComment(complaintId, { message: trimmed });
      setMessage('');
      await onCommentAdded();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="comment-thread">
      <div className="comment-thread__list">
        {!comments?.length ? (
          <p className="muted">No messages yet.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="comment">
              <div className="comment__row">
                <span className="comment__author">{c.author?.name}</span>
                <span className="timeline__meta">
                  {format(new Date(c.createdAt), 'dd MMM yyyy, HH:mm')} · {c.authorRole === 'ADMIN' ? 'Admin' : 'Resident'}
                </span>
              </div>
              <p className="comment__message">{c.message}</p>
            </div>
          ))
        )}
      </div>
      <form className="comment-thread__form" onSubmit={onSubmit}>
        <textarea
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a message…"
          maxLength={2000}
        />
        <button className="btn btn--primary" type="submit" disabled={sending || !message.trim()}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
