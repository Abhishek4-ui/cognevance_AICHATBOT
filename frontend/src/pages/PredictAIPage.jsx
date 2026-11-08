import React, { useState, useEffect } from 'react';
import { predictAIAPI } from '../api';
import { BarChart3, TrendingUp, Users, ShoppingBag, CheckCircle2, ShieldCheck, Database, Award } from 'lucide-react';

export default function PredictAIPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBenchmarks();
  }, []);

  const loadBenchmarks = async () => {
    try {
      const res = await predictAIAPI.getAll();
      if (res.data.status === 'success') {
        setData(res.data.benchmarks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-xs text-slate-400">
        Loading PredictAI Machine Learning benchmarks...
      </div>
    );
  }

  const { classification: bank, regression: student, clustering: retail } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-cyan-400" />
          <span>PredictAI &bull; Real Benchmark ML Models</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Evaluating Classification, Regression, and Clustering across UCI Machine Learning Repository Datasets
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Module 1: Bank Marketing Classification */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Bank Marketing (UCI)</h3>
              <span className="text-[10px] font-mono text-cyan-300">Binary Classification</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Predicts whether a bank client will subscribe to a term deposit using Random Forest with stratified cross-validation.
          </p>

          <div className="space-y-2 pt-2 border-t border-slate-800 font-mono text-xs">
            <div className="flex justify-between p-2 rounded bg-navy-850">
              <span className="text-slate-400">Test Accuracy</span>
              <span className="font-bold text-cyan-300">{(bank.accuracy * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-navy-850">
              <span className="text-slate-400">Weighted F1-Score</span>
              <span className="font-bold text-purple-300">{(bank.f1_score * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-navy-850">
              <span className="text-slate-400">Total Verified Records</span>
              <span className="font-bold text-white">{bank.records?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Module 2: Student Performance Regression */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Student Performance (UCI)</h3>
              <span className="text-[10px] font-mono text-purple-300">Continuous Regression</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Predicts performance metrics and assessment scores (UCI Benchmark Dataset) using Random Forest Regression with cross-validation.
          </p>

          <div className="space-y-2 pt-2 border-t border-slate-800 font-mono text-xs">
            <div className="flex justify-between p-2 rounded bg-navy-850">
              <span className="text-slate-400">Coefficient of Det. (R&sup2;)</span>
              <span className="font-bold text-emerald-300">{(student.r2_score * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-navy-850">
              <span className="text-slate-400">Root Mean Sq. Error (RMSE)</span>
              <span className="font-bold text-cyan-300">{student.rmse}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-navy-850">
              <span className="text-slate-400">Mean Target Grade</span>
              <span className="font-bold text-white">{student.mean_target_grade} / 20</span>
            </div>
          </div>
        </div>

        {/* Module 3: Online Retail Clustering */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Online Retail (UCI)</h3>
              <span className="text-[10px] font-mono text-indigo-300">K-Means Customer Segmentation</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Segments customer purchasing patterns using Recency, Frequency, and Monetary (RFM) clustering algorithms.
          </p>

          <div className="space-y-2 pt-2 border-t border-slate-800 font-mono text-xs">
            <div className="flex justify-between p-2 rounded bg-navy-850">
              <span className="text-slate-400">Silhouette Coefficient</span>
              <span className="font-bold text-cyan-300">{retail.silhouette_score}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-navy-850">
              <span className="text-slate-400">Optimal Clusters</span>
              <span className="font-bold text-purple-300">{retail.num_clusters} Clusters</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-navy-850">
              <span className="text-slate-400">Segmented Customers</span>
              <span className="font-bold text-white">{retail.unique_customers}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Cluster Profiles Table */}
      {retail.cluster_profiles && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="font-bold text-white text-base">
            Online Retail K-Means Customer Segments Profile
          </h3>
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-xs font-mono">
              <thead className="bg-navy-950">
                <tr className="border-b border-slate-800 text-slate-400 text-left">
                  <th className="p-3">Cluster ID</th>
                  <th className="p-3">Customer Count</th>
                  <th className="p-3">Avg Invoices (Frequency)</th>
                  <th className="p-3">Avg Spend (Monetary)</th>
                  <th className="p-3">Customer Persona</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {Object.entries(retail.cluster_profiles).map(([cid, prof]) => (
                  <tr key={cid} className="hover:bg-slate-800/30">
                    <td className="p-3 font-bold text-cyan-300">Segment #{cid}</td>
                    <td className="p-3">{prof.Count}</td>
                    <td className="p-3">{prof.Frequency}</td>
                    <td className="p-3 font-semibold text-emerald-400">${prof.Monetary}</td>
                    <td className="p-3 text-[11px] text-slate-400 font-sans">
                      {cid === '0' ? 'Regular Retail Buyers' : cid === '1' ? 'VIP High-Volume Buyers' : cid === '2' ? 'Frequent Wholesalers' : 'High-Value Enterprise'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
