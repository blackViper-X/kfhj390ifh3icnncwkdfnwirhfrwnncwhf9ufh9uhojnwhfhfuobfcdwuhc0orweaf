import { useState, useEffect } from 'react';
import api from '../services/api';

function CommentsPage() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    try {
      const res = await api.get('/comments');
      setComments(res.data.data);
    } catch (err) {
      console.error('Failed to load comments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (commentId) => {
    const message = replyText[commentId];
    if (!message) return;

    try {
      await api.post(`/comments/${commentId}/reply`, { message });
      setReplyText({ ...replyText, [commentId]: '' });
      loadComments();
      alert('Reply sent');
    } catch (err) {
      alert('Failed to send reply');
    }
  };

  if (loading) return <div className="loading">Loading comments...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Comments</h1>

      {comments.length === 0 ? (
        <div className="card">
          <p>No comments yet. Comments will appear here when synchronized from connected social accounts.</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {comments.map((comment) => (
            <div key={comment.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span className="badge badge-info">{comment.socialAccount?.platform}</span>
                <span style={{ color: '#666', fontSize: '12px' }}>
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{comment.authorName || 'Anonymous'}</p>
              <p style={{ marginBottom: '10px' }}>{comment.content}</p>

              {comment.replyStatus === 'REPLIED' ? (
                <div className="alert alert-success" style={{ marginBottom: '10px' }}>
                  <strong>Reply:</strong> {comment.replyContent}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input
                    type="text"
                    placeholder="Write a reply..."
                    value={replyText[comment.id] || ''}
                    onChange={(e) => setReplyText({ ...replyText, [comment.id]: e.target.value })}
                    style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <button className="btn btn-primary" onClick={() => handleReply(comment.id)}>
                    Reply
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentsPage;
