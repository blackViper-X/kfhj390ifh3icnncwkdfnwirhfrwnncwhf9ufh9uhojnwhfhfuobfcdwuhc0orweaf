import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async (page = 1) => {
    try {
      const res = await api.get(`/posts?page=${page}`);
      setPosts(res.data.posts);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to load posts', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      DRAFT: 'badge-secondary',
      SCHEDULED: 'badge-info',
      PUBLISHING: 'badge-warning',
      PUBLISHED: 'badge-success',
      PARTIALLY_PUBLISHED: 'badge-warning',
      FAILED: 'badge-danger',
      CANCELLED: 'badge-secondary',
    };
    return <span className={`badge ${colors[status] || 'badge-secondary'}`}>{status}</span>;
  };

  if (loading) return <div className="loading">Loading posts...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Posts</h1>
        <Link to="/posts/new" className="btn btn-primary">
          Create Post
        </Link>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Created</th>
            <th>Platforms</th>
            <th>Status</th>
            <th>Approval</th>
            <th>Scheduled</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id}>
              <td>{new Date(post.createdAt).toLocaleDateString()}</td>
              <td>{post.targets?.map((t) => t.platform).join(', ')}</td>
              <td>{getStatusBadge(post.contentStatus)}</td>
              <td>{getStatusBadge(post.approvalStatus)}</td>
              <td>{post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : '-'}</td>
              <td>
                <Link to={`/posts/${post.id}`} className="btn btn-secondary">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pagination.totalPages > 1 && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            className="btn btn-secondary"
            disabled={pagination.page <= 1}
            onClick={() => loadPosts(pagination.page - 1)}
            style={{ marginRight: '10px' }}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className="btn btn-secondary"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => loadPosts(pagination.page + 1)}
            style={{ marginLeft: '10px' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default PostsPage;
