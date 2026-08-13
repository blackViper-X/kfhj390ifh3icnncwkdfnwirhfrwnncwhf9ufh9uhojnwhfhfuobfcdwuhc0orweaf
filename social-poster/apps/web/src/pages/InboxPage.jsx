import { useState, useEffect } from 'react';
import api from '../services/api';

function InboxPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await api.get('/conversations');
      setConversations(res.data.data);
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const res = await api.get(`/conversations/${conversationId}/messages`);
      setMessages(res.data.data);
      setSelectedConversation(conversationId);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage || !selectedConversation) return;

    try {
      await api.post(`/conversations/${selectedConversation}/messages`, {
        content: newMessage,
      });
      setNewMessage('');
      loadMessages(selectedConversation);
    } catch (err) {
      alert('Failed to send message');
    }
  };

  if (loading) return <div className="loading">Loading inbox...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Inbox</h1>

      <div className="grid grid-2" style={{ gridTemplateColumns: '1fr 2fr' }}>
        <div className="card" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <h3 style={{ marginBottom: '15px' }}>Conversations</h3>
          {conversations.length === 0 ? (
            <p style={{ color: '#666' }}>No conversations yet.</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => loadMessages(conv.id)}
                style={{
                  padding: '10px',
                  borderBottom: '1px solid #ddd',
                  cursor: 'pointer',
                  backgroundColor: selectedConversation === conv.id ? '#f0f0f0' : 'transparent',
                }}
              >
                <p style={{ fontWeight: 'bold' }}>{conv.participantName || 'Unknown'}</p>
                <p style={{ fontSize: '12px', color: '#666' }}>{conv.platform}</p>
                {conv.unreadCount > 0 && (
                  <span className="badge badge-danger">{conv.unreadCount}</span>
                )}
              </div>
            ))
          )}
        </div>

        <div className="card">
          {selectedConversation ? (
            <div>
              <h3 style={{ marginBottom: '15px' }}>Messages</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '15px' }}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      padding: '10px',
                      marginBottom: '10px',
                      backgroundColor: msg.isFromPage ? '#e3f2fd' : '#f5f5f5',
                      borderRadius: '4px',
                    }}
                  >
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                      {msg.sender} - {new Date(msg.timestamp).toLocaleString()}
                    </p>
                    <p>{msg.content}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button className="btn btn-primary" onClick={handleSendMessage}>
                  Send
                </button>
              </div>
            </div>
          ) : (
            <p style={{ color: '#666' }}>Select a conversation to view messages</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default InboxPage;
