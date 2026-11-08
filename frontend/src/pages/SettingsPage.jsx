import React, { useState, useEffect } from 'react';
import { nlpAPI, healthAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Settings, Sliders, Cpu, Activity, CheckCircle2, Shield, Zap, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const [activeModel, setActiveModel] = useState('linear_svm');
  const [threshold, setThreshold] = useState(0.25);
  const [health, setHealth] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [mRes, hRes] = await Promise.all([
        nlpAPI.getModels(),
        healthAPI.check()
      ]);
      if (mRes.data.status === 'success') {
        setActiveModel(mRes.data.active_model);
        if (mRes.data.confidence_threshold) {
          setThreshold(mRes.data.confidence_threshold);
        }
      }
      if (hRes.data.status === 'healthy') {
        setHealth(hRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleModelChange = async (newModel) => {
    if (!isAdmin) return;
    setLoading(true);
    setMsg('');
    try {
      const res = await nlpAPI.setActiveModel(newModel);
      if (res.data.status === 'success') {
        setActiveModel(newModel);
        setMsg(`Active model successfully updated to ${newModel.replace('_', ' ').toUpperCase()}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleThresholdSave = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setMsg('');
    try {
      const res = await nlpAPI.setThreshold(threshold);
      if (res.data.status === 'success') {
        setMsg(`Confidence threshold updated to ${threshold}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center space-x-2">
          <Settings className="w-6 h-6 text-cyan-400" />
          <span>System & NLP Configuration Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Configure active machine learning classifiers, threshold parameters, and monitor infrastructure health
        </p>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center space-x-2 font-mono">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Model Selection */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white text-base">Active NLP Intent Classification Model</h3>
        </div>
        <p className="text-xs text-slate-400">
          Select which trained machine learning model powers live inference when queries are sent by users.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {[
            {
              id: 'linear_svm',
              name: 'Linear SVM',
              badge: 'Best Accuracy (92.4%)',
              desc: 'Maximum margin hyperplane classifier with Platt probability calibration.'
            },
            {
              id: 'logistic_regression',
              name: 'Logistic Regression',
              badge: 'Accuracy: 89.3%',
              desc: 'Cross-entropy loss optimization with L2 regularization.'
            },
            {
              id: 'naive_bayes',
              name: 'Multinomial Naive Bayes',
              badge: 'Accuracy: 88.7%',
              desc: 'Fast probabilistic model using Bayes rule and Laplace smoothing.'
            }
          ].map((m) => {
            const isSelected = activeModel === m.id;
            return (
              <div
                key={m.id}
                onClick={() => isAdmin && handleModelChange(m.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-navy-800 border-cyan-500 shadow-md shadow-cyan-950/50 glow-cyan'
                    : 'bg-navy-850/60 border-slate-700/60 hover:border-slate-500'
                } ${!isAdmin ? 'cursor-not-allowed opacity-80' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-white">{m.name}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                  {m.badge}
                </span>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{m.desc}</p>
              </div>
            );
          })}
        </div>

        {!isAdmin && (
          <p className="text-[11px] text-slate-500 font-mono italic">
            * Note: Switching active model requires Administrator privileges.
          </p>
        )}
      </div>

      {/* Confidence Threshold Slider */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white text-base">Unknown Intent Confidence Threshold</h3>
          </div>
          <span className="text-lg font-black font-mono text-cyan-300">
            {(threshold * 100).toFixed(0)}%
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          If the top-predicted intent probability falls below this threshold, the query is marked as &ldquo;unknown&rdquo;, logged for active learning review, and routed to Groq Generative AI.
        </p>

        <div className="space-y-2 pt-2">
          <input
            type="range"
            min="0.05"
            max="0.80"
            step="0.05"
            disabled={!isAdmin}
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>5% (Aggressive Match)</span>
            <span>25% (Balanced Default)</span>
            <span>80% (Strict Match)</span>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={handleThresholdSave}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all"
          >
            Save Threshold Setting
          </button>
        )}
      </div>

      {/* System Health Diagnostics */}
      {health && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">System Infrastructure Diagnostics</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-navy-850 border border-slate-700/60 space-y-1">
              <span className="text-slate-400 text-[10px]">Database Status</span>
              <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>MongoDB Atlas Online</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-navy-850 border border-slate-700/60 space-y-1">
              <span className="text-slate-400 text-[10px]">Generative AI Gateway</span>
              <div className="flex items-center space-x-1.5 text-cyan-300 font-bold">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>{health.genai_provider}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-navy-850 border border-slate-700/60 space-y-1">
              <span className="text-slate-400 text-[10px]">System Platform</span>
              <div className="text-white font-bold">
                macOS M2 &bull; v{health.version}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
