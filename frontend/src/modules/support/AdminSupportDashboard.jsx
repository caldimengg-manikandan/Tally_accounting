import React, { useState, useEffect } from 'react';
import api from '../../api';

const AdminSupportDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await api.get('/support/admin');
      if (response.data.success) {
        setTickets(response.data.tickets);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (ticketId) => {
    try {
      await api.put(`/support/admin/${ticketId}`, { 
        adminReply: replyText[ticketId],
        status: 'Resolved'
      });
      alert('Reply sent successfully!');
      fetchTickets();
    } catch (err) {
      console.error('Reply error:', err);
      alert('Failed to send reply');
    }
  };

  if (loading) return <div className="p-8">Loading Tickets...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Support Dashboard</h1>
      <div className="space-y-6">
        {tickets.length === 0 ? <p>No support tickets found.</p> : tickets.map(ticket => (
          <div key={ticket.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{ticket.subject}</h3>
                <p className="text-sm text-gray-500">From: {ticket.Creator?.name} ({ticket.Company?.name})</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${ticket.status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {ticket.status}
              </span>
            </div>
            
            <div className="bg-gray-50 p-4 rounded mb-4 text-gray-700">
              {ticket.message}
            </div>
            
            <p className="text-xs text-gray-400 mb-4">Context URL: {ticket.currentPageUrl}</p>

            {ticket.adminReply ? (
              <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4">
                <strong className="block text-indigo-900 mb-1">Your Reply:</strong>
                <p className="text-indigo-800">{ticket.adminReply}</p>
              </div>
            ) : (
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Type your reply here..." 
                  className="flex-1 border border-gray-300 rounded p-2"
                  value={replyText[ticket.id] || ''}
                  onChange={(e) => setReplyText({...replyText, [ticket.id]: e.target.value})}
                />
                <button 
                  onClick={() => handleReply(ticket.id)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  Send Reply & Resolve
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSupportDashboard;
