import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare, X, Send, Sparkles, ChevronDown,
  Bot, User, Loader, Lightbulb, ArrowRight
} from 'lucide-react';
import { mockAIResponses, AI_SUGGESTION_CHIPS } from '../services/mockData';

const AI_API_URL = import.meta.env.VITE_AI_API_URL || null;

// ── Utility: fuzzy match user message to mock key ────────────────
const matchMockKey = (msg) => {
  const lower = msg.toLowerCase().trim();
  for (const key of Object.keys(mockAIResponses)) {
    if (key === 'default') continue;
    // Loose match: every word in key appears in user message
    const keyWords = key.split(' ').filter(w => w.length > 3);
    const matchCount = keyWords.filter(w => lower.includes(w)).length;
    if (matchCount >= Math.ceil(keyWords.length * 0.6)) return key;
  }
  return 'default';
};

// ── Single chat bubble ───────────────────────────────────────────
const ChatBubble = ({ msg, onActionClick }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-slide-up`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5
        ${isUser ? 'bg-blue-600' : 'bg-gradient-to-br from-violet-600 to-blue-600'}`}>
        {isUser ? <User size={14} color="#fff" /> : <Bot size={14} color="#fff" />}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col gap-2 max-w-[82%]`}>
        <div className={`px-3.5 py-3 rounded-2xl text-[12.5px] leading-relaxed
          ${isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm shadow-sm'
          }`}>
          {/* Render markdown-lite: bold with ** */}
          {msg.content.split('\n').map((line, i) => {
            const parts = line.split(/\*\*(.*?)\*\*/g);
            return (
              <div key={i} className={line.startsWith('|') ? 'font-mono text-[11px]' : ''}>
                {parts.map((part, j) =>
                  j % 2 === 1
                    ? <strong key={j} className="font-bold">{part}</strong>
                    : <span key={j}>{part}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Action chips */}
        {msg.actions && msg.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {msg.actions.map((action) => (
              <button
                key={action}
                onClick={() => onActionClick(action)}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold rounded-full hover:bg-blue-100 transition-colors"
              >
                <ArrowRight size={10} />
                {action}
              </button>
            ))}
          </div>
        )}

        <span className="text-[10px] text-slate-400 font-medium px-1">
          {new Date(msg.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

// ── Main AI Assistant ────────────────────────────────────────────
const AIAssistant = ({ role = 'admin' }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 0,
      role: 'assistant',
      content: "👋 Hi! I'm your **Tally AI Assistant**.\n\nI can help you create invoices, file GST returns, generate reports, and much more. Try one of the suggestions below!",
      actions: [],
      ts: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    setInput('');
    setShowChips(false);

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: trimmed,
      ts: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      let responseData;

      if (AI_API_URL) {
        // Real API call
        const res = await fetch(AI_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, role }),
        });
        responseData = await res.json();
      } else {
        // Simulate delay + mock response
        await new Promise(r => setTimeout(r, 900 + Math.random() * 600));
        const key = matchMockKey(trimmed);
        responseData = mockAIResponses[key];
      }

      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: responseData.text || responseData.message || 'I could not process that request.',
        actions: responseData.actions || [],
        ts: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      if (!open) setUnread(n => n + 1);

    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: '⚠️ Sorry, I encountered an error. Please try again.',
        actions: [],
        ts: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, open, role]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── EXPANDED PANEL ─────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-[200] w-[360px] h-[520px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-zoom-in"
          style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.18)' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles size={16} color="#fff" />
              </div>
              <div>
                <p className="text-white text-[13px] font-bold leading-none">Tally AI Assistant</p>
                <p className="text-blue-200 text-[10px] font-medium mt-0.5">Powered by LLM · Tally Workflows</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <ChevronDown size={14} color="#fff" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={14} color="#fff" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4 bg-slate-50/50">
            {messages.map(msg => (
              <ChatBubble key={msg.id} msg={msg} onActionClick={sendMessage} />
            ))}

            {loading && (
              <div className="flex gap-2.5 animate-slide-up">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shrink-0">
                  <Bot size={14} color="#fff" />
                </div>
                <div className="px-4 py-3 bg-white rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Suggestion chips */}
            {showChips && messages.length === 1 && (
              <div className="mt-3">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Lightbulb size={12} className="text-amber-500" />
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Try asking...</span>
                </div>
                <div className="space-y-1.5">
                  {AI_SUGGESTION_CHIPS.map(chip => (
                    <button
                      key={chip}
                      onClick={() => sendMessage(chip)}
                      className="w-full text-left px-3 py-2 rounded-xl bg-white border border-slate-200 text-[12px] text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all font-medium"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3.5 py-3 border-t border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 focus-within:border-blue-400 focus-within:bg-white transition-all">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type a command or question..."
                disabled={loading}
                className="flex-1 bg-transparent text-[13px] text-slate-800 placeholder-slate-400 outline-none"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading
                  ? <Loader size={13} color="#fff" className="animate-spin" />
                  : <Send size={13} color="#fff" />
                }
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-1.5">
              {AI_API_URL ? 'Connected to AI backend' : 'Demo mode — mock responses active'}
            </p>
          </div>
        </div>
      )}

      {/* ── COLLAPSED FAB ──────────────────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-[200] flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-200 group"
        style={{ boxShadow: '0 8px 30px rgba(99,102,241,0.45)' }}
      >
        <div className="relative">
          <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unread}
            </span>
          )}
        </div>
        <span className="text-[12px] font-bold tracking-wide hidden sm:block">Need Assistance?</span>
        <Sparkles size={14} className="opacity-80" />
      </button>
    </>
  );
};

export default AIAssistant;
