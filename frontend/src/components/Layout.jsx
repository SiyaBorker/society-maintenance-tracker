import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const residentLinks = [
    { to: '/', label: 'My Complaints', end: true },
    { to: '/new', label: 'Raise Complaint' },
    { to: '/notices', label: 'Notice Board' },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Complaints', end: true },
    { to: '/admin/notices', label: 'Notice Board' },
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/settings', label: 'Settings' },
  ];

  const links = user?.role === 'ADMIN' ? adminLinks : residentLinks;

  const initials = user?.name
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__brand-icon">🏢</span>
          <span className="topbar__brand-text">Society Maintenance Tracker</span>
        </div>
        {user && (
          <nav className="topbar__nav">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}
        {user && (
          <div className="topbar__user">
            <span className="topbar__avatar">{initials}</span>
            <span className="topbar__user-info">
              <span className="topbar__user-name">{user.name}</span>
              <span className="topbar__user-role">{user.role === 'ADMIN' ? 'Admin' : 'Resident'}</span>
            </span>
            <button className="btn btn--ghost" onClick={handleLogout}>Log out</button>
          </div>
        )}
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
