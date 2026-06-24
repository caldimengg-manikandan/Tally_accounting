import React, { useState } from 'react';
import api from '../api';

const SupportHelpButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      await api.post('/support', {
        subject,
        message,
        currentPageUrl: window.location.href
      });
      setStatus('success');
      setTimeout(() => {
        setIsOpen(false);
        setSubject('');
        setMessage('');
        setStatus('idle');
      }, 2000);
    } catch (err) {
      console.error('Support ticket error:', err);
      setStatus('error');
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white rounded-full p-4 shadow-xl hover:bg-indigo-700 transition-colors z-50 flex items-center justify-center"
        aria-label="Help & Support"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Need Help?</h2>
            
            {status === 'success' ? (
              <div className="bg-green-100 text-green-700 p-4 rounded text-center">
                Ticket submitted successfully! We will get back to you soon.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <input 
                    type="text" 
                    required 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea 
                    required 
                    rows="4"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="Describe your issue..."
                  ></textarea>
                </div>
                <div className="text-xs text-gray-500">
                  System Context: {window.location.pathname} will be attached.
                </div>
                {status === 'error' && <p className="text-red-500 text-sm">Failed to submit ticket. Please try again.</p>}
                <button 
                  type="submit" 
                  disabled={status === 'submitting'}
                  className="w-full bg-indigo-600 text-white p-2 rounded font-medium hover:bg-indigo-700"
                >
                  {status === 'submitting' ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SupportHelpButton;
