import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatAPI, nlpAPI } from '../api';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { 
  Send, Plus, Trash2, Edit2, MessageSquare, Bot, User, Sparkles, 
  Cpu, Copy, Check, ThumbsUp, ThumbsDown, RefreshCw, AlertCircle, 
  Terminal, Search, ChevronRight, CornerDownLeft, Globe2, Tag, Brain 
} from 'lucide-react';

export default function ChatDashboard() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  
  // Controls
  const [chatMode, setChatMode] = useState('auto'); // 'auto', 'ml_only', 'genai_only'
  const [modelOverride, setModelOverride] = useState('linear_svm');
  const [searchFilter, setSearchFilter] = useState('');
  const [editingConvId, setEditingConvId] = useState(null);
  const [newTitleInput, setNewTitleInput] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadConversations(true);
  }, []);

  const loadConversations = async (autoSelectFirst = false) => {
    try {
      const res = await chatAPI.getConversations();
      if (res.data?.status === 'success') {
        const convList = res.data.conversations || [];
        setConversations(convList);
        if (autoSelectFirst && convList.length > 0) {
          const firstId = convList[0].id;
          setActiveConvId(firstId);
          loadMessages(firstId);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const handleSelectConversation = (convId) => {
    if (convId === activeConvId) return;
    setActiveConvId(convId);
    loadMessages(convId);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadMessages = async (convId) => {
    setChatLoading(true);
    try {
      const res = await chatAPI.getMessages(convId);
      if (res.data.status === 'success') {
        setMessages(res.data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleCreateNewConversation = async () => {
    try {
      const res = await chatAPI.createConversation('New Conversation');
      if (res.data.status === 'success') {
        const newConv = res.data.conversation;
        setConversations([newConv, ...conversations]);
        setActiveConvId(newConv.id);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const handleSendMessage = async (textToSend = null) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || loading) return;

    setInputPrompt('');
    setLoading(true);

    // Optimistic temporary message
    const tempUserMsg = {
      id: 'temp-' + Date.now(),
      sender: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const payload = {
        conversation_id: activeConvId,
        content: text,
        mode: chatMode,
        model_override: modelOverride
      };
      const res = await chatAPI.sendMessage(payload);
      if (res.data.status === 'success') {
        const { bot_message, conversation_id } = res.data;
        if (!activeConvId) {
          setActiveConvId(conversation_id);
          loadConversations();
        }
        setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), res.data.user_message, bot_message]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          sender: 'bot',
          content: 'Error: Could not reach the server or processing failed. Please check network/credentials.',
          is_error: true,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = async (msgId, rating) => {
    try {
      await chatAPI.submitFeedback(msgId, rating);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, feedback: rating } : m))
      );
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  const handleRename = async (convId) => {
    if (!newTitleInput.trim()) return;
    try {
      await chatAPI.renameConversation(convId, newTitleInput.trim());
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, title: newTitleInput.trim() } : c))
      );
      setEditingConvId(null);
    } catch (err) {
      console.error('Rename error:', err);
    }
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await chatAPI.deleteConversation(convId);
      const remaining = conversations.filter((c) => c.id !== convId);
      setConversations(remaining);
      if (activeConvId === convId) {
        setActiveConvId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleClearChat = async () => {
    if (!activeConvId || !window.confirm('Clear all messages in this conversation?')) return;
    try {
      await chatAPI.clearConversation(activeConvId);
      setMessages([]);
    } catch (err) {
      console.error('Clear chat error:', err);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      
      {/* Sidebar: Conversation Sessions */}
      <aside className="w-72 sm:w-80 border-r border-slate-800/80 bg-navy-900/95 flex flex-col flex-shrink-0">
        
        {/* Top actions */}
        <div className="p-3 border-b border-slate-800 space-y-2">
          <button
            onClick={handleCreateNewConversation}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/30 text-cyan-300 font-semibold text-xs flex items-center justify-center space-x-2 transition-all glow-cyan"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>New Conversation</span>
          </button>

          {/* Search sessions */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search chat history..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-navy-850 border border-slate-700/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = activeConvId === conv.id;
              const isEditing = editingConvId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-navy-800/90 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-950/40'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                    
                    {isEditing ? (
                      <input
                        type="text"
                        autoFocus
                        value={newTitleInput}
                        onChange={(e) => setNewTitleInput(e.target.value)}
                        onBlur={() => handleRename(conv.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename(conv.id)}
                        className="bg-navy-900 border border-cyan-500 rounded px-1.5 py-0.5 text-xs text-white w-full outline-none"
                      />
                    ) : (
                      <span className="truncate font-medium">{conv.title}</span>
                    )}
                  </div>

                  {/* Actions on hover */}
                  {!isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 pl-1 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingConvId(conv.id);
                          setNewTitleInput(conv.title);
                        }}
                        className="p-1 hover:text-cyan-300"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="p-1 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Status */}
        <div className="p-3 border-t border-slate-800 bg-navy-950/60 text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <span>Active: {conversations.length} sessions</span>
          <span className="text-emerald-400 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>MongoDB Atlas</span>
          </span>
        </div>
      </aside>

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col bg-navy-900/60 relative overflow-hidden">
        
        {/* Chat Control Header */}
        <div className="px-4 py-3 border-b border-slate-800 glass-panel flex flex-wrap items-center justify-between gap-3 bg-navy-900/80">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 glow-cyan" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              NeuroChat Intelligent Workspace
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
              v2.0
            </span>
          </div>

          {/* Model & Mode Selector Controls */}
          <div className="flex items-center space-x-2 text-xs">
            {/* Routing Mode */}
            <div className="flex items-center space-x-1 bg-navy-850 p-1 rounded-lg border border-slate-700/60">
              {[
                { id: 'auto', label: 'Hybrid Auto' },
                { id: 'ml_only', label: 'ML Only' },
                { id: 'genai_only', label: 'GenAI Only' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setChatMode(m.id)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                    chatMode === m.id
                      ? 'bg-cyan-500 text-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Model Selector */}
            <select
              value={modelOverride}
              onChange={(e) => setModelOverride(e.target.value)}
              className="bg-navy-850 border border-slate-700/80 text-cyan-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-400 font-mono"
            >
              <option value="linear_svm">Linear SVM (92.4% Acc)</option>
              <option value="logistic_regression">Logistic Regression (89.3%)</option>
              <option value="naive_bayes">Naive Bayes (88.7%)</option>
            </select>

            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                title="Clear current chat"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {chatLoading ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin text-cyan-400 mr-2" />
              Loading conversation history...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 glow-cyan">
                <Brain className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">How can I assist your AI/ML research today?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ask conceptual questions, explore algorithms, evaluate bank marketing, or converse naturally.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 w-full pt-2">
                {[
                  "What is TF-IDF and how does it work?",
                  "Explain supervised vs unsupervised learning",
                  "How to prevent overfitting in deep neural networks?",
                  "Can you check my account balance?"
                ].map((promptText, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(promptText)}
                    className="p-2.5 rounded-xl bg-navy-850 hover:bg-navy-800 border border-slate-700/60 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-cyan-300 text-left transition-all flex items-center justify-between font-mono"
                  >
                    <span>{promptText}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-br-none shadow-md shadow-cyan-950/50'
                        : 'glass-panel border border-slate-700/70 text-slate-100 rounded-bl-none shadow-lg shadow-black/30'
                    }`}
                  >
                    {/* Header info for Bot */}
                    {!isUser && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-700/50 font-mono text-[10px]">
                        <div className="flex items-center space-x-1.5">
                          <Bot className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="font-bold text-cyan-300">
                            {msg.provider || (msg.is_gen_ai ? 'Groq Cloud' : 'ML Classifier')}
                          </span>
                        </div>

                        {/* Model & Confidence Tags */}
                        <div className="flex items-center space-x-1.5 text-slate-400">
                          {msg.confidence !== undefined && (
                            <span className={`px-1.5 py-0.2 rounded border ${
                              msg.confidence > 0.45 
                                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/50' 
                                : 'bg-amber-950/70 text-amber-300 border-amber-800/50'
                            }`}>
                              Conf: {(msg.confidence * 100).toFixed(1)}%
                            </span>
                          )}
                          {msg.intent && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                              Intent: {msg.intent}
                            </span>
                          )}
                          {msg.latency_ms && (
                            <span className="text-slate-500">
                              {msg.latency_ms}ms
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Message Body */}
                    {isUser ? (
                      <div className="whitespace-pre-wrap font-sans text-sm">
                        {msg.content}
                      </div>
                    ) : (
                      <MarkdownRenderer content={msg.content} />
                    )}

                    {/* Named Entities & Language tag if detected */}
                    {!isUser && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-400">
                        {msg.language && (
                          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-navy-850 border border-slate-700">
                            <Globe2 className="w-3 h-3 text-cyan-400" />
                            <span>Lang: {msg.language.language.toUpperCase()}</span>
                          </span>
                        )}
                        {msg.entities && msg.entities.map((ent, idx) => (
                          <span key={idx} className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-800/50 text-purple-300">
                            <Tag className="w-2.5 h-2.5" />
                            <span>{ent.text} ({ent.label})</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bot Actions: Copy, ThumbsUp/Down */}
                    {!isUser && (
                      <div className="mt-2.5 flex items-center justify-between text-slate-400 pt-1 text-[11px]">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleCopy(msg.content, msg.id)}
                            className="hover:text-cyan-300 p-1 rounded transition-colors flex items-center space-x-1"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-[10px] text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span className="text-[10px]">Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleFeedback(msg.id, 'like')}
                            className={`p-1 rounded transition-colors ${msg.feedback === 'like' ? 'text-emerald-400' : 'hover:text-emerald-400'}`}
                            title="Helpful response"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, 'dislike')}
                            className={`p-1 rounded transition-colors ${msg.feedback === 'dislike' ? 'text-red-400' : 'hover:text-red-400'}`}
                            title="Unhelpful response"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Follow-up Question Chips */}
                  {!isUser && msg.follow_up_questions && msg.follow_up_questions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 max-w-[85%]">
                      {msg.follow_up_questions.map((fq, fi) => (
                        <button
                          key={fi}
                          onClick={() => handleSendMessage(fq)}
                          className="px-2.5 py-1 rounded-full bg-navy-850 hover:bg-navy-800 border border-slate-700/80 hover:border-cyan-400/50 text-[11px] text-cyan-300 transition-all font-mono"
                        >
                          &rarr; {fq}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <span className="text-[9px] font-mono text-slate-500 px-1">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex items-center space-x-2 text-xs text-slate-400 p-3 rounded-2xl glass-panel max-w-[200px]">
              <Bot className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Analyzing NLP & generating...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-navy-900/90 glass-panel">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Type your message or NLP query... (e.g. 'What is TF-IDF?')"
              className="flex-1 py-3 px-4 rounded-xl bg-navy-800 border border-slate-700/70 focus:border-cyan-400 focus:outline-none text-xs sm:text-sm text-white placeholder-slate-500 font-mono"
            />
            <button
              type="submit"
              disabled={loading || !inputPrompt.trim()}
              className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-bold transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
