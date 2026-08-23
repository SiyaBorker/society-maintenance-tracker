import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listNotices, createNotice } from '../../api/notices';
import NoticeCard from '../../components/NoticeCard';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ title: '', body: '', isImportant: false });
  const [submitting, setSubmitting] = useState(false);

  const load = () =>
    listNotices()
      .then((data) => setNotices(data.notices))
      .catch(() => setError('Failed to load notices'));

  useEffect(() => {
    load();
  }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createNotice(form);
      toast.success(
        form.isImportant ? 'Notice posted — residents notified by email' : 'Notice posted'
      );
      setForm({ title: '', body: '', isImportant: false });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post notice');
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <div className="page"><p className="error-text">{error}</p></div>;

  return (
    <div className="page page--narrow">
      <h1>Notice board</h1>

      <form className="card form-card" onSubmit={onSubmit}>
        <h2>Post a new notice</h2>
        <label>
          Title
          <input name="title" required value={form.title} onChange={onChange} placeholder="e.g. Water supply maintenance on Sunday" />
        </label>
        <label>
          Body
          <textarea name="body" required rows={4} value={form.body} onChange={onChange} placeholder="Notice details…" />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" name="isImportant" checked={form.isImportant} onChange={onChange} />
          Mark as important (pins to top &amp; emails all residents)
        </label>
        <button className="btn btn--primary" type="submit" disabled={submitting}>
          {submitting ? 'Posting…' : 'Post notice'}
        </button>
      </form>

      {!notices ? (
        <LoadingSpinner />
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
