// import { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import api from '../services/api';

// function CompanyDetailPage() {
//   const { id } = useParams();
//   const [company, setCompany] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [managerForm, setManagerForm] = useState({ email: '', name: '', password: '' });
//   const [configForm, setConfigForm] = useState({
//     platform: 'FACEBOOK',
//     clientId: '',
//     clientSecret: '',
//     redirectUri: '',
//     scopes: '',
//   });

//   useEffect(() => {
//     loadCompany();
//   }, [id]);

//   const loadCompany = async () => {
//     try {
//       const res = await api.get(`/companies/${id}`);
//       setCompany(res.data.data);
//     } catch (err) {
//       setError('Failed to load company');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateManager = async (e) => {
//     e.preventDefault();
//     try {
//       await api.post(`/companies/${id}/manager`, managerForm);
//       setManagerForm({ email: '', name: '', password: '' });
//       loadCompany();
//       alert('Manager created successfully');
//     } catch (err) {
//       alert(err.response?.data?.message || 'Failed to create manager');
//     }
//   };

//   const handleSaveConfig = async (e) => {
//     e.preventDefault();
//     try {
//       await api.post(`/companies/${id}/platform-configs`, configForm);
//       loadCompany();
//       alert('Platform configuration saved');
//     } catch (err) {
//       alert(err.response?.data?.message || 'Failed to save configuration');
//     }
//   };

//   if (loading) return <div className="loading">Loading...</div>;
//   if (!company) return <div className="alert alert-error">Company not found</div>;

//   return (
//     <div>
//       <h1 style={{ marginBottom: '20px' }}>{company.name}</h1>

//       <div className="grid grid-2">
//         <div className="card">
//           <h3 style={{ marginBottom: '15px' }}>Company Info</h3>
//           <p>
//             <strong>Slug:</strong> {company.slug}
//           </p>
//           <p>
//             <strong>Approval Required:</strong> {company.approvalRequired ? 'Yes' : 'No'}
//           </p>
//           <p>
//             <strong>Posts:</strong> {company._count?.posts || 0}
//           </p>
//           <p>
//             <strong>Publications:</strong> {company._count?.publications || 0}
//           </p>
//         </div>

//         <div className="card">
//           <h3 style={{ marginBottom: '15px' }}>Managers</h3>
//           {company.memberships?.length > 0 ? (
//             <ul>
//               {company.memberships.map((m) => (
//                 <li key={m.id}>
//                   {m.user.name} ({m.user.email}) - {m.role}
//                 </li>
//               ))}
//             </ul>
//           ) : (
//             <p>No managers assigned</p>
//           )}

//           <h4 style={{ marginTop: '15px', marginBottom: '10px' }}>Add Manager</h4>
//           <form onSubmit={handleCreateManager}>
//             <div className="form-group">
//               <input
//                 type="email"
//                 placeholder="Email"
//                 value={managerForm.email}
//                 onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })}
//                 required
//               />
//             </div>
//             <div className="form-group">
//               <input
//                 type="text"
//                 placeholder="Name"
//                 value={managerForm.name}
//                 onChange={(e) => setManagerForm({ ...managerForm, name: e.target.value })}
//                 required
//               />
//             </div>
//             <div className="form-group">
//               <input
//                 type="password"
//                 placeholder="Password"
//                 value={managerForm.password}
//                 onChange={(e) => setManagerForm({ ...managerForm, password: e.target.value })}
//                 required
//               />
//             </div>
//             <button type="submit" className="btn btn-primary">
//               Add Manager
//             </button>
//           </form>
//         </div>
//       </div>

//       <div className="card" style={{ marginTop: '20px' }}>
//         <h3 style={{ marginBottom: '15px' }}>Platform Configurations</h3>
//         {company.platformConfigs?.length > 0 && (
//           <table className="table" style={{ marginBottom: '20px' }}>
//             <thead>
//               <tr>
//                 <th>Platform</th>
//                 <th>Client ID</th>
//                 <th>Redirect URI</th>
//                 <th>Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {company.platformConfigs.map((config) => (
//                 <tr key={config.id}>
//                   <td>{config.platform}</td>
//                   <td>{config.clientId}</td>
//                   <td>{config.redirectUri}</td>
//                   <td>
//                     <span className={`badge ${config.isActive ? 'badge-success' : 'badge-danger'}`}>
//                       {config.isActive ? 'Active' : 'Inactive'}
//                     </span>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}

