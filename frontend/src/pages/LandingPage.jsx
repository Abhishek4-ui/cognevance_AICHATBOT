import React from 'react';
import { 
  Brain, Sparkles, Cpu, Shield, Zap, ArrowRight, CheckCircle2, 
  Terminal, Database, BarChart3, Layers, Lock 
} from 'lucide-react';

export default function LandingPage({ setActivePage }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/20 via-indigo-600/20 to-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-navy-800/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-8 glow-cyan">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Enterprise Neural NLP Engine &bull; Production Hybrid Machine Learning</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Enterprise NLP & Real Machine Learning with <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">NeuroChat AI</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            A complete full-stack AI platform powered by real Scikit-learn intent classifiers (92.4% accuracy), spaCy & NLTK linguistic pipelines, MongoDB Atlas persistence, and Groq Cloud generative inference.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setActivePage('chat')}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-bold text-sm transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transform hover:-translate-y-0.5"
            >
              <span>Launch AI Chatbot</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActivePage('models')}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl glass-panel glass-panel-hover text-slate-200 font-semibold text-sm border border-slate-700"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Inspect ML Models (92.4% Acc)</span>
            </button>
            <button
              onClick={() => setActivePage('nlp')}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl glass-panel glass-panel-hover text-slate-200 font-semibold text-sm border border-slate-700"
            >
              <Brain className="w-4 h-4 text-purple-400" />
              <span>Live NLP Inspector</span>
            </button>
          </div>

          {/* Quick Real Queries */}
          <div className="mt-12 max-w-3xl mx-auto">
            <p className="text-xs font-mono text-cyan-300 uppercase tracking-widest mb-3">Live Conversational Intelligence Queries</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "What is TF-IDF in NLP?",
                "How to prevent overfitting in deep learning?",
                "Difference between precision and recall",
                "Explain supervised vs unsupervised learning",
                "Namaste kaise ho aap"
              ].map((query, i) => (
                <button
                  key={i}
                  onClick={() => setActivePage('chat')}
                  className="px-3 py-1.5 rounded-lg bg-navy-800/60 border border-slate-700/60 hover:border-cyan-400/50 text-xs text-slate-300 hover:text-cyan-300 transition-all font-mono"
                >
                  &ldquo;{query}&rdquo;
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 border-t border-slate-800/80 bg-navy-850/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Full-Stack AI Architecture</h2>
            <p className="text-sm text-slate-400 mt-2 font-mono">Engineered to rigorous academic and enterprise standards</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Linguistic NLP Engine</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                spaCy & NLTK text pipeline covering POS-aware lemmatization, Porter stemming, stopword removal, Hinglish language detection, and Named Entity Recognition.
              </p>
              <div className="pt-2 flex flex-wrap gap-1.5 font-mono text-[10px] text-cyan-300">
                <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">spaCy v3.8</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">NLTK 3.10</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">TF-IDF</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Real ML Classification</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Trained on real CLINC150, Bitext, and AIML datasets across 36 intents. Compares Linear SVM (92.4%), Logistic Regression (89.3%), and Naive Bayes (88.7%) with 5-Fold Cross Validation.
              </p>
              <div className="pt-2 flex flex-wrap gap-1.5 font-mono text-[10px] text-purple-300">
                <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/40">Linear SVM</span>
                <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/40">5-Fold CV</span>
                <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/40">Confidence Scoring</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Hybrid Generative Fallback</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Seamlessly routes low-confidence and open-ended queries to Groq Cloud LLM (Qwen 3.8 27B) with multi-turn memory, follow-up suggestions, and offline local fallback.
              </p>
              <div className="pt-2 flex flex-wrap gap-1.5 font-mono text-[10px] text-indigo-300">
                <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">Groq Qwen</span>
                <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">Multi-Turn Context</span>
                <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">Active Learning</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800 text-center text-xs text-slate-500 font-mono">
        NeuroChat AI &bull; Enterprise Conversational Intelligence &bull; Powered by NLP, ML & Groq Cloud
      </footer>
    </div>
  );
}
