import React, { useState } from 'react';
import { nlpAPI } from '../api';
import { Brain, Sparkles, Tag, Globe2, Layers, Search, Cpu, CheckCircle2, ArrowRight } from 'lucide-react';

export default function NLPAnalyticsPage() {
  const [inputText, setInputText] = useState('Google acquired DeepMind in London to accelerate neural network research.');
  const [nlpData, setNlpData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Semantic similarity inputs
  const [simText1, setSimText1] = useState('How does artificial neural network learn?');
  const [simText2, setSimText2] = useState('Explain how deep learning models train using backpropagation.');
  const [simScore, setSimScore] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  const handleInspect = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const res = await nlpAPI.preprocess(inputText);
      if (res.data.status === 'success') {
        setNlpData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimilarity = async (e) => {
    e.preventDefault();
    if (!simText1.trim() || !simText2.trim()) return;
    setSimLoading(true);
    try {
      const res = await nlpAPI.checkSimilarity(simText1, simText2);
      if (res.data.status === 'success') {
        setSimScore(res.data.similarity_score);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center space-x-2">
          <Brain className="w-6 h-6 text-cyan-400" />
          <span>Linguistic NLP Pipeline & Inspector</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Inspect text tokenization, POS-aware lemmatization, Porter stemming, language detection, and spaCy NER
        </p>
      </div>

      {/* Live NLP Inspector Form */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <form onSubmit={handleInspect} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            Enter Any Text to Inspect Pipeline
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or paste sentences here..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-navy-850 border border-slate-700/80 focus:border-cyan-400 text-xs text-white font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 text-black font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
            >
              <span>{loading ? 'Analyzing...' : 'Run NLP Pipeline'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {nlpData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
            
            {/* Language Card */}
            <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Globe2 className="w-4 h-4 text-cyan-400" />
                  <span>Language</span>
                </span>
                <span className="font-mono text-cyan-300 uppercase">{nlpData.language_detection?.language}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Type: {nlpData.language_detection?.type} &bull; Confidence: {(nlpData.language_detection?.confidence * 100).toFixed(0)}%
              </div>
            </div>

            {/* Token Count */}
            <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Tokens Generated</span>
                </span>
                <span className="font-mono text-purple-300">{nlpData.token_count}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Extracted via spaCy en_core_web_sm
              </div>
            </div>

            {/* Named Entities */}
            <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2 md:col-span-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  <span>spaCy Named Entities (NER)</span>
                </span>
                <span className="font-mono text-emerald-300">{nlpData.named_entities?.length || 0} Entities</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {nlpData.named_entities?.length === 0 ? (
                  <span className="text-[11px] text-slate-500 font-mono">No named entities detected</span>
                ) : (
                  nlpData.named_entities.map((ent, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50 text-[10px] text-emerald-300 font-mono">
                      {ent.text} &rarr; <span className="font-bold">{ent.label}</span>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Raw Tokens Display */}
            <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2 md:col-span-2">
              <span className="text-xs font-bold text-slate-300 block">Token Stream</span>
              <div className="flex flex-wrap gap-1 font-mono text-[10px] max-h-32 overflow-y-auto">
                {nlpData.tokens?.map((tok, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-navy-850 border border-slate-700 text-slate-300">
                    {tok}
                  </span>
                ))}
              </div>
            </div>

            {/* Lemmatization & Stemming Comparison */}
            <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2 md:col-span-2">
              <span className="text-xs font-bold text-slate-300 block">Lemmatized (TF-IDF Ready) vs Stems</span>
              <div className="text-[11px] space-y-1.5 font-mono">
                <div className="p-2 rounded bg-navy-850/80 border border-slate-800 text-cyan-300">
                  <span className="text-slate-500 block text-[9px] uppercase">Lemmatized Text</span>
                  {nlpData.lemmatized_pipeline || 'Empty after stopword filtering'}
                </div>
                <div className="p-2 rounded bg-navy-850/80 border border-slate-800 text-purple-300 truncate">
                  <span className="text-slate-500 block text-[9px] uppercase">Porter Stemmer Sample</span>
                  {nlpData.porter_stems?.slice(0, 8).join(', ')}...
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Semantic Text Similarity Calculator */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-bold text-white">Semantic Cosine Text Similarity</h2>
        </div>
        <p className="text-xs text-slate-400">
          Calculates vector similarity between two arbitrary texts using spaCy embeddings and lexical overlap.
        </p>

        <form onSubmit={handleSimilarity} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Sentence 1</label>
            <textarea
              rows={2}
              value={simText1}
              onChange={(e) => setSimText1(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-navy-850 border border-slate-700/80 focus:border-purple-400 text-xs text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Sentence 2</label>
            <textarea
              rows={2}
              value={simText2}
              onChange={(e) => setSimText2(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-navy-850 border border-slate-700/80 focus:border-purple-400 text-xs text-white font-mono"
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-between">
            <button
              type="submit"
              disabled={simLoading}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-600/20 disabled:opacity-50"
            >
              {simLoading ? 'Computing...' : 'Calculate Similarity'}
            </button>

            {simScore !== null && (
              <div className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-navy-850 border border-purple-500/40 font-mono">
                <span className="text-xs text-slate-400">Cosine Score:</span>
                <span className="text-base font-bold text-cyan-300">{(simScore * 100).toFixed(1)}%</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  simScore > 0.6 ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                }`}>
                  {simScore > 0.6 ? 'HIGH SIMILARITY' : 'MODERATE/LOW'}
                </span>
              </div>
            )}
          </div>
        </form>
      </div>

    </div>
  );
}
