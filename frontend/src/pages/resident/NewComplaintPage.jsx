import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createComplaint } from '../../api/complaints';
import { CATEGORIES } from '../../utils/constants';

export default function NewComplaintPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onPhotoChange = (e) => {
    const file = e.target.files?.[0];
    setPhoto(file || null);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!category) {
      toast.error('Please choose a category');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('description', description);
      if (photo) formData.append('photo', photo);

      await createComplaint(formData);
      toast.success('Complaint raised successfully');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to raise complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page page--narrow">
      <h1>Raise a complaint</h1>
      <form className="card form-card" onSubmit={onSubmit}>
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="" disabled>Select a category…</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>

        <label>
          Description
          <textarea
            required
            minLength={5}
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail — location, when it started, anything relevant…"
          />
        </label>

        <label>
          Photo (optional)
          <input type="file" accept="image/*" onChange={onPhotoChange} />
        </label>
        {preview && <img src={preview} alt="Preview" className="photo-preview" />}

        <button className="btn btn--primary" type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit complaint'}
        </button>
      </form>
    </div>
  );
}
