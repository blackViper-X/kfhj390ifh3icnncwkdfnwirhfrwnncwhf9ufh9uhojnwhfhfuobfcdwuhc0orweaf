import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', approvalRequired: false });
  const [error, setError] = useState('');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const res = await api.get('/companies');
      setCompanies(res.data.data);
    } catch (err) {
      setError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/companies', formData);
      setShowForm(false);
      setFormData({ name: '', approvalRequired: false });
      loadCompanies();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create company');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this company?')) return;
    try {
      await api.delete(`/companies/${id}`);
      loadCompanies();
    } catch (err) {
      setError('Failed to delete company');
    }
  };

  if (loading) return <div className="loading">Loading companies...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Companies</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Create Company'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>New Company</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.approvalRequired}
                  onChange={(e) => setFormData({ ...formData, approvalRequired: e.target.checked })}
                />{' '}
                Require Approval
              </label>
            </div>
            <button type="submit" className="btn btn-primary">
              Create
            </button>
          </form>
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Approval</th>
            <th>Members</th>
            <th>Social Accounts</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company.id}>
              <td>
                <Link to={`/companies/${company.id}`}>{company.name}</Link>
              </td>
              <td>{company.slug}</td>
              <td>
                <span className={`badge ${company.approvalRequired ? 'badge-warning' : 'badge-secondary'}`}>
                  {company.approvalRequired ? 'Required' : 'Not Required'}
                </span>
              </td>
              <td>{company._count?.memberships || 0}</td>
              <td>{company._count?.socialAccounts || 0}</td>
              <td>
                <Link to={`/companies/${company.id}/social`} className="btn btn-secondary" style={{ marginRight: '5px' }}>
                  Social
                </Link>
                <button className="btn btn-danger" onClick={() => handleDelete(company.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CompaniesPage;
