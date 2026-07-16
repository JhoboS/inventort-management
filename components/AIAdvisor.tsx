import React, { useState } from 'react';
import { Product, AIAnalysisResult } from '../types';
import { analyzeInventory } from '../services/geminiService';
import { BrainCircuit, Loader2, RefreshCw, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';

interface AIAdvisorProps {
  products: Product[];
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ products }) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeInventory(products);
      setAnalysis(result);
    } catch (err) {
      setError("Failed to analyze inventory. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <BrainCircuit size={32} />
              </div>
              <h2 className="text-3xl font-bold">Inventory Intelligence</h2>
            </div>
            <p className="text-indigo-100 text-lg leading-relaxed">
              Leverage Gemini 2.5 to analyze your stock levels, identify inefficiencies, and get actionable restocking strategies instantly.
            </p>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="mt-6 flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold hover:bg-indigo-50 transition-colors disabled:opacity-75 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
              {analysis ? 'Refresh Analysis' : 'Analyze Inventory'}
            </button>
          </div>
          {/* Decorative background element could go here */}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
          
          {/* Summary Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-green-500" />
              Executive Summary
            </h3>
            <p className="text-slate-600 leading-relaxed text-lg">
              {analysis.summary}
            </p>
          </div>

          {/* Recommendations Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Lightbulb className="text-amber-500" />
              Strategic Recommendations
            </h3>
            <ul className="space-y-4">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex gap-3 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="flex-shrink-0 w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Restock Priority Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="text-red-500" />
              Critical Restock Priority
            </h3>
            {analysis.restockPriority.length > 0 ? (
              <div className="space-y-3">
                 {analysis.restockPriority.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                      <span className="font-medium text-red-900">{item}</span>
                      <span className="text-xs font-bold text-red-600 bg-white px-2 py-1 rounded border border-red-100">URGENT</span>
                    </div>
                 ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <CheckCircle2 size={32} className="mx-auto mb-2 text-green-500" />
                <p>Stock levels look healthy!</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default AIAdvisor;
