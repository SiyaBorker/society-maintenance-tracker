import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { StatusBadge, PriorityBadge, CategoryBadge, OverdueBadge } from './Badges';

export default function ComplaintCard({ complaint, linkBase }) {
  return (
    <Link to={`${linkBase}/${complaint.id}`} className="card card--complaint">
      {complaint.photoUrl && (
        <img src={complaint.photoUrl} alt="" className="card__thumb" loading="lazy" />
      )}
      <div className="card__body">
        <div className="card__badges">
          <StatusBadge status={complaint.status} />
          <PriorityBadge priority={complaint.priority} />
          <CategoryBadge category={complaint.category} />
          {complaint.isOverdue && <OverdueBadge />}
        </div>
        <p className="card__desc">{complaint.description}</p>
        <div className="card__footer">
          {complaint.resident && <span>{complaint.resident.name}{complaint.resident.flatNumber ? ` · ${complaint.resident.flatNumber}` : ''}</span>}
          <span>{format(new Date(complaint.createdAt), 'dd MMM yyyy')}</span>
          <span>{complaint.daysOpen} day{complaint.daysOpen === 1 ? '' : 's'} open</span>
        </div>
      </div>
    </Link>
  );
}
