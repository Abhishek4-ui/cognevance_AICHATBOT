import React, { useState, useEffect } from 'react';
import { datasetAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Database, Plus, Search, Layers, CheckCircle2, AlertCircle, FileText, ArrowRight } from 'lucide-react';

export default function DatasetsPage() {
  const { isAdmin } = useAuth();
  const [manifest, setManifest] = useState(null);
  const [intents, setIntents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add intent modal/form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIntentName, setNewIntentName] = useState('');
  const [newCategory, setNewCategory] = useState('nlp');
  const [newResponse, setNewResponse] = useState('');
  const [newExamples, setNewExamples] = useState('');
  const [formMsg, setFormMsg] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [manRes, intRes] = await Promise.all([
        datasetAPI.getManifest(),
        datasetAPI.getIntents()
      ]);
      if (manRes.data.status === 'success') setManifest(manRes.data.manifest);
      if (intRes.data.status === 'success') setIntents(intRes.data.intents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIntent = async (e) => {
    e.preventDefault();
    setFormMsg('');
    setFormError('');
    setSubmitting(true);

    const examplesList = newExamples.split('\n').map((s) => s.trim()).filter(Boolean);

    try {
      const res = await datasetAPI.addIntent({
        intent: newIntentName.trim(),
        category: newCategory,
        response: newResponse.trim(),
        examples: examplesList
      });
      if (res.data.status === 'success') {
        setFormMsg(res.data.message);
        setNewIntentName('');
        setNewResponse('');
        setNewExamples('');
        loadData();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add intent');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredIntents = intents.filter(
    (item) =>
      item.intent.toLowerCase().includes(search.toLowerCase()) ||
      item.response.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center space-x-2">
            <Database className="w-6 h-6 text-cyan-400" />
            <span>Dataset Manifest & Training Knowledge Base</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Real benchmark datasets from Hugging Face & UCI Machine Learning Repository
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all shadow-md shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Close Intent Form' : 'Register New Intent'}</span>
          </button>
        )}
      </div>

      {/* Dataset Manifest Summary Cards */}
      {manifest && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(manifest.datasets || {}).map(([key, ds]) => (
            <div key={key} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">{key.replace(/_/g, ' ')}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 uppercase">
                  {ds.status}
                </span>
              </div>
              <div className="text-xs text-slate-300 font-mono space-y-1">
                <div>Records: <span className="text-cyan-300 font-bold">{ds.total_records?.toLocaleString()}</span></div>
                {ds.num_intents && <div>Intents: <span className="text-purple-300">{ds.num_intents}</span></div>}
                <div className="truncate text-[10px] text-slate-400">License: {ds.license}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Custom Intent Form */}
      {showAddForm && (
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/40 space-y-4 glow-cyan">
          <h3 className="font-bold text-white text-base flex items-center space-x-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Add Custom Domain Intent & Training Examples</span>
          </h3>

          {formMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{formMsg}</span>
            </div>
          )}

          {formError && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleAddIntent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Intent Identifier (e.g. nlp_bert)</label>
              <input
                type="text"
                required
                value={newIntentName}
                onChange={(e) => setNewIntentName(e.target.value)}
                placeholder="nlp_bert"
                className="w-full px-3 py-2 rounded-xl bg-navy-850 border border-slate-700 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-navy-850 border border-slate-700 text-xs text-cyan-300 font-mono"
              >
                <option value="nlp">Natural Language Processing</option>
                <option value="ml">Machine Learning</option>
                <option value="deep_learning">Deep Learning</option>
                <option value="general">General & Conversational</option>
                <option value="service">Customer & Service</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Canonical Bot Response</label>
              <textarea
                rows={2}
                required
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                placeholder="Explain the concept clearly..."
                className="w-full p-2.5 rounded-xl bg-navy-850 border border-slate-700 text-xs text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Training Examples (One query variation per line)
              </label>
              <textarea
                rows={3}
                value={newExamples}
                onChange={(e) => setNewExamples(e.target.value)}
                placeholder="what is bert in nlp&#10;explain bidirectional encoder representations&#10;how does bert transformer work"
                className="w-full p-2.5 rounded-xl bg-navy-850 border border-slate-700 text-xs text-white font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register Intent & Examples'}
            </button>
          </form>
        </div>
      )}

      {/* Intent Browser */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-white text-base">Trained Intent Directory</h3>
            <p className="text-xs text-slate-400 font-mono">Showing {filteredIntents.length} of {intents.length} intents</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search intents..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-navy-850 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-96">
          <table className="w-full text-xs font-mono">
            <thead className="bg-navy-950 sticky top-0">
              <tr className="border-b border-slate-800 text-slate-400 text-left">
                <th className="p-3">Intent</th>
                <th className="p-3">Category</th>
                <th className="p-3">Train Samples</th>
                <th className="p-3">Canonical Response</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredIntents.map((item) => (
                <tr key={item.intent} className="hover:bg-slate-800/30">
                  <td className="p-3 font-semibold text-cyan-300">{item.intent}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-[10px] text-purple-300">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-3 text-emerald-400 font-bold">{item.train_examples_count}</td>
                  <td className="p-3 font-sans text-xs text-slate-300 max-w-md truncate" title={item.response}>
                    {item.response}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
