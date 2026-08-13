import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [postsRes] = await Promise.all([api.get('/posts')]);

      const posts = postsRes.data.posts || [];
      const published = posts.filter((p) => p.contentStatus === 'PUBLISHED').length;
      const scheduled = posts.filter((p) => p.contentStatus === 'SCHEDULED').length;
      const drafts = posts.filter((p) => p.contentStatus === 'DRAFT').length;
      const failed = posts.filter((p) => p.contentStatus === 'FAILED').length;

      setStats({ published, scheduled, drafts, failed, total: posts.length });
    } catch (error) {
      console.error('Failed to load stats', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Dashboard</h1>

      <div className="grid grid-4" style={{ marginBottom: '30px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '2rem', color: '#007bff' }}>{stats?.total || 0}</h3>
          <p>Total Posts</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '2rem', color: '#28a745' }}>{stats?.published || 0}</h3>
          <p>Published</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '2rem', color: '#ffc107' }}>{stats?.scheduled || 0}</h3>
          <p>Scheduled</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '2rem', color: '#dc3545' }}>{stats?.failed || 0}</h3>
          <p>Failed</p>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '15px' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link to="/posts/new" className="btn btn-primary">
              Create New Post
            </Link>
            <Link to="/posts" className="btn btn-secondary">
              View All Posts
            </Link>
            {user?.systemRole === 'SUPERUSER' && (
              <Link to="/companies" className="btn btn-secondary">
                Manage Companies
              </Link>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '15px' }}>Recent Activity</h3>
          <p style={{ color: '#666' }}>Activity feed coming soon...</p>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
