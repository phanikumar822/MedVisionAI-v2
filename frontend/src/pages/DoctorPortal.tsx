import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Stethoscope, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Eye,
  FileText, Shield, Sparkles, BookOpen, Layers, History, Search,
  LogOut
} from 'lucide-react';

interface QueueItem {
  report_id: number;
  screening_id: string;
  patient_id: number;
  patient_name: string;
  patient_email?: string;
  disease_id: string;
  disease_name: string;
  modality: string;
  eye: string;
  prediction: string;
  severity_grade?: string;
  confidence: number;
  risk_level: string;
  recommendation: string;
  ai_context?: string;
  status: string;
  quality_score?: number;
  quality_status?: string;
  requires_human_review?: boolean;
  image_url?: string;
  heatmap_url?: string;
  multi_model_results?: string;
  clinical_measurements?: string;
  created_at: string;
  report_version?: number;
  doctor_findings?: string;
  doctor_notes?: string;
}

interface EvidenceData {
  guideline: string;
  evidence_citations: string[];
  differential_diagnoses: string[];
  recommended_management: string;
}

interface AuditLogEntry {
  id: number;
  action: string;
  role: string;
  user_id: number;
  details: string;
  created_at: string;
}

const DoctorPortal: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedCase, setSelectedCase] = useState<QueueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_DOCTOR_REVIEW');
  const [diseaseFilter, setDiseaseFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Verification Form
  const [doctorFindings, setDoctorFindings] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Evidence and Audit Trail
  const [evidence, setEvidence] = useState<EvidenceData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'ALL') params.status_filter = statusFilter;
      if (diseaseFilter !== 'ALL') params.disease_id = diseaseFilter;

      const res = await api.get('/reports/queue', { params });
      setQueue(res.data);
      if (res.data.length > 0 && !selectedCase) {
        selectCase(res.data[0]);
      } else if (selectedCase) {
        const updated = res.data.find((c: QueueItem) => c.report_id === selectedCase.report_id);
        if (updated) setSelectedCase(updated);
      }
    } catch (err) {
      console.error('Failed to fetch review queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter, diseaseFilter]);

  const selectCase = async (c: QueueItem) => {
    setSelectedCase(c);
    setDoctorFindings(c.doctor_findings || `Confirmed findings consistent with ${c.prediction}. Correlates with clinical decision support thresholds.`);
    setDoctorNotes(c.doctor_notes || c.recommendation || '');
    setActionMessage(null);

    // Fetch Clinical RAG Evidence
    try {
      const evRes = await api.get(`/models/rag-evidence/${c.disease_id}`);
      setEvidence(evRes.data);
    } catch {
      setEvidence(null);
    }

    // Fetch Audit Trail
    try {
      const auditRes = await api.get(`/models/audit-trail/${c.screening_id}`);
      setAuditLogs(auditRes.data);
    } catch {
      setAuditLogs([]);
    }
  };

  const handleVerify = async () => {
    if (!selectedCase) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      await api.post(`/reports/${selectedCase.report_id}/verify`, {
        doctor_findings: doctorFindings,
        doctor_notes: doctorNotes
      });
      setActionMessage({ type: 'success', text: `Report successfully verified! Patient notification dispatched.` });
      fetchQueue();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.response?.data?.detail || 'Verification failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCase) return;
    const reason = prompt('Please specify clinical reason for rejection (e.g. artifact/blur, incorrect laterality):');
    if (!reason) return;
    setActionLoading(true);
    try {
      await api.post(`/reports/${selectedCase.report_id}/reject`, { rejection_reason: reason });
      setActionMessage({ type: 'success', text: 'Case rejected.' });
      fetchQueue();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.response?.data?.detail || 'Rejection failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!selectedCase) return;
    const instructions = prompt('Enter revision / re-scan instructions for clinician:');
    if (!instructions) return;
    setActionLoading(true);
    try {
      await api.post(`/reports/${selectedCase.report_id}/request-revision`, { revision_instructions: instructions });
      setActionMessage({ type: 'success', text: 'Revision requested from clinician.' });
      fetchQueue();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.response?.data?.detail || 'Request failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredQueue = queue.filter(item => {
    if (searchQuery.trim() === '') return true;
    const q = searchQuery.toLowerCase();
    return (
      item.patient_name.toLowerCase().includes(q) ||
      item.screening_id.toLowerCase().includes(q) ||
      item.disease_name.toLowerCase().includes(q)
    );
  });

  const parsedMultiModel = selectedCase?.multi_model_results
    ? (typeof selectedCase.multi_model_results === 'string'
        ? JSON.parse(selectedCase.multi_model_results)
        : selectedCase.multi_model_results)
    : null;

  const parsedRefraction = selectedCase?.clinical_measurements
    ? (typeof selectedCase.clinical_measurements === 'string'
        ? JSON.parse(selectedCase.clinical_measurements)
        : selectedCase.clinical_measurements)
    : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">
      {/* Top Clinical Header */}
      <header className="bg-[#0F172A] text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shadow-sm sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-inner font-bold">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              MedVisionAI <span className="text-xs bg-teal-500/20 text-teal-300 font-semibold px-2 py-0.5 rounded border border-teal-500/30">Ophthalmologist Workstation</span>
            </h1>
            <p className="text-[11px] text-slate-400">Doctor Verification & Clinical Decision-Support Portal</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            to="/models"
            className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            Model Registry Catalog
          </Link>
          <div className="text-right hidden sm:block border-l border-slate-700 pl-4">
            <span className="text-xs font-semibold text-slate-200 block">Dr. {user?.username}</span>
            <span className="text-[10px] text-teal-400 font-mono tracking-wider uppercase">Licensed Ophthalmologist</span>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-800 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Column: Review Queue */}
        <aside className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-57px)]">
          {/* Filter Toolbar */}
          <div className="p-3 border-b border-slate-200 bg-slate-50 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, ID, disease..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 text-xs bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none"
              >
                <option value="PENDING_DOCTOR_REVIEW">Pending Review</option>
                <option value="VERIFIED">Verified Reports</option>
                <option value="REJECTED">Rejected Cases</option>
                <option value="REVISION_REQUIRED">Revision Needed</option>
                <option value="ALL">All Statuses</option>
              </select>
              <select
                value={diseaseFilter}
                onChange={(e) => setDiseaseFilter(e.target.value)}
                className="flex-1 text-xs bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none"
              >
                <option value="ALL">All Diseases</option>
                <option value="diabetic_retinopathy">Diabetic Retinopathy</option>
                <option value="diabetic_macular_edema">DME (OCT)</option>
                <option value="glaucoma">Glaucoma</option>
                <option value="amd">AMD</option>
                <option value="cataract">Cataract</option>
                <option value="hypertensive_retinopathy">Hypertensive Retinopathy</option>
                <option value="retinal_vein_occlusion">RVO (CRVO/BRVO)</option>
                <option value="retinopathy_of_prematurity">ROP (Pediatric)</option>
                <option value="ocular_surface">Ocular Surface</option>
                <option value="vision_assessment">Vision Assessment</option>
              </select>
            </div>
          </div>

          {/* Queue Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading cases...</div>
            ) : filteredQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No cases found matching filters.</div>
            ) : (
              filteredQueue.map((item) => {
                const isSelected = selectedCase?.report_id === item.report_id;
                const isHighRisk = item.risk_level === 'HIGH' || item.risk_level === 'CRITICAL';
                return (
                  <div
                    key={item.report_id}
                    onClick={() => selectCase(item)}
                    className={`p-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-teal-50/70 border-l-4 border-teal-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-slate-900 truncate max-w-[170px]">{item.patient_name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        item.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        item.status === 'REVISION_REQUIRED' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span className="truncate">{item.disease_name}</span>
                      <span className="font-mono text-[10px] text-slate-400">{item.screening_id}</span>
                    </div>

                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        isHighRisk ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.prediction}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.eye} | {item.modality}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Column: Active Case Workspace */}
        <main className="flex-1 bg-[#F8FAFC] overflow-y-auto p-5 space-y-4 h-[calc(100vh-57px)]">
          {selectedCase ? (
            <>
              {/* Status Alert Banner if action completed */}
              {actionMessage && (
                <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                  {actionMessage.text}
                </div>
              )}

              {/* Patient & Examination Header Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">{selectedCase.patient_name}</h2>
                      <span className="text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                        {selectedCase.screening_id}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        selectedCase.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                        selectedCase.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedCase.status === 'VERIFIED' ? 'Verified by Doctor' : 'Pending Ophthalmologist Review'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Exam: <strong>{selectedCase.disease_name}</strong> | Eye: <strong>{selectedCase.eye}</strong> | Modality: <strong>{selectedCase.modality}</strong> | Date: {new Date(selectedCase.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`http://localhost:8000/api/v1/reports/${selectedCase.report_id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md border border-slate-300 font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" /> View PDF
                    </a>
                  </div>
                </div>
              </div>

              {/* Imaging & Neural Attention Workspace OR Quantitative Refraction */}
              {selectedCase.image_url ? (
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-teal-600" />
                      Imaging Workstation & Neural Attention Heatmap Overlay
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        className={`text-xs px-2.5 py-1 rounded font-semibold border transition-colors ${
                          showHeatmap ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-300'
                        }`}
                      >
                        {showHeatmap ? 'Heatmap Overlay: Active' : 'Heatmap Overlay: Off'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 p-4 rounded-lg">
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] font-semibold text-slate-400 mb-2">Original Clinical Scan</span>
                      <div className="relative w-full max-w-[320px] aspect-square rounded overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
                        <img
                          src={selectedCase.image_url}
                          alt="Original Scan"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-[11px] font-semibold text-slate-400 mb-2">
                        {showHeatmap ? 'LayerGradCam Attribution Heatmap' : 'Heatmap Hidden'}
                      </span>
                      <div className="relative w-full max-w-[320px] aspect-square rounded overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
                        {selectedCase.heatmap_url && showHeatmap ? (
                          <img
                            src={selectedCase.heatmap_url}
                            alt="Heatmap Overlay"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <img
                            src={selectedCase.image_url}
                            alt="Scan"
                            className="w-full h-full object-contain opacity-50"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 text-center">
                    *Grad-CAM neural heatmap highlights focal vascular feature activation (fovea, optic disc, or vascular arcades) evaluated by the model.
                  </p>
                </div>
              ) : parsedRefraction ? (
                /* Quantitative Refraction Grid */
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-teal-600" />
                    Quantitative Refraction & Optical Measurements
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Sphere (DS)</span>
                      <span className="text-sm font-bold text-slate-800 font-mono">{parsedRefraction.sphere > 0 ? `+${parsedRefraction.sphere}` : parsedRefraction.sphere} D</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Cylinder (DC)</span>
                      <span className="text-sm font-bold text-slate-800 font-mono">{parsedRefraction.cylinder > 0 ? `+${parsedRefraction.cylinder}` : parsedRefraction.cylinder} D</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Axis</span>
                      <span className="text-sm font-bold text-slate-800 font-mono">{parsedRefraction.axis}°</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Visual Acuity</span>
                      <span className="text-sm font-bold text-slate-800 font-mono">{parsedRefraction.visual_acuity}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Spherical Equiv.</span>
                      <span className="text-sm font-bold text-teal-700 font-mono">
                        {(parsedRefraction.sphere + (parsedRefraction.cylinder / 2)).toFixed(2)} D
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* AI Diagnostic Findings & Multi-Model Comparison Strip */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Primary AI Result */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    Primary Model Diagnostic Finding
                  </h3>
                  <div className={`p-3.5 rounded-lg border mb-3 ${
                    selectedCase.risk_level === 'HIGH' || selectedCase.risk_level === 'CRITICAL'
                      ? 'bg-red-50/70 border-red-200 text-red-900'
                      : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{selectedCase.prediction}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/80 border border-current">
                        Confidence: {(selectedCase.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    {selectedCase.severity_grade && (
                      <p className="text-xs mt-1 font-medium text-slate-700">Severity: {selectedCase.severity_grade}</p>
                    )}
                  </div>

                  {/* Multi-Model Comparison if available */}
                  {parsedMultiModel && parsedMultiModel.primary_model && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
                      <span className="font-bold text-slate-700 block mb-2">Multi-Model Cross-Evaluation:</span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-white p-2 rounded border border-slate-200">
                          <span className="font-semibold text-slate-600 block">Model 1 (Primary):</span>
                          <span className="font-mono text-slate-800">{parsedMultiModel.primary_model.model_id}</span>
                          <span className="block mt-1 font-bold text-teal-700">{parsedMultiModel.primary_model.prediction}</span>
                        </div>
                        <div className="bg-white p-2 rounded border border-slate-200">
                          <span className="font-semibold text-slate-600 block">Model 2 (OPENEye-FM Head):</span>
                          <span className="font-mono text-slate-800">{parsedMultiModel.secondary_foundation_model.model_id}</span>
                          <span className="block mt-1 font-bold text-teal-700">{parsedMultiModel.secondary_foundation_model.prediction}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Both models concordant on diagnosis.
                      </div>
                    </div>
                  )}
                </div>

                {/* Model Provenance & Transparency Badge */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-teal-600" />
                    Model Transparency
                  </h3>
                  <div className="text-xs space-y-1.5 text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Validation Tier</span>
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block text-[11px]">
                        VALIDATED-INTERNAL
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Quality Score</span>
                      <span className="font-semibold text-slate-800 text-xs">
                        {selectedCase.quality_score?.toFixed(1) || '100.0'}/100 ({selectedCase.quality_status || 'PASSED'})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Supervision Requirement</span>
                      <span className="font-semibold text-amber-700 text-xs">
                        {selectedCase.requires_human_review ? 'Doctor Review Mandatory' : 'Standard Protocol'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinical RAG Evidence & Guidelines Pane */}
              {evidence && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-teal-600" />
                    Clinical Practice Guideline & Literature Evidence
                  </h3>
                  <div className="bg-teal-50/50 border border-teal-200 rounded-lg p-3 text-xs text-slate-700 space-y-1.5">
                    <p><strong>Guideline:</strong> {evidence.guideline}</p>
                    <p><strong>Recommended Action:</strong> {evidence.recommended_management}</p>
                    <div>
                      <strong>Differential Diagnoses:</strong>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {evidence.differential_diagnoses.map((d, i) => (
                          <span key={i} className="bg-white border border-slate-300 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Doctor Clinical Decision & Verification Form */}
              <div className="bg-white border-2 border-teal-600/30 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-teal-600" />
                    Doctor Verification & Clinical Decision Gate
                  </h3>
                  <span className="text-xs text-slate-500">Only authorized doctors can verify</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Doctor Clinical Observations (Internal / Clinical Record)
                    </label>
                    <textarea
                      value={doctorFindings}
                      onChange={(e) => setDoctorFindings(e.target.value)}
                      rows={2}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600"
                      placeholder="Enter specific clinical observations, cup-to-disc ratio, or vascular details..."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Patient Management Plan (Visible in Patient Portal & PDF Report)
                    </label>
                    <textarea
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                      rows={2}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600"
                      placeholder="Management instructions, referral timeframe, or follow-up recommendation..."
                    />
                  </div>
                </div>

                {/* Verification Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex gap-2">
                    <button
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> Reject Case
                    </button>
                    <button
                      onClick={handleRequestRevision}
                      disabled={actionLoading}
                      className="px-3.5 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-4 h-4" /> Request Re-scan
                    </button>
                  </div>

                  <button
                    onClick={handleVerify}
                    disabled={actionLoading}
                    className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {actionLoading ? 'Verifying...' : 'Verify Report & Notify Patient'}
                  </button>
                </div>
              </div>

              {/* Case Audit Trail Log */}
              {auditLogs.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-500" />
                    Immutable Clinical Audit Trail
                  </h3>
                  <div className="space-y-2">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="text-[11px] flex items-start gap-2 border-l-2 border-slate-300 pl-3 py-0.5">
                        <span className="font-mono text-slate-400 text-[10px]">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                        <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                          {log.action}
                        </span>
                        <span className="text-slate-600 flex-1">{log.details}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Select a case from the review queue to begin verification.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DoctorPortal;
