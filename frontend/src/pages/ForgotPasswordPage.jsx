import React, { useState } from 'react';
import { authAPI } from '../api';
import { KeyRound, Mail, ArrowLeft, CheckCircle2, AlertCircle, Lock } from 'lucide-react';

export default function ForgotPasswordPage({ setActivePage }) {
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Request, 2: Reset
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(email);
      setMessage(res.data.message);
      if (res.data.debug_reset_token) {
        setResetToken(res.data.debug_reset_token);
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await authAPI.resetPassword(resetToken, newPassword);
      setMessage(res.data.message);
      setTimeout(() => {
        setActivePage('login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel border border-slate-800 rounded-3xl p-8 glow-cyan relative overflow-hidden">
        
        <button
          onClick={() => setActivePage('login')}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white">Reset Password</h2>
          <p className="text-xs text-slate-400 mt-1">
            {step === 1 ? 'Enter your registered email address' : 'Enter your new password below'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@neurochat.ai"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-800/80 border border-slate-700/80 focus:border-cyan-400 focus:outline-none text-xs text-white placeholder-slate-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 text-black font-bold text-xs tracking-wide transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Generate Reset Token'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Reset Token</label>
              <input
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-navy-800/80 border border-slate-700/80 text-xs text-cyan-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 chars)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-800/80 border border-slate-700/80 focus:border-cyan-400 focus:outline-none text-xs text-white placeholder-slate-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 text-black font-bold text-xs tracking-wide transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Confirm New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
