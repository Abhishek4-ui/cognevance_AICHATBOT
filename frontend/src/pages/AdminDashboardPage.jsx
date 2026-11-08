import React, { useState, useEffect } from 'react';
import { adminAPI } from '../api';
import { 
  Shield, Users, MessageSquare, ThumbsUp, RefreshCw, AlertTriangle, 
  CheckCircle2, Clock, Activity, Cpu, Database 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [unanswered, setUnanswered] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainMsg, setRetrainMsg] = useState('');

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    try {
      const [sRes, uRes, unRes, lRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getUnanswered(),
        adminAPI.getLogs()
      ]);
      if (sRes.data.status === 'success') setStats(sRes.data.stats);
      if (uRes.data.status === 'success') setUsers(uRes.data.users || []);
      if (unRes.data.status === 'success') setUnanswered(unRes.data.unanswered_questions || []);
      if (lRes.data.status === 'success') setLogs(lRes.data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainMsg('');
    try {
      const res = await adminAPI.triggerRetrain();
      if (res.data.status === 'success') {
        setRetrainMsg('Models retrained and reloaded into active memory successfully!');
        loadAllAdminData();
      }
    } catch (err) {
      setRetrainMsg('Retraining failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setRetraining(false);
    }
  };

  const handleToggleUser = async (userId) => {
    try {
      await adminAPI.toggleUserStatus(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !u.is_active } : u))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveQuestion = async (id) => {
    try {
      await adminAPI.resolveUnanswered(id, { status: 'resolved' });
      setUnanswered((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !stats) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-xs text-slate-400">
        Loading Admin Management Dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header with Retrain Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center space-x-2">
            <Shield className="w-6 h-6 text-purple-400" />
            <span>Administrator Control Hub</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Live database telemetry from MongoDB Atlas &bull; Real model controls
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${retraining ? 'animate-spin' : ''}`} />
          <span>{retraining ? 'Training Models...' : 'Retrain All ML Models'}</span>
        </button>
      </div>

      {retrainMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center space-x-2 font-mono">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{retrainMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase">Total Users</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.total_users}</div>
          <span className="text-[10px] text-slate-500 font-mono">Registered accounts</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase">Conversations</span>
            <MessageSquare className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.total_conversations}</div>
          <span className="text-[10px] text-slate-500 font-mono">{stats.total_messages} total messages</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase">Satisfaction Rate</span>
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{stats.satisfaction_rate}%</div>
          <span className="text-[10px] text-slate-500 font-mono">
            {stats.feedback_likes} likes, {stats.feedback_dislikes} dislikes
          </span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono uppercase">Unanswered Queries</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{stats.unanswered_count}</div>
          <span className="text-[10px] text-slate-500 font-mono">Active learning queue</span>
        </div>
      </div>

      {/* Popular Intents Chart */}
      {stats.popular_intents && stats.popular_intents.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="font-bold text-white text-base">Popular Query Intents</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.popular_intents} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="intent" stroke="#94A3B8" fontSize={10} angle={-20} textAnchor="end" />
                <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B132B', borderColor: '#334155', borderRadius: '10px', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#00F0FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Unanswered Queries Table (Active Learning) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-white text-base flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Active Learning: Unanswered & Low Confidence Queries</span>
        </h3>

        <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-64">
          <table className="w-full text-xs font-mono">
            <thead className="bg-navy-950 sticky top-0">
              <tr className="border-b border-slate-800 text-slate-400 text-left">
                <th className="p-3">Query Text</th>
                <th className="p-3">Model Confidence</th>
                <th className="p-3">Predicted Intent</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {unanswered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">
                    No unanswered queries pending resolution.
                  </td>
                </tr>
              ) : (
                unanswered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-medium text-white">{item.query_text}</td>
                    <td className="p-3 text-amber-400">{(item.confidence * 100).toFixed(1)}%</td>
                    <td className="p-3 text-purple-300">{item.predicted_intent || 'None'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px]">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleResolveQuestion(item.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[11px] transition-all"
                      >
                        Resolve
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Management Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-white text-base">User Directory & Role Management</h3>

        <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-64">
          <table className="w-full text-xs font-mono">
            <thead className="bg-navy-950 sticky top-0">
              <tr className="border-b border-slate-800 text-slate-400 text-left">
                <th className="p-3">Username</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Toggle Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30">
                  <td className="p-3 font-semibold text-white">{u.username}</td>
                  <td className="p-3 text-slate-400">{u.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      u.role === 'admin' ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-cyan-950 text-cyan-300'
                    }`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      u.is_active ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
                    }`}>
                      {u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleToggleUser(u.id)}
                      className="px-2.5 py-1 rounded-lg bg-navy-850 hover:bg-navy-800 border border-slate-700 text-slate-300 text-[11px] transition-all"
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Audit Logs */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-white text-base flex items-center space-x-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>System Audit & Security Logs</span>
        </h3>

        <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-56">
          <table className="w-full text-xs font-mono">
            <thead className="bg-navy-950 sticky top-0">
              <tr className="border-b border-slate-800 text-slate-400 text-left">
                <th className="p-2.5">Timestamp</th>
                <th className="p-2.5">Event</th>
                <th className="p-2.5">Level</th>
                <th className="p-2.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-400 text-[11px]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30">
                  <td className="p-2.5 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-2.5 font-bold text-cyan-300">{log.event_type}</td>
                  <td className="p-2.5">
                    <span className="px-1.5 py-0.2 rounded bg-navy-850 border border-slate-700 uppercase text-[9px]">
                      {log.level}
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-300 truncate max-w-xs">{JSON.stringify(log.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
