import { useState, useEffect } from 'react';
import api from '../services/api';

function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async (page = 1) => {
    try {
      const res = await api.get(`/audit?page=${page}`);
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading audit logs...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Audit Log</h1>

      <table className="table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Target</th>
            <th>Result</th>
            <th>Company</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{new Date(log.createdAt).toLocaleString()}</td>
              <td>{log.actor?.name || 'System'}</td>
              <td>
                <span className="badge badge-info">{log.action}</span>
              </td>
              <td>
                {log.targetType} {log.targetId?.slice(0, 8)}
              </td>
              <td>
                <span className={`badge ${log.result === 'SUCCESS' ? 'badge-success' : 'badge-danger'}`}>
                  {log.result || 'N/A'}
                </span>
              </td>
              <td>{log.company?.name || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {pagination.totalPages > 1 && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            className="btn btn-secondary"
            disabled={pagination.page <= 1}
            onClick={() => loadAuditLogs(pagination.page - 1)}
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
            onClick={() => loadAuditLogs(pagination.page + 1)}
            style={{ marginLeft: '10px' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default AuditPage;