//         <h4 style={{ marginBottom: '10px' }}>Configure Platform</h4>
//         <form onSubmit={handleSaveConfig}>
//           <div className="grid grid-2">
//             <div className="form-group">
//               <label>Platform</label>
//               <select
//                 value={configForm.platform}
//                 onChange={(e) => setConfigForm({ ...configForm, platform: e.target.value })}
//               >
//                 <option value="FACEBOOK">Facebook</option>
//                 <option value="INSTAGRAM">Instagram</option>
//                 <option value="YOUTUBE">YouTube</option>
//                 <option value="PINTEREST">Pinterest</option>
//               </select>
//             </div>
//             <div className="form-group">
//               <label>Client ID</label>
//               <input
//                 type="text"
//                 value={configForm.clientId}
//                 onChange={(e) => setConfigForm({ ...configForm, clientId: e.target.value })}
//                 required
//               />
//             </div>
//             <div className="form-group">
//               <label>Client Secret</label>
//               <input
//                 type="password"
//                 value={configForm.clientSecret}
//                 onChange={(e) => setConfigForm({ ...configForm, clientSecret: e.target.value })}
//                 required
//               />
//             </div>
//             <div className="form-group">
//               <label>Redirect URI</label>
//               <input
//                 type="text"
//                 value={configForm.redirectUri}
//                 onChange={(e) => setConfigForm({ ...configForm, redirectUri: e.target.value })}
//                 required
//                 placeholder="http://localhost:4000/api/v1/social-accounts/oauth/callback"
//               />
//             </div>
//           </div>
//           <div className="form-group">
//             <label>Scopes (optional)</label>
//             <input
//               type="text"
//               value={configForm.scopes}
//               onChange={(e) => setConfigForm({ ...configForm, scopes: e.target.value })}
//             />
//           </div>
//           <button type="submit" className="btn btn-primary">
//             Save Configuration
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default CompanyDetailPage;


import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

