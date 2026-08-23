import { categoryLabel, statusLabel, priorityLabel } from '../utils/constants';

export function StatusBadge({ status }) {
  return <span className={`badge badge--status-${status}`}>{statusLabel(status)}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={`badge badge--priority-${priority}`}>{priorityLabel(priority)}</span>;
}

export function CategoryBadge({ category }) {
  return <span className="badge badge--category">{categoryLabel(category)}</span>;
}

export function OverdueBadge() {
  return <span className="badge badge--overdue">⚠ Overdue</span>;
}
