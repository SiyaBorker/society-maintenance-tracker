import { useEffect, useState } from 'react';
import { listComplaints } from '../../api/complaints';
import ComplaintCard from '../../components/ComplaintCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CATEGORIES, STATUSES } from '../../utils/constants';

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ category: '', status: '', dateFrom: '', dateTo: '' });

  const load = (activeFilters) => {
    const params = Object.fromEntries(Object.entries(activeFilters).filter(([, v]) => v));
    listComplaints(params)
      .then((data) => setComplaints(data.complaints))
      .catch(() => setError('Failed to load complaints'));
  };

  useEffect(() => {
    load(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFilterChange = (e) => {
    const next = { ...filters, [e.target.name]: e.target.value };
    setFilters(next);
    load(next);
  };

  const overdueCount = complaints?.filter((c) => c.isOverdue).length ?? 0;

  if (error) return <div className="page"><p className="error-text">{error}</p></div>;

  return (
    <div className="page">
      <div className="page__header">
        <h1>All complaints {complaints && <span className="muted">({complaints.length})</span>}</h1>
        {overdueCount > 0 && <span className="badge badge--overdue">⚠ {overdueCount} overdue</span>}
      </div>

      <div className="filter-bar">
        <label>
          Category
          <select name="category" value={filters.category} onChange={onFilterChange}>
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select name="status" value={filters.status} onChange={onFilterChange}>
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
        <label>
          From
          <input type="date" name="dateFrom" value={filters.dateFrom} onChange={onFilterChange} />
        </label>
        <label>
          To
          <input type="date" name="dateTo" value={filters.dateTo} onChange={onFilterChange} />
        </label>
      </div>

      {!complaints ? (
        <LoadingSpinner />
      ) : complaints.length === 0 ? (
        <p className="muted">No complaints match these filters.</p>
      ) : (
        <div className="card-grid">
          {complaints.map((c) => (
            <ComplaintCard key={c.id} complaint={c} linkBase="/admin/complaints" />
          ))}
        </div>
      )}
    </div>
  );
}
