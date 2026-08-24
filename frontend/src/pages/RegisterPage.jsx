import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    flatNumber: '',
    phone: '',
    adminCode: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.adminCode) delete payload.adminCode;
      const user = await register(payload);
      toast.success(`Account created — welcome, ${user.name}!`);
      navigate(user.role === 'ADMIN' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="auth-brand">
          <span className="auth-brand-icon">🏢</span>
          <span className="auth-brand-text">Society Maintenance Tracker</span>
        </div>
        <h1>Create your account</h1>
        <p className="muted">Register as a resident to raise and track complaints.</p>

        <label>
          Full name
          <input name="name" required value={form.name} onChange={onChange} placeholder="Priya Sharma" />
        </label>
        <label>
          Email
          <input type="email" name="email" required value={form.email} onChange={onChange} placeholder="you@example.com" />
        </label>
        <label>
          Password
          <input type="password" name="password" required minLength={6} value={form.password} onChange={onChange} placeholder="At least 6 characters" />
        </label>
        <div className="form-row">
          <label>
            Flat number
            <input name="flatNumber" value={form.flatNumber} onChange={onChange} placeholder="A-101" />
          </label>
          <label>
            Phone
            <input name="phone" value={form.phone} onChange={onChange} placeholder="Optional" />
          </label>
        </div>
        <details className="admin-code-details">
          <summary>Registering as society admin?</summary>
          <label>
            Admin signup code
            <input name="adminCode" value={form.adminCode} onChange={onChange} placeholder="Provided by whoever set up this app" />
          </label>
        </details>

        <button className="btn btn--primary" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="muted auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
