import { useState, useEffect } from 'react';
import api from '../services/api';

function AnalyticsPage() {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await api.get('/analytics');
      setAnalytics(res.data.data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading analytics...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Analytics</h1>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>Overview</h3>
        <p style={{ color: '#666' }}>
          Analytics data will appear here when synchronized from connected social accounts.
        </p>
        <p style={{ color: '#666', marginTop: '10px' }}>
          Metrics include: impressions, reach, engagement, followers, and post performance.
        </p>
      </div>

      {analytics.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '15px' }}>Recent Snapshots</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Platform</th>
                <th>Metrics</th>
              </tr>
            </thead>
            <tbody>
              {analytics.map((snapshot) => (
                <tr key={snapshot.id}>
                  <td>{new Date(snapshot.snapshotDate).toLocaleDateString()}</td>
                  <td>{snapshot.platform}</td>
                  <td>
                    <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                      {JSON.stringify(snapshot.metrics, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AnalyticsPage;
