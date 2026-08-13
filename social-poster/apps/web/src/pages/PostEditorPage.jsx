// import { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import api from '../services/api';

// function PostEditorPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const isNew = !id;

//   const [post, setPost] = useState(null);
//   const [loading, setLoading] = useState(!isNew);
//   const [error, setError] = useState('');

//   const [targets, setTargets] = useState([
//     { platform: 'FACEBOOK', socialAccountId: '', caption: '' },
//   ]);
//   const [globalMediaMode, setGlobalMediaMode] = useState('INTELLIGENT');
//   const [scheduledAt, setScheduledAt] = useState('');
//   const [socialAccounts, setSocialAccounts] = useState([]);

//   useEffect(() => {
//     loadSocialAccounts();
//     if (id) loadPost();
//   }, [id]);

//   const loadPost = async () => {
//     try {
//       const res = await api.get(`/posts/${id}`);
//       const postData = res.data.data;
//       setPost(postData);
//       setTargets(postData.targets || []);
//       setGlobalMediaMode(postData.globalMediaMode || 'INTELLIGENT');
//       if (postData.scheduledAt) {
//         setScheduledAt(new Date(postData.scheduledAt).toISOString().slice(0, 16));
//       }
//     } catch (err) {
//       setError('Failed to load post');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadSocialAccounts = async () => {
//     try {
//       const res = await api.get('/companies/placeholder/social-accounts').catch(() => null);
//       if (res?.data?.data) {
//         setSocialAccounts(res.data.data.filter((a) => a.status === 'CONNECTED'));
//       }
//     } catch (err) {
//       console.error('Failed to load social accounts', err);
//     }
//   };

//   const handleTargetChange = (index, field, value) => {
//     const updated = [...targets];
//     updated[index] = { ...updated[index], [field]: value };
//     setTargets(updated);
//   };

//   const addTarget = () => {
//     setTargets([...targets, { platform: 'INSTAGRAM', socialAccountId: '', caption: '' }]);
//   };

//   const removeTarget = (index) => {
//     setTargets(targets.filter((_, i) => i !== index));
//   };

//   const handleSave = async () => {
//     try {
//       const data = {
//         targets,
//         globalMediaMode,
//         scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
//         timezone: 'Asia/Kolkata',
//       };

//       if (isNew) {
//         await api.post('/posts', data);
//       } else {
//         await api.patch(`/posts/${id}`, data);
//       }

//       navigate('/posts');
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to save post');
//     }
//   };

//   const handlePublish = async () => {
//     try {
//       if (isNew) {
//         await handleSave();
//       }
//       const postId = id || post?.id;
//       if (!postId) {
//         setError('Save the post first before publishing');
//         return;
//       }
//       await api.post('/publications', { postId });
//       alert('Publication started! Check the posts page for status.');
//       navigate('/posts');
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to publish');
//     }
//   };

//   const handleSubmitApproval = async () => {
//     try {
//       await api.post(`/posts/${id}/submit-approval`);
//       alert('Submitted for approval');
//       loadPost();
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to submit');
//     }
//   };

//   if (loading) return <div className="loading">Loading...</div>;

//   return (
//     <div>
//       <h1 style={{ marginBottom: '20px' }}>{isNew ? 'Create Post' : 'Edit Post'}</h1>

//       {error && <div className="alert alert-error">{error}</div>}

//       <div className="card" style={{ marginBottom: '20px' }}>
//         <h3 style={{ marginBottom: '15px' }}>Post Settings</h3>
//         <div className="grid grid-2">
//           <div className="form-group">
//             <label>Media Processing Mode</label>
//             <select value={globalMediaMode} onChange={(e) => setGlobalMediaMode(e.target.value)}>
//               <option value="INTELLIGENT">Intelligent (Focal Point Crop)</option>
//               <option value="RESIZE_PAD">Resize & Pad</option>
//             </select>
//           </div>
//           <div className="form-group">
//             <label>Schedule (IST)</label>
//             <input
//               type="datetime-local"
//               value={scheduledAt}
//               onChange={(e) => setScheduledAt(e.target.value)}
//             />
//           </div>
//         </div>
//       </div>

