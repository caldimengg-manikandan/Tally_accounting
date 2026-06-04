import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Send, Sparkles, Bot, User, Loader, Lightbulb, ArrowRight, X
} from 'lucide-react';
import { mockAIResponses, AI_SUGGESTION_CHIPS } from '../../services/mockData';

const AI_API_URL = import.meta.env.VITE_AI_API_URL || null;

const matchMockKey = (msg) => {
  const lower = msg.toLowerCase().trim();
  for (const key of Object.keys(mockAIResponses)) {
    if (key === 'default') continue;
    const keyWords = key.split(' ').filter(w => w.length > 3);
    const matchCount = keyWords.filter(w => lower.includes(w)).length;
    if (matchCount >= Math.ceil(keyWords.length * 0.6)) return key;
  }
  return 'default';
};

const ChatBubble = ({ msg, onActionClick }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-slide-up`}>
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md
        ${isUser ? 'bg-[#1A73E8]' : 'bg-gradient-to-br from-blue-600 to-blue-700'}`}>
        {isUser ? <User size={16} color="#fff" /> : <Bot size={16} color="#fff" />}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-5 py-4 rounded-2xl text-[13px] leading-relaxed shadow-sm border
          ${isUser
            ? 'bg-[#1A73E8] border-[#1A73E8] text-white rounded-tr-sm'
            : 'bg-white border-slate-100 text-slate-800 rounded-tl-sm'
          }`}>
          {msg.content.split('\n').map((line, i) => {
            const parts = line.split(/\*\*(.*?)\*\*/g);
            return (
              <div key={i} className={line.startsWith('|') ? 'font-mono text-[11.5px] overflow-x-auto whitespace-pre my-1' : 'mb-1 last:mb-0'}>
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
          <div className="flex flex-wrap gap-2 mt-1.5">
            {msg.actions.map((action) => (
              <button
                key={action}
                onClick={() => onActionClick(action)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-[11.5px] font-bold rounded-full hover:bg-blue-100 transition-colors"
              >
                <ArrowRight size={11} />
                {action}
              </button>
            ))}
          </div>
        )}

        <span className="text-[10px] text-slate-400 font-semibold px-1">
          {new Date(msg.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

const AIAssistantView = () => {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const role = (user.role || 'ADMIN').toLowerCase();

  const [messages, setMessages] = useState([
    {
      id: 0,
      role: 'assistant',
      content: "👋 Welcome to your **Dedicated Tally AI Workspace**.\n\nI can help you build custom reports, create items, record invoices, analyze ledger groups, and guide you through Tally-to-Zoho workflows. What would you like to achieve today?",
      actions: [],
      ts: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChips, setShowChips] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { inputRef.current?.focus(); }, []);

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
        const res = await fetch(AI_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, role }),
        });
        responseData = await res.json();
      } else {
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));
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
  }, [input, loading, role]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-[#f8fafc] font-sans overflow-hidden">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1A73E8] to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/10">
            <Sparkles size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 tracking-tight leading-none">AI Command Center</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Intelligent Copilot for Accounting Workflows</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Role: {role}
          </span>
        </div>
      </header>

      {/* Main chat workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side: Chat Workspace */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#fdfdfe]/70 border-r border-slate-100">
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            {messages.map(msg => (
              <ChatBubble key={msg.id} msg={msg} onActionClick={sendMessage} />
            ))}

            {loading && (
              <div className="flex gap-4 animate-slide-up">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shrink-0">
                  <Bot size={16} color="#fff" />
                </div>
                <div className="px-5 py-4 bg-white rounded-2xl rounded-tl-sm border border-slate-100 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input bar */}
          <div className="px-8 py-5 bg-white border-t border-slate-200 shrink-0">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus-within:border-blue-400 focus-within:bg-white transition-all shadow-sm">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask Tally AI to draft vouchers, list transactions, find tax ratios..."
                disabled={loading}
                className="flex-1 bg-transparent text-[13.5px] text-slate-800 placeholder-slate-400 outline-none"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="px-4 py-2 rounded-xl bg-[#1A73E8] text-white text-[12px] font-bold flex items-center gap-1.5 hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
                Send
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2.5">
              {AI_API_URL ? 'Securely connected to cloud LLM engine' : 'Sandbox environment active. Simulating mock responses.'}
            </p>
          </div>
        </div>

        {/* Right Side: Suggestions & Prompt Ideas */}
        <div className="hidden lg:block w-[300px] shrink-0 bg-white p-6 space-y-6 overflow-y-auto">
          <div className="flex items-center gap-2">
            <Lightbulb size={16} className="text-amber-500" />
            <h3 className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">Suggested Prompts</h3>
          </div>
          
          <div className="space-y-2.5">
            {AI_SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                className="w-full text-left p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[12px] text-slate-700 font-semibold hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-700 transition-all leading-normal"
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-3">
            <h4 className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest">Capabilities</h4>
            <ul className="text-[11.5px] text-slate-500 space-y-2 leading-relaxed list-disc list-inside">
              <li>Formulate and record transactions</li>
              <li>Filter receivables/payables aging</li>
              <li>Synthesize tax summaries</li>
              <li>Resolve ledger account groups</li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AIAssistantView;
