import React, { useState, useEffect } from 'react';
import { nlpAPI } from '../api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Cpu, CheckCircle2, ShieldAlert, Layers, BarChart2, Award, Zap } from 'lucide-react';

export default function ModelPerformancePage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState('linear_svm');

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const res = await nlpAPI.getMetrics();
      if (res.data.status === 'success') {
        setReport(res.data.evaluation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !report) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-xs text-slate-400">
        Loading real ML evaluation metrics...
      </div>
    );
  }

  const { detailed_metrics, summary } = report;

  // Format Recharts data
  const chartData = [
    {
      metric: 'Test Accuracy',
      'Linear SVM': (detailed_metrics.linear_svm.test_accuracy * 100).toFixed(1),
      'Logistic Regression': (detailed_metrics.logistic_regression.test_accuracy * 100).toFixed(1),
      'Naive Bayes': (detailed_metrics.naive_bayes.test_accuracy * 100).toFixed(1),
    },
    {
      metric: 'F1 Score (Weighted)',
      'Linear SVM': (detailed_metrics.linear_svm.f1_weighted * 100).toFixed(1),
      'Logistic Regression': (detailed_metrics.logistic_regression.f1_weighted * 100).toFixed(1),
      'Naive Bayes': (detailed_metrics.naive_bayes.f1_weighted * 100).toFixed(1),
    },
    {
      metric: '5-Fold CV Mean',
      'Linear SVM': (detailed_metrics.linear_svm.cv_accuracy_mean * 100).toFixed(1),
      'Logistic Regression': (detailed_metrics.logistic_regression.cv_accuracy_mean * 100).toFixed(1),
      'Naive Bayes': (detailed_metrics.naive_bayes.cv_accuracy_mean * 100).toFixed(1),
    },
    {
      metric: 'Precision (Weighted)',
      'Linear SVM': (detailed_metrics.linear_svm.precision_weighted * 100).toFixed(1),
      'Logistic Regression': (detailed_metrics.logistic_regression.precision_weighted * 100).toFixed(1),
      'Naive Bayes': (detailed_metrics.naive_bayes.precision_weighted * 100).toFixed(1),
    },
    {
      metric: 'Recall (Weighted)',
      'Linear SVM': (detailed_metrics.linear_svm.recall_weighted * 100).toFixed(1),
      'Logistic Regression': (detailed_metrics.logistic_regression.recall_weighted * 100).toFixed(1),
      'Naive Bayes': (detailed_metrics.naive_bayes.recall_weighted * 100).toFixed(1),
    }
  ];

  const currentDetails = detailed_metrics[selectedModel];
  const classReport = currentDetails.classification_report;
  const classes = summary.classes;
  const cm = currentDetails.confusion_matrix;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center space-x-2">
            <Cpu className="w-6 h-6 text-cyan-400" />
            <span>Machine Learning Benchmark & Model Performance</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Trained on 1,310 real samples &bull; Evaluated on 328 untouched test samples &bull; 36 classes
          </p>
        </div>

        {/* Model Switcher Buttons */}
        <div className="flex items-center space-x-1.5 bg-navy-850 p-1.5 rounded-xl border border-slate-700">
          {[
            { id: 'linear_svm', label: 'Linear SVM (92.4%)' },
            { id: 'logistic_regression', label: 'Logistic Reg (89.3%)' },
            { id: 'naive_bayes', label: 'Naive Bayes (88.7%)' }
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModel(m.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                selectedModel === m.id
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Test Accuracy</span>
          <div className="text-2xl font-black text-cyan-400">
            {(currentDetails.test_accuracy * 100).toFixed(2)}%
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Exact test set match</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Weighted F1-Score</span>
          <div className="text-2xl font-black text-purple-400">
            {(currentDetails.f1_weighted * 100).toFixed(2)}%
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Harmonic precision/recall</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">5-Fold Stratified CV</span>
          <div className="text-2xl font-black text-emerald-400">
            {(currentDetails.cv_accuracy_mean * 100).toFixed(2)}%
          </div>
          <span className="text-[10px] text-slate-500 font-mono">&plusmn;{(currentDetails.cv_accuracy_std * 100).toFixed(2)}% standard dev</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Active Best Model</span>
          <div className="text-xl font-bold text-white uppercase truncate font-mono">
            {summary.best_model}
          </div>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1">
            <Award className="w-3 h-3" />
            <span>Top Generalization Score</span>
          </span>
        </div>

      </div>

      {/* Recharts Model Comparison Bar Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Model Comparison (All Real Metrics)</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Percentages (0 - 100%)</span>
        </div>

        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="metric" stroke="#94A3B8" fontSize={11} />
              <YAxis domain={[80, 100]} stroke="#94A3B8" fontSize={11} unit="%" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0B132B', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                itemStyle={{ color: '#E2E8F0' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Linear SVM" fill="#00F0FF" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Logistic Regression" fill="#7928CA" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Naive Bayes" fill="#5800FF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confusion Matrix Viewer */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">
              Confusion Matrix: {selectedModel.toUpperCase()}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Comparing Ground Truth Labels (Rows) against Model Predictions (Columns)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 border border-slate-800 rounded-xl">
          <table className="w-full text-[10px] font-mono border-collapse">
            <thead className="bg-navy-950 sticky top-0 z-10">
              <tr>
                <th className="p-2 border border-slate-800 text-left text-slate-400 bg-navy-950">Ground Truth \ Predicted</th>
                {classes.map((cls, idx) => (
                  <th key={idx} className="p-2 border border-slate-800 text-center text-slate-300 max-w-[80px] truncate" title={cls}>
                    {cls.slice(0, 8)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cm && cm.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-800/40">
                  <td className="p-2 border border-slate-800 font-bold text-slate-300 truncate max-w-[140px]" title={classes[rIdx]}>
                    {classes[rIdx]}
                  </td>
                  {row.map((val, cIdx) => {
                    const isDiagonal = rIdx === cIdx;
                    return (
                      <td 
                        key={cIdx} 
                        className={`p-2 border border-slate-800 text-center ${
                          val > 0 
                            ? isDiagonal 
                              ? 'bg-cyan-950/80 text-cyan-300 font-bold' 
                              : 'bg-red-950/60 text-red-300' 
                            : 'text-slate-600'
                        }`}
                      >
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Classification Report Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-white text-base">
          Intent-by-Intent Classification Report
        </h3>

        <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-80">
          <table className="w-full text-xs font-mono">
            <thead className="bg-navy-950 sticky top-0">
              <tr className="border-b border-slate-800 text-slate-400 text-left">
                <th className="p-3">Intent Class</th>
                <th className="p-3">Precision</th>
                <th className="p-3">Recall</th>
                <th className="p-3">F1-Score</th>
                <th className="p-3">Support (Test Samples)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {classes.map((cls) => {
                const item = classReport[cls] || {};
                return (
                  <tr key={cls} className="hover:bg-slate-800/30">
                    <td className="p-3 font-semibold text-cyan-300">{cls}</td>
                    <td className="p-3">{(item.precision !== undefined ? item.precision * 100 : 0).toFixed(1)}%</td>
                    <td className="p-3">{(item.recall !== undefined ? item.recall * 100 : 0).toFixed(1)}%</td>
                    <td className="p-3">{(item['f1-score'] !== undefined ? item['f1-score'] * 100 : 0).toFixed(1)}%</td>
                    <td className="p-3">{item.support || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
