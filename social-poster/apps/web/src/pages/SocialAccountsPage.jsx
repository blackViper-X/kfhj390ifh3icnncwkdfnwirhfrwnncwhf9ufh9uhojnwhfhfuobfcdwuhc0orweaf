import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

function SocialAccountsPage() {
  const { id } = useParams();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAccounts();
  }, [id]);

  const loadAccounts = async () => {
    try {
      const res = await api.get(`/companies/${id}/social-accounts`);
      setAccounts(res.data.data);
    } catch (err) {
      setError('Failed to load social accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform) => {
    try {
      const res = await api.get(`/companies/${id}/social-accounts/${platform}/connect`);
      window.location.href = res.data.data.authUrl;
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start OAuth flow. Make sure platform is configured.');
    }
  };

  const handleDisconnect = async (accountId) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;
    try {
      await api.post(`/social-accounts/${accountId}/disconnect`);
      loadAccounts();
    } catch (err) {
      alert('Failed to disconnect account');
    }
  };

  const platforms = ['FACEBOOK', 'INSTAGRAM', 'YOUTUBE', 'YOUTUBE_SHORTS', 'PINTEREST'];

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Social Accounts</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-2">
        {platforms.map((platform) => {
          const account = accounts.find((a) => a.platform === platform);
          return (
            <div key={platform} className="card">
              <h3>{platform}</h3>
              {account ? (
                <div>
                  <p>
                    <strong>Account:</strong> {account.accountName || 'Unknown'}
                  </p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span
                      className={`badge ${
                        account.status === 'CONNECTED'
                          ? 'badge-success'
                          : account.status === 'REAUTH_REQUIRED'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}
                    >
                      {account.status}
                    </span>
                  </p>
                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                    {account.status !== 'CONNECTED' && (
                      <button className="btn btn-primary" onClick={() => handleConnect(platform)}>
                        Reconnect
                      </button>
                    )}
                    <button className="btn btn-danger" onClick={() => handleDisconnect(account.id)}>
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ color: '#666' }}>Not connected</p>
                  <button className="btn btn-primary" onClick={() => handleConnect(platform)} style={{ marginTop: '10px' }}>
                    Connect
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SocialAccountsPage;
