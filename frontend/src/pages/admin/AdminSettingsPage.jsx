import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchSettings, updateSettings } from '../../api/settings';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminSettingsPage() {
  const [threshold, setThreshold] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then((data) => setThreshold(String(data.settings.overdueThresholdDays)))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateSettings({ overdueThresholdDays: Number(threshold) });
      toast.success('Overdue threshold updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner full />;

  return (
    <div className="page page--narrow">
      <h1>Settings</h1>
      <form className="card form-card" onSubmit={onSubmit}>
        <h2>Overdue threshold</h2>
        <p className="muted">
          A complaint is flagged overdue and surfaces at the top of the admin view once it has
          been open (not Resolved) for longer than this many days.
        </p>
        <label>
          Days
          <input
            type="number"
            min={1}
            max={365}
            required
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </label>
        <button className="btn btn--primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  );
}
