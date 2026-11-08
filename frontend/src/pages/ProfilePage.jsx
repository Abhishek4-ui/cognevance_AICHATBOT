import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { User, Mail, Shield, KeyRound, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    const payload = {};
    if (username !== user?.username) payload.username = username;
    if (newPassword) {
      payload.current_password = currentPassword;
      payload.new_password = newPassword;
    }

    if (Object.keys(payload).length === 0) {
      setError('No changes detected');
      setLoading(false);
      return;
    }

    try {
      const res = await authAPI.updateProfile(payload);
      if (res.data.status === 'success') {
        setMessage('Profile updated successfully');
        updateUser({ username });
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white flex items-center space-x-2">
          <User className="w-6 h-6 text-cyan-400" />
          <span>User Profile & Security</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Manage your account information and credentials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* User Card */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 p-[2px] mx-auto glow-cyan">
            <div className="w-full h-full rounded-full bg-navy-900 flex items-center justify-center font-bold text-2xl text-cyan-300">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white text-base">{user?.username}</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</p>
          </div>

          <div className="pt-2">
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold font-mono tracking-wider ${
              user?.role === 'admin' 
                ? 'bg-purple-950 border border-purple-500/50 text-purple-300' 
                : 'bg-cyan-950 border border-cyan-500/50 text-cyan-300'
            }`}>
              {user?.role?.toUpperCase()}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 font-mono pt-4 border-t border-slate-800/80 space-y-1">
            <div className="flex items-center justify-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>Joined: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}</span>
            </div>
          </div>
        </div>

        {/* Update Form */}
        <div className="md:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800">
          <h3 className="font-bold text-white text-sm mb-4">Edit Profile & Password</h3>

          {message && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-navy-850 border border-slate-700/80 focus:border-cyan-400 focus:outline-none text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address (Read-only)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950/80 border border-slate-800 text-xs text-slate-400 cursor-not-allowed font-mono"
              />
            </div>

            <div className="pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>Change Password (Leave blank to keep unchanged)</span>
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 rounded-xl bg-navy-850 border border-slate-700/80 focus:border-cyan-400 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3.5 py-2 rounded-xl bg-navy-850 border border-slate-700/80 focus:border-cyan-400 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
