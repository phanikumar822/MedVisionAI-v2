import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { Layers, ArrowLeft, Shield, ExternalLink } from 'lucide-react';

interface ModelMeta {
  model_id: string;
  disease_id: string;
  disease_name: string;
  specialty: string;
  modality: string;
  architecture: string;
  backbone?: string;
  checkpoint?: string;
  repository: string;
  license: string;
  dataset: string;
  dataset_version?: string;
  model_version: string;
  status: string;
  metrics: {
    auroc?: number;
    auprc?: number;
    accuracy?: number;
    sensitivity?: number;
    specificity?: number;
    f1_score?: number;
  };
  calibration_status: string;
  external_validation_status: string;
  explainability_method: string;
  intended_use: string;
  limitations: string;
}

const ModelRegistryView: React.FC = () => {
  const [models, setModels] = useState<ModelMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await api.get('/models/registry');
        setModels(res.data);
      } catch (err) {
        console.error('Failed to load model registry:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRODUCTION-CANDIDATE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'VALIDATED-INTERNAL':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'VALIDATED-EXTERNAL':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'EXPERIMENTAL':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'RESEARCH':
      default:
        return 'bg-purple-100 text-purple-800 border-purple-300';
    }
  };

  const filteredModels = models.filter(m => selectedStatus === 'ALL' || m.status === selectedStatus);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans pb-12">
      {/* Header */}
      <header className="bg-[#0F172A] text-white px-6 py-4 border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/doctor" className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">MedVisionAI Model Registry & Governance</h1>
              <p className="text-xs text-slate-400">10-Disease Ophthalmic AI Architecture & Validation Metadata</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Validation Tiers</option>
              <option value="VALIDATED-INTERNAL">Validated Internal</option>
              <option value="EXPERIMENTAL">Experimental</option>
              <option value="RESEARCH">Research Use Only</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* Governance Policy Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-teal-600" />
            Clinical Model Selection & Transparency Policy
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            MedVisionAI strictly rejects the "one AI predicts all" paradigm. Each ophthalmic condition is analyzed by a dedicated disease head with verified dataset provenance.
            Models are labeled honestly according to their validated deployment status: <strong>RESEARCH</strong>, <strong>EXPERIMENTAL</strong>, <strong>VALIDATED-INTERNAL</strong>, <strong>VALIDATED-EXTERNAL</strong>, or <strong>PRODUCTION-CANDIDATE</strong>.
            Research models are explicitly flagged as decision-support tools requiring mandatory specialist oversight.
          </p>
        </div>

        {/* Model Registry Cards Grid */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading Model Registry...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredModels.map((m) => (
              <div key={m.model_id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">{m.specialty}</span>
                      <h3 className="text-base font-bold text-slate-900">{m.disease_name}</h3>
                      <span className="font-mono text-[11px] text-slate-500">{m.model_id} (v{m.model_version})</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getStatusBadge(m.status)}`}>
                      {m.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 my-3">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase block">Modality</span>
                      <span className="font-semibold text-slate-800">{m.modality}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase block">Architecture</span>
                      <span className="font-semibold text-slate-800 truncate block">{m.architecture}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase block">Shared Backbone</span>
                      <span className="font-semibold text-slate-800 truncate block">{m.backbone || 'Custom'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase block">License</span>
                      <span className="font-semibold text-slate-800">{m.license}</span>
                    </div>
                  </div>

                  {/* Metrics Strip */}
                  <div className="mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Validation Metrics</span>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {m.metrics?.auroc && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px] text-slate-700">
                          AUROC: <strong>{(m.metrics.auroc * 100).toFixed(1)}%</strong>
                        </span>
                      )}
                      {m.metrics?.sensitivity && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px] text-slate-700">
                          Sens: <strong>{(m.metrics.sensitivity * 100).toFixed(1)}%</strong>
                        </span>
                      )}
                      {m.metrics?.specificity && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px] text-slate-700">
                          Spec: <strong>{(m.metrics.specificity * 100).toFixed(1)}%</strong>
                        </span>
                      )}
                      {m.metrics?.f1_score && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px] text-slate-700">
                          F1: <strong>{(m.metrics.f1_score * 100).toFixed(1)}%</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-2">
                    <strong>Intended Use:</strong> {m.intended_use}
                  </p>
                  <p className="text-[11px] text-slate-500 italic">
                    <strong>Known Limitations:</strong> {m.limitations}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Dataset: {m.dataset}</span>
                  {m.repository.startsWith('http') ? (
                    <a
                      href={m.repository}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 text-[11px]"
                    >
                      Repository <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-500 font-mono text-[11px]">{m.repository}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ModelRegistryView;
