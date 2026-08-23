import { useEffect, useState } from 'react';
import { fetchDashboard } from '../../api/dashboard';
import LoadingSpinner from '../../components/LoadingSpinner';
import CategoryBarChart from '../../components/CategoryBarChart';
import { statusLabel } from '../../utils/constants';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch(() => setError('Failed to load dashboard'));
  }, []);

  if (error) return <div className="page"><p className="error-text">{error}</p></div>;
  if (!data) return <LoadingSpinner full />;

  return (
    <div className="page">
      <h1>Dashboard</h1>

      <div className="stat-grid">
        <StatTile label="Total complaints" value={data.totalComplaints} />
        {Object.entries(data.byStatus).map(([status, count]) => (
          <StatTile key={status} label={statusLabel(status)} value={count} />
        ))}
        <StatTile
          label="Overdue"
          value={data.overdueCount}
          tone="critical"
          hint={`> ${data.overdueThresholdDays} days open`}
        />
      </div>

      <div className="card chart-card">
        <h2>Complaints by category</h2>
        <CategoryBarChart data={data.byCategory} />
      </div>
    </div>
  );
}

function StatTile({ label, value, tone, hint }) {
  return (
    <div className={`stat-tile ${tone ? `stat-tile--${tone}` : ''}`}>
      <span className="stat-tile__value">{value}</span>
      <span className="stat-tile__label">{label}</span>
      {hint && <span className="stat-tile__hint">{hint}</span>}
    </div>
  );
}
