import React, { useState, useEffect } from 'react';
import { HelpCircle, Send, MessageCircle, AlertCircle, Loader2, CheckCircle, Clock } from 'lucide-react';
import { supportAPI } from '../../services/api';
import useNotificationStore from '../../store/notificationStore';
import { getUser } from '../../stores/authStore';

const SupportCenter = ({ companyId }) => {
  const { addNotification } = useNotificationStore();
  const [isAdminView, setIsAdminView] = useState(false);
  const [userRole, setUserRole] = useState('VIEWER');
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Submit form state
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '' });
  
  // Reply form state
  const [activeReplyTicketId, setActiveReplyTicketId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('In Progress');

  useEffect(() => {
    const activeUser = getUser();
    if (activeUser && activeUser.role) {
      setUserRole(activeUser.role);
    } else {
      const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          setUserRole(userObj.role || 'VIEWER');
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [companyId, isAdminView]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      if (isAdminView) {
        const res = await supportAPI.getAllTicketsAdmin();
        setTickets(res.data?.tickets || []);
      } else {
        const res = await supportAPI.getCompanyTickets();
        setTickets(res.data?.tickets || []);
      }
    } catch (err) {
      console.error(err);
      addNotification('Failed to load tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) {
      addNotification('Please enter subject and message', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await supportAPI.createTicket({
        subject: ticketForm.subject,
        message: ticketForm.message,
        currentPageUrl: window.location.href
      });
      addNotification('Support ticket submitted successfully! Our support agents will contact you shortly.', 'success');
      setTicketForm({ subject: '', message: '' });
      fetchTickets();
    } catch (err) {
      console.error(err);
      addNotification(err.response?.data?.error || 'Failed to submit support ticket', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (ticketId) => {
    if (!replyText.trim()) {
      addNotification('Please enter a response reply text', 'warning');
      return;
    }
    try {
      await supportAPI.replyToTicket(ticketId, {
        adminReply: replyText,
        status: replyStatus
      });
      addNotification('Reply sent successfully and status updated!', 'success');
      setReplyText('');
      setActiveReplyTicketId(null);
      fetchTickets();
    } catch (err) {
      console.error(err);
      addNotification(err.response?.data?.error || 'Failed to send reply', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
        <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
        <span className="text-xs font-bold uppercase tracking-widest">Loading Support Desk...</span>
      </div>
    );
  }

  return (
    <div className="w-full box-border">
      <header className="mb-8 border-b border-slate-100 pb-5 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <HelpCircle className="text-blue-600" size={24} />
            <h1 className="text-xl font-bold text-slate-800">Support Center</h1>
          </div>
          <p className="text-[12px] text-slate-400 mt-1">
            Submit bug reports, feature requests, or billing inquiries to our technical support staff.
          </p>
        </div>

        {/* Admin Toggle button */}
        {(userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') && (
          <button
            onClick={() => setIsAdminView(!isAdminView)}
            className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-100 transition-colors"
          >
            {isAdminView ? 'Switch to Customer View' : 'Switch to Admin View'}
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket list column */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800">
            {isAdminView ? 'All Customer Support Tickets' : 'Your Ticket Statuses'}
          </h2>

          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs">
                No support tickets found.
              </div>
            ) : (
              tickets.map(ticket => (
                <div key={ticket.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{ticket.subject}</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider
                          ${ticket.status === 'Resolved' || ticket.status === 'Closed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ticket.status === 'In Progress'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Ticket ID: <span className="font-mono">{ticket.id.slice(0, 8)}</span> • Submitted {new Date(ticket.createdAt).toLocaleString()}
                        {isAdminView && (
                          <span className="font-sans font-semibold text-slate-500">
                            {' '}by {ticket.Creator?.name} ({ticket.Company?.name})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-[12px] text-slate-600 bg-slate-50 p-3 rounded-lg leading-relaxed font-sans">
                    {ticket.message}
                  </p>

                  {/* Admin Reply view bubble */}
                  {ticket.adminReply && (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-1">
                      <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                        <MessageCircle size={12} /> Tech Support Agent Response
                      </div>
                      <p className="text-[12px] text-blue-900/80 leading-relaxed font-medium">
                        {ticket.adminReply}
                      </p>
                    </div>
                  )}

                  {/* Admin Reply Action field */}
                  {isAdminView && (
                    <div>
                      {activeReplyTicketId === ticket.id ? (
                        <div className="space-y-3 pt-2">
                          <textarea
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder="Type agent reply..."
                            rows="2"
                            className="w-full border border-slate-200 rounded-lg p-2.5 text-[12px] outline-none focus:border-blue-500"
                          />
                          <div className="flex items-center justify-between">
                            <select
                              value={replyStatus}
                              onChange={e => setReplyStatus(e.target.value)}
                              className="h-8 border border-slate-200 rounded px-2 text-[12px] text-slate-800 bg-white"
                            >
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Closed">Closed</option>
                            </select>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setActiveReplyTicketId(null)}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-500 hover:bg-slate-50 uppercase tracking-wider font-bold"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => submitReply(ticket.id)}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs uppercase tracking-wider font-bold"
                              >
                                Send Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveReplyTicketId(ticket.id);
                            setReplyText(ticket.adminReply || '');
                            setReplyStatus(ticket.status);
                          }}
                          className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-wider hover:bg-slate-50"
                        >
                          Reply / Update Status
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Submit Ticket Side form */}
        {!isAdminView && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <Send size={16} className="text-blue-500" /> New Support Ticket
            </h2>

            <form onSubmit={handleTicketSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subject Subject *</label>
                <input
                  type="text"
                  value={ticketForm.subject}
                  onChange={e => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g. API Sync issue"
                  className="w-full h-10 border border-slate-200 rounded-lg px-3 text-[13px] text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Detailed Message *</label>
                <textarea
                  value={ticketForm.message}
                  onChange={e => setTicketForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Explain details of the bug or inquiry"
                  rows="4"
                  className="w-full border border-slate-200 rounded-lg p-3 text-[13px] text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send Ticket
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportCenter;