function CompanyDetailPage() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [managerForm, setManagerForm] = useState({ email: '', name: '', password: '' });
  const [configForm, setConfigForm] = useState({
    platform: 'FACEBOOK',
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: '',
  });
  const [editingPlatform, setEditingPlatform] = useState(null);

  useEffect(() => {
    loadCompany();
  }, [id]);

  const loadCompany = async () => {
    try {
      const res = await api.get(`/companies/${id}`);
      setCompany(res.data.data);
    } catch (err) {
      setError('Failed to load company');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManager = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/companies/${id}/manager`, managerForm);
      setManagerForm({ email: '', name: '', password: '' });
      loadCompany();
      alert('Manager created successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create manager');
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/companies/${id}/platform-configs`, configForm);
      setConfigForm({ platform: 'FACEBOOK', clientId: '', clientSecret: '', redirectUri: '', scopes: '' });
      setEditingPlatform(null);
      loadCompany();
      alert('Platform configuration saved');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save configuration');
    }
  };

  const handleDeleteConfig = async (platform) => {
    if (!confirm(`Delete ${platform} configuration? You will need to re-enter credentials.`)) return;
    try {
      await api.delete(`/companies/${id}/platform-configs/${platform}`);
      loadCompany();
      alert('Configuration deleted');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete configuration');
    }
  };

  const handleEditConfig = (config) => {
    setEditingPlatform(config.platform);
    setConfigForm({
      platform: config.platform,
      clientId: config.clientId,
      clientSecret: '',
      redirectUri: config.redirectUri,
      scopes: config.scopes || '',
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingPlatform(null);
    setConfigForm({ platform: 'FACEBOOK', clientId: '', clientSecret: '', redirectUri: '', scopes: '' });
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!company) return <div className="alert alert-error">Company not found</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>{company.name}</h1>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '15px' }}>Company Info</h3>
          <p><strong>Slug:</strong> {company.slug}</p>
          <p><strong>Approval Required:</strong> {company.approvalRequired ? 'Yes' : 'No'}</p>
          <p><strong>Posts:</strong> {company._count?.posts || 0}</p>
          <p><strong>Publications:</strong> {company._count?.publications || 0}</p>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '15px' }}>Managers</h3>
          {company.memberships?.length > 0 ? (
            <ul>
              {company.memberships.map((m) => (
                <li key={m.id}>{m.user.name} ({m.user.email}) - {m.role}</li>
              ))}
            </ul>
          ) : (
            <p>No managers assigned</p>
          )}

          <h4 style={{ marginTop: '15px', marginBottom: '10px' }}>Add Manager</h4>
          <form onSubmit={handleCreateManager}>
            <div className="form-group">
              <input type="email" placeholder="Email" value={managerForm.email} onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <input type="text" placeholder="Name" value={managerForm.name} onChange={(e) => setManagerForm({ ...managerForm, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <input type="password" placeholder="Password" value={managerForm.password} onChange={(e) => setManagerForm({ ...managerForm, password: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary">Add Manager</button>
          </form>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>Platform Configurations</h3>
        {company.platformConfigs?.length > 0 && (
          <table className="table" style={{ marginBottom: '20px' }}>
            <thead>
              <tr>
                <th>Platform</th>
                <th>Client ID</th>
                <th>Redirect URI</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {company.platformConfigs.map((config) => (
                <tr key={config.id}>
                  <td><strong>{config.platform}</strong></td>
                  <td style={{ fontSize: '12px', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{config.clientId}</td>
                  <td style={{ fontSize: '12px' }}>{config.redirectUri}</td>
                  <td>
                    <span className={`badge ${config.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {config.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary" style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }} onClick={() => handleEditConfig(config)}>
                      Edit
                    </button>
                    <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => handleDeleteConfig(config.platform)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h4 style={{ marginBottom: '10px' }}>
          {editingPlatform ? `Edit ${editingPlatform} Configuration` : 'Add / Update Platform Configuration'}
        </h4>
        {editingPlatform && (
          <div className="alert alert-info" style={{ marginBottom: '10px' }}>
            Editing <strong>{editingPlatform}</strong>. Enter a new Client Secret to update it, or leave blank to keep the existing one.
          </div>
        )}
        <form onSubmit={handleSaveConfig}>
          <div className="grid grid-2">
            <div className="form-group">
              <label>Platform</label>
              <select value={configForm.platform} onChange={(e) => setConfigForm({ ...configForm, platform: e.target.value })} disabled={!!editingPlatform}>
                <option value="FACEBOOK">Facebook</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="PINTEREST">Pinterest</option>
              </select>
            </div>
            <div className="form-group">
              <label>Client ID</label>
              <input type="text" value={configForm.clientId} onChange={(e) => setConfigForm({ ...configForm, clientId: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Client Secret {editingPlatform && '(leave blank to keep existing)'}</label>
              <input type="password" value={configForm.clientSecret} onChange={(e) => setConfigForm({ ...configForm, clientSecret: e.target.value })} required={!editingPlatform} placeholder={editingPlatform ? '•••••••• (unchanged)' : ''} />
            </div>
            <div className="form-group">
              <label>Redirect URI</label>
              <input type="text" value={configForm.redirectUri} onChange={(e) => setConfigForm({ ...configForm, redirectUri: e.target.value })} required placeholder="http://localhost:4000/api/v1/social-accounts/oauth/callback" />
            </div>
          </div>
          <div className="form-group">
            <label>Scopes (optional)</label>
            <input type="text" value={configForm.scopes} onChange={(e) => setConfigForm({ ...configForm, scopes: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary">
              {editingPlatform ? 'Update Configuration' : 'Save Configuration'}
            </button>
            {editingPlatform && (
              <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompanyDetailPage;