//       <div className="card" style={{ marginBottom: '20px' }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
//           <h3>Platform Targets</h3>
//           <button className="btn btn-secondary" onClick={addTarget}>
//             + Add Platform
//           </button>
//         </div>

//         {targets.map((target, index) => (
//           <div key={index} className="card" style={{ backgroundColor: '#f8f9fa', marginBottom: '15px' }}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
//               <h4>Target {index + 1}</h4>
//               {targets.length > 1 && (
//                 <button className="btn btn-danger" onClick={() => removeTarget(index)}>
//                   Remove
//                 </button>
//               )}
//             </div>
//             <div className="grid grid-2">
//               <div className="form-group">
//                 <label>Platform</label>
//                 <select
//                   value={target.platform}
//                   onChange={(e) => handleTargetChange(index, 'platform', e.target.value)}
//                 >
//                   <option value="FACEBOOK">Facebook</option>
//                   <option value="INSTAGRAM">Instagram</option>
//                   <option value="YOUTUBE">YouTube</option>
//                   <option value="YOUTUBE_SHORTS">YouTube Shorts</option>
//                   <option value="PINTEREST">Pinterest</option>
//                 </select>
//               </div>
//               <div className="form-group">
//                 <label>Social Account ID</label>
//                 <input
//                   type="text"
//                   value={target.socialAccountId}
//                   onChange={(e) => handleTargetChange(index, 'socialAccountId', e.target.value)}
//                   placeholder="Enter connected account ID"
//                 />
//               </div>
//             </div>
//             <div className="form-group">
//               <label>Caption</label>
//               <textarea
//                 value={target.caption || ''}
//                 onChange={(e) => handleTargetChange(index, 'caption', e.target.value)}
//                 placeholder="Write your caption..."
//               />
//             </div>
//             {(target.platform === 'YOUTUBE' || target.platform === 'YOUTUBE_SHORTS' || target.platform === 'PINTEREST') && (
//               <div className="grid grid-2">
//                 <div className="form-group">
//                   <label>Title</label>
//                   <input
//                     type="text"
//                     value={target.title || ''}
//                     onChange={(e) => handleTargetChange(index, 'title', e.target.value)}
//                   />
//                 </div>
//                 <div className="form-group">
//                   <label>Description</label>
//                   <textarea
//                     value={target.description || ''}
//                     onChange={(e) => handleTargetChange(index, 'description', e.target.value)}
//                   />
//                 </div>
//               </div>
//             )}
//             {(target.platform === 'YOUTUBE') && (
//               <div className="form-group">
//                 <label>Keywords (comma separated)</label>
//                 <input
//                   type="text"
//                   value={target.keywords || ''}
//                   onChange={(e) => handleTargetChange(index, 'keywords', e.target.value)}
//                 />
//               </div>
//             )}
//           </div>
//         ))}
//       </div>

//       <div style={{ display: 'flex', gap: '10px' }}>
//         <button className="btn btn-primary" onClick={handleSave}>
//           Save Draft
//         </button>
//         <button className="btn btn-success" onClick={handlePublish}>
//           Publish Now
//         </button>
//         {!isNew && post?.approvalStatus !== 'APPROVED' && (
//           <button className="btn btn-secondary" onClick={handleSubmitApproval}>
//             Submit for Approval
//           </button>
//         )}
//         <button className="btn btn-secondary" onClick={() => navigate('/posts')}>
//           Cancel
//         </button>
//       </div>
//     </div>
//   );
// }

// export default PostEditorPage;


import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const PLATFORMS = [
  { id: 'FACEBOOK', label: 'Facebook', icon: '📘' },
  { id: 'INSTAGRAM', label: 'Instagram', icon: '📸' },
  { id: 'YOUTUBE', label: 'YouTube', icon: '▶️' },
  { id: 'YOUTUBE_SHORTS', label: 'YouTube Shorts', icon: '📱' },
  { id: 'PINTEREST', label: 'Pinterest', icon: '📌' },
];

function PostEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = !id;
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1: Select platforms
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);

  // Step 2: Select companies
  const [companies, setCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);

  // Step 3: Social accounts (auto-loaded per company+platform)
  const [socialAccountsMap, setSocialAccountsMap] = useState({});

  // Media
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Content fields
  const [caption, setCaption] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [keywords, setKeywords] = useState('');
  const [link, setLink] = useState('');

  // Settings
  const [globalMediaMode, setGlobalMediaMode] = useState('INTELLIGENT');
  const [scheduledAt, setScheduledAt] = useState('');

  const isSuperUser = user?.systemRole === 'SUPERUSER';

  const needsTitle = selectedPlatforms.some((p) => ['YOUTUBE', 'YOUTUBE_SHORTS', 'PINTEREST'].includes(p));
  const needsDescription = selectedPlatforms.some((p) => ['YOUTUBE', 'YOUTUBE_SHORTS', 'PINTEREST'].includes(p));
  const needsKeywords = selectedPlatforms.some((p) => ['YOUTUBE'].includes(p));
  const needsLink = selectedPlatforms.some((p) => ['PINTEREST'].includes(p));
  const needsCaption = selectedPlatforms.some((p) => ['FACEBOOK', 'INSTAGRAM'].includes(p));
  const needsHashtags = selectedPlatforms.some((p) => ['INSTAGRAM'].includes(p));

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCompanies.length > 0 && selectedPlatforms.length > 0) {
      loadSocialAccounts();
    }
  }, [selectedCompanies, selectedPlatforms]);

  const loadInitialData = async () => {
    try {
      if (isSuperUser) {
        const res = await api.get('/companies');
        setCompanies(res.data.data);
      } else {
        const res = await api.get('/companies');
        const userCompanies = res.data.data;
        setCompanies(userCompanies);
        if (userCompanies.length === 1) {
          setSelectedCompanies([userCompanies[0].id]);
        }
      }

      if (id) {
        const postRes = await api.get(`/posts/${id}`);
        const post = postRes.data.data;
        const platforms = [...new Set(post.targets.map((t) => t.platform))];
        setSelectedPlatforms(platforms);
        setCaption(post.targets[0]?.caption || '');
        setTitle(post.targets[0]?.title || '');
        setDescription(post.targets[0]?.description || '');
        setHashtags(post.targets[0]?.hashtags || '');
        setKeywords(post.targets[0]?.keywords || '');
        setGlobalMediaMode(post.globalMediaMode || 'INTELLIGENT');
        if (post.scheduledAt) {
          setScheduledAt(new Date(post.scheduledAt).toISOString().slice(0, 16));
        }
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadSocialAccounts = async () => {
    try {
      const map = {};
      for (const companyId of selectedCompanies) {
        const res = await api.get(`/companies/${companyId}/social-accounts`);
        const connected = (res.data.data || []).filter((a) => a.status === 'CONNECTED');
        map[companyId] = connected;
      }
      setSocialAccountsMap(map);
    } catch (err) {
      console.error('Failed to load social accounts', err);
    }
  };

  const togglePlatform = (platformId) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((p) => p !== platformId) : [...prev, platformId]
    );
  };

  const toggleCompany = (companyId) => {
    setSelectedCompanies((prev) =>
      prev.includes(companyId) ? prev.filter((c) => c !== companyId) : [...prev, companyId]
    );
  };

  const handleFileSelect = (files) => {
    const newFiles = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      type: file.type,
    }));
    setMediaFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setMediaFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadMediaFiles = async (companyId, postId) => {
    const uploadedIds = [];
    for (const mediaFile of mediaFiles) {
      const formData = new FormData();
      formData.append('file', mediaFile.file);
      formData.append('postId', postId);
      formData.append('companyId', companyId);
      formData.append('options', JSON.stringify({ mode: globalMediaMode, platforms: selectedPlatforms }));

      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { companyId },
      });
      uploadedIds.push(res.data.data.id);
    }
    return uploadedIds;
  };

  const buildTargets = () => {
    const targets = [];

    for (const companyId of selectedCompanies) {
      const accounts = socialAccountsMap[companyId] || [];

      for (const platform of selectedPlatforms) {
        const account = accounts.find((a) => a.platform === platform);
        if (account) {
          const target = {
            platform,
            socialAccountId: account.id,
            caption: needsCaption ? caption : undefined,
            title: needsTitle ? title : undefined,
            description: needsDescription ? description : undefined,
            hashtags: needsHashtags ? hashtags : undefined,
            keywords: needsKeywords ? keywords : undefined,
          };

          if (platform === 'PINTEREST' && link) {
            target.platformMetadata = { link };
          }

          targets.push(target);
        }
      }
    }

    return targets;
  };

  const getMissingAccounts = () => {
    const missing = [];
    for (const companyId of selectedCompanies) {
      const accounts = socialAccountsMap[companyId] || [];
      const company = companies.find((c) => c.id === companyId);
      for (const platform of selectedPlatforms) {
        const account = accounts.find((a) => a.platform === platform);
        if (!account) {
          missing.push(`${company?.name || 'Unknown'} → ${platform}`);
        }
      }
    }
    return missing;
  };

  const handleSave = async (publish = false) => {
    setError('');
    setSuccess('');

    if (selectedPlatforms.length === 0) {
      return setError('Select at least one platform');
    }
    if (selectedCompanies.length === 0) {
      return setError('Select at least one company');
    }

    const missing = getMissingAccounts();
    if (missing.length > 0 && !publish) {
      setError(`No connected accounts for: ${missing.join(', ')}. You can still save as draft.`);
    }

    const targets = buildTargets();
    if (targets.length === 0) {
      return setError('No connected social accounts found for the selected platforms and companies. Connect accounts first.');
    }

    try {
      const postData = {
        targets,
        globalMediaMode,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        timezone: 'Asia/Kolkata',
      };

      let postId;
      if (isNew) {
        const res = await api.post('/posts', postData);
        postId = res.data.data.id;
        setSuccess('Post saved as draft!');
      } else {
        await api.patch(`/posts/${id}`, postData);
        postId = id;
        setSuccess('Post updated!');
      }

      if (mediaFiles.length > 0) {
        setUploading(true);
        for (const companyId of selectedCompanies) {
          await uploadMediaFiles(companyId, postId);
        }
        setUploading(false);
      }

      if (publish) {
        await api.post('/publications', { postId });
        setSuccess('Publication started! Check posts page for status.');
        setTimeout(() => navigate('/posts'), 1500);
      }
    } catch (err) {
      setUploading(false);
      setError(err.response?.data?.message || 'Failed to save post');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>{isNew ? 'Create Post' : 'Edit Post'}</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Step 1: Select Platforms */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>① Select Platforms</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {PLATFORMS.map((platform) => (
            <label
              key={platform.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                border: `2px solid ${selectedPlatforms.includes(platform.id) ? '#007bff' : '#ddd'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: selectedPlatforms.includes(platform.id) ? '#e7f1ff' : 'white',
                transition: 'all 0.2s',
                fontSize: '15px',
              }}
            >
              <input
                type="checkbox"
                checked={selectedPlatforms.includes(platform.id)}
                onChange={() => togglePlatform(platform.id)}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: '20px' }}>{platform.icon}</span>
              <span style={{ fontWeight: 500 }}>{platform.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Step 2: Select Companies */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>② Select Companies</h3>
        {companies.length === 0 ? (
          <div className="alert alert-info">
            No companies found. {isSuperUser ? 'Create a company first.' : 'Ask your admin to assign you to a company.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {companies.map((company) => (
              <label
                key={company.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  border: `2px solid ${selectedCompanies.includes(company.id) ? '#28a745' : '#ddd'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: selectedCompanies.includes(company.id) ? '#e8f5e9' : 'white',
                  transition: 'all 0.2s',
                  fontSize: '15px',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedCompanies.includes(company.id)}
                  onChange={() => toggleCompany(company.id)}
                  style={{ display: 'none' }}
                />
                <span style={{ fontWeight: 500 }}>🏢 {company.name}</span>
                {socialAccountsMap[company.id] && (
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    ({socialAccountsMap[company.id].filter((a) => selectedPlatforms.includes(a.platform)).length} connected)
                  </span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Step 3: Upload Media */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>③ Upload Media</h3>
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed #ccc',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: '#fafafa',
            transition: 'all 0.2s',
          }}
        >
          <p style={{ fontSize: '18px', marginBottom: '5px' }}>📁 Drop images/videos here or click to browse</p>
          <p style={{ fontSize: '13px', color: '#888' }}>Supports: JPG, PNG, GIF, WebP, MP4, WebM (max 100MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files.length > 0 && handleFileSelect(e.target.files)}
          />
        </div>

        {mediaFiles.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px' }}>
            {mediaFiles.map((media, index) => (
              <div key={index} style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                {media.type.startsWith('image/') ? (
                  <img src={media.preview} alt={media.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <video src={media.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                  style={{
                    position: 'absolute', top: '4px', right: '4px', background: 'rgba(220,53,69,0.9)', color: 'white',
                    border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ×
                </button>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 6px', fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {media.name}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="form-group" style={{ marginTop: '15px' }}>
          <label>Media Processing Mode</label>
          <select value={globalMediaMode} onChange={(e) => setGlobalMediaMode(e.target.value)}>
            <option value="INTELLIGENT">Intelligent (Focal Point Crop)</option>
            <option value="RESIZE_PAD">Resize & Pad</option>
          </select>
        </div>
      </div>

      {/* Step 4: Content */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>④ Content</h3>

        {needsCaption && (
          <div className="form-group">
            <label>Caption (Facebook, Instagram)</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your caption here..."
              rows={4}
            />
          </div>
        )}

        {needsHashtags && (
          <div className="form-group">
            <label>Hashtags (Instagram)</label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#marketing #social #growth"
            />
          </div>
        )}

        {needsTitle && (
          <div className="form-group">
            <label>Title (YouTube, Pinterest)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title..."
            />
          </div>
        )}

        {needsDescription && (
          <div className="form-group">
            <label>Description (YouTube, Pinterest)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a description..."
              rows={3}
            />
          </div>
        )}

        {needsKeywords && (
          <div className="form-group">
            <label>Keywords (YouTube)</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>
        )}

        {needsLink && (
          <div className="form-group">
            <label>Link (Pinterest)</label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        )}

        {selectedPlatforms.length === 0 && (
          <div className="alert alert-info">Select platforms above to see relevant content fields.</div>
        )}
      </div>

      {/* Step 5: Schedule */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>⑤ Schedule (optional)</h3>
        <div className="form-group">
          <label>Schedule Date & Time (IST)</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
          <small style={{ color: '#666' }}>Leave empty to publish immediately. Time is in IST (Asia/Kolkata).</small>
        </div>
      </div>

      {/* Preview: What will be published */}
      {selectedPlatforms.length > 0 && selectedCompanies.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>📋 Publishing Summary</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Platform</th>
                <th>Account</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {selectedCompanies.map((companyId) => {
                const company = companies.find((c) => c.id === companyId);
                const accounts = socialAccountsMap[companyId] || [];
                return selectedPlatforms.map((platform) => {
                  const account = accounts.find((a) => a.platform === platform);
                  return (
                    <tr key={`${companyId}-${platform}`}>
                      <td>{company?.name || 'Unknown'}</td>
                      <td>{PLATFORMS.find((p) => p.id === platform)?.icon} {PLATFORMS.find((p) => p.id === platform)?.label}</td>
                      <td>{account?.accountName || '-'}</td>
                      <td>
                        {account ? (
                          <span className="badge badge-success">Ready</span>
                        ) : (
                          <span className="badge badge-danger">Not Connected</span>
                        )}
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => handleSave(false)} disabled={uploading}>
          {uploading ? 'Uploading media...' : 'Save Draft'}
        </button>
        <button className="btn btn-success" onClick={() => handleSave(true)} disabled={uploading}>
          {uploading ? 'Uploading media...' : 'Publish Now'}
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/posts')}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default PostEditorPage;
