import React, { useState, useEffect } from 'react';
import { chatAPI } from '../api';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { History, Search, MessageSquare, Calendar, Trash2, Download, ArrowRight, Bot, User } from 'lucide-react';

export default function ChatHistoryPage({ setActivePage }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await chatAPI.getConversations();
      if (res.data.status === 'success') {
        const list = res.data.conversations || [];
        setConversations(list);
        if (list.length > 0) {
          selectConversation(list[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conv) => {
    setSelectedConv(conv);
    try {
      const res = await chatAPI.getMessages(conv.id);
      if (res.data.status === 'success') {
        setMessages(res.data.messages || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const exportChat = () => {
    if (!selectedConv || messages.length === 0) return;
    const jsonStr = JSON.stringify({ conversation: selectedConv, messages }, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neurochat_${selectedConv.title.replace(/\s+/g, '_')}.json`;
    a.click();
  };

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center space-x-2">
            <History className="w-6 h-6 text-cyan-400" />
            <span>Conversation Archives & History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Review, search, and export past NLP chat sessions</p>
        </div>

        {selectedConv && (
          <button
            onClick={exportChat}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-navy-800 hover:bg-navy-750 border border-slate-700 text-xs text-slate-200 transition-all"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export Session (JSON)</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Session List */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-navy-850 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No sessions found</p>
            ) : (
              filtered.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`p-3 rounded-xl cursor-pointer text-xs transition-all border ${
                      isSelected
                        ? 'bg-navy-800/90 border-cyan-500/40 text-cyan-300'
                        : 'border-transparent text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold truncate">{conv.title}</div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center space-x-1 font-mono">
                      <Calendar className="w-3 h-3" />
                      <span>{conv.created_at ? new Date(conv.created_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Message Viewer */}
        <div className="md:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col h-[650px]">
          {selectedConv ? (
            <>
              <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">{selectedConv.title}</h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    ID: {selectedConv.id} &bull; Messages: {messages.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-500">
                    No messages recorded in this conversation session.
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-xl text-xs ${
                        m.sender === 'user'
                          ? 'bg-navy-800/90 ml-8 border border-slate-700/60 text-slate-200'
                          : 'glass-panel mr-8 border border-slate-800 text-cyan-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 text-[10px] font-mono text-slate-400">
                        <span className="font-bold text-cyan-400">
                          {m.sender === 'user' ? 'USER' : 'BOT'}
                        </span>
                        <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                      </div>
                      {m.sender === 'user' ? (
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      ) : (
                        <MarkdownRenderer content={m.content} />
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Select a conversation to view historical transcript
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
