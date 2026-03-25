import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import useAuthStore from '../context/authStore';
import {
  Card, Button, Badge, Loading, Alert, ScoreRing, EmptyState, Modal
} from '../components/Common';
import {
  Briefcase, Users, BarChart3, Sparkles, PlusCircle, Clock,
  ArrowRight, TrendingUp, CheckCircle, XCircle, FileText,
  ChevronRight, ChevronDown, Filter, Zap, LayoutDashboard,
  Activity, Target, MapPin, BrainCircuit, Loader2, AlertTriangle,
  ChevronLeft, MessageSquare, Send, X, ExternalLink, Award, FileJson
} from 'lucide-react';

/* ─── Animated Counter ─── */
const AnimatedCounter = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const num = typeof value === 'number' ? value : parseInt(value) || 0;
    if (num === 0) { setCount(0); return; }
    let start = 0;
    const step = Math.max(1, Math.ceil(num / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= num) { setCount(num); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{count}</>;
};

/* ─── Blue Stat Card ─── */
const StatCard = ({ label, value, icon: Icon, trend, delay = 0, isFirst }) => (
  <div
    className={`relative overflow-hidden rounded-2xl p-5 group cursor-default transition-all duration-400 ease-out hover:scale-[1.03] hover:-translate-y-2
      ${isFirst 
        ? 'bg-blue-600 shadow-[0_12px_40px_rgba(59,130,246,0.35)] border border-blue-500 text-white' 
        : 'blue-stat-card text-slate-800'
      }`}
    style={{ animation: `slideIn 0.5s ease-out ${delay}ms both` }}
  >
    <div className={`absolute -top-5 -right-5 w-24 h-24 rounded-full transition-all duration-500 ${
      isFirst ? 'bg-white/10 group-hover:bg-white/20' : 'bg-blue-50 group-hover:bg-blue-100/80'
    }`} />
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-xl border ${
          isFirst ? 'bg-white/20 border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]' : 'bg-blue-50 border-blue-100'
        }`}>
          <Icon size={20} className={isFirst ? "text-white" : "text-blue-600"} />
        </div>
        {trend !== undefined && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isFirst 
              ? trend > 0 ? 'bg-emerald-400/20 text-emerald-100 border-white/20' : 'bg-rose-400/20 text-rose-100 border-white/20'
              : trend > 0 ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-500 border-red-100'
          }`}>
            {trend > 0 ? '↑' : '↓'}{Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className={`text-xs font-semibold mb-0.5 tracking-wide ${isFirst ? "text-blue-100" : "text-slate-500"}`}>{label}</p>
      <h3 className={`text-2xl font-black tracking-tight ${isFirst ? "text-white" : "text-slate-800"}`}>
        <AnimatedCounter value={typeof value === 'number' ? value : parseInt(value) || 0} />
      </h3>
    </div>
  </div>
);

    /* ─── Resume Viewer + Chat Bot Panel ─── */
    const ResumeViewerPanel = ({candidate, onClose}) => {
  const [chatOpen, setChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef(null);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

    const rawUrl = candidate.resume_url || '';
    const downloadUrl = rawUrl.replace('/upload/', '/upload/fl_attachment/');

  const sendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    const newMsgs = [...chatMessages, {role: 'user', content: msg }];
    setChatMessages(newMsgs);
    setChatLoading(true);
    try {
      const res = await apiClient.post('/recruiter/chat', {
      application_id: candidate._id,
    message: msg,
    history: newMsgs.slice(-10)
      });
    setChatMessages([...newMsgs, {role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      setChatMessages([...newMsgs, { role: 'assistant', content: 'Sorry, I could not process your question. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

    return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 bg-slate-900/80 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div className="w-full h-full max-w-[1400px] flex bg-white rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Resume viewer — main area */}
        <div className={`flex-1 flex flex-col min-w-0 bg-white ${chatOpen ? 'border-r border-slate-200' : ''}`} style={{ animation: 'slideInFromLeft 0.3s ease-out' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {candidate.candidate_name?.charAt(0) || 'C'}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">{candidate.candidate_name || 'Candidate'}</h3>
                <p className="text-[10px] text-slate-400">{candidate.candidate_email} · Score: {candidate.match_score || 0}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {rawUrl && (
                <>
                  <button
                    onClick={() => window.open(rawUrl, '_blank')}
                    className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 text-xs hover:bg-slate-50 transition-colors bg-white font-medium"
                  >
                    View Resume
                  </button>
                  <button
                    onClick={() => window.open(downloadUrl, '_blank')}
                    className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 text-xs hover:bg-slate-50 transition-colors bg-white font-medium"
                  >
                    Download Resume
                  </button>
                </>
              )}
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${chatOpen ? 'bg-blue-600 text-white border-transparent' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-transparent'
                  }`}
              >
                <MessageSquare size={14} /> Ask AI About Resume
              </button>
              <button onClick={onClose} className="p-1.5 ml-2 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* PDF viewer */}
          <div className="flex-1 overflow-auto bg-slate-100 p-4 lg:p-6 flex flex-col items-center">
            {rawUrl ? (
              <div className="w-full max-w-4xl flex flex-col items-center">
                {/* Fallback Error Message */}
                <div className="w-full bg-red-50/50 border border-red-100 text-red-800 text-xs px-4 py-3 rounded mb-4 flex items-center justify-between shadow-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <AlertTriangle size={14} className="text-red-500 shrink-0" />
                    Unable to preview resume? Click below to open in new tab.
                  </span>
                  <button onClick={() => window.open(rawUrl, '_blank')} className="px-3 py-1.5 bg-white hover:bg-red-50 border border-red-200 rounded font-semibold transition-colors shrink-0 ml-4">
                    Open in New Tab
                  </button>
                </div>
                <div className="w-full bg-white shadow-lg overflow-hidden border border-slate-200 rounded">
                  <iframe
                    src={rawUrl}
                    width="100%"
                    height="600px"
                    title="Resume Viewer"
                    className="border-none"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <FileText size={48} className="mx-auto mb-3 text-slate-300" />
                  <p className="font-semibold">No resume file available</p>
                  <p className="text-xs mt-1">Resume text may still be available for AI analysis</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat sidebar */}
        {chatOpen && (
          <div className="w-[380px] flex flex-col bg-white border-l border-slate-200 shadow-xl" style={{ animation: 'slideIn 0.3s ease-out' }}>
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <BrainCircuit size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Recruiter AI Assistant</h4>
                  <p className="text-[10px] text-white/70">Ask anything about this candidate's resume</p>
                </div>
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {chatMessages.length === 0 && (
                <div className="text-center py-10">
                  <BrainCircuit size={32} className="mx-auto mb-3 text-blue-600/30" />
                  <p className="text-sm font-semibold text-slate-500 mb-1">Ask me anything!</p>
                  <p className="text-xs text-slate-400 max-w-[250px] mx-auto">
                    I can answer questions about {candidate.candidate_name}'s resume, skills, experience, and fit for the role.
                  </p>
                  <div className="mt-4 space-y-2">
                    {['What are their top strengths?', 'Any red flags in their resume?', 'What interview questions should I ask?'].map(q => (
                      <button
                        key={q}
                        onClick={() => { setChatInput(q); }}
                        className="block w-full text-left px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-600 hover:border-blue-600/30 hover:text-blue-600 transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm'
                    }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <div className="p-3 border-t border-slate-200 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask about this candidate..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                />
                <button
                  onClick={sendMessage}
                  disabled={!chatInput.trim() || chatLoading}
                  className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-indigo-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-600/20"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    );
};

    /* ─── Candidate Mini-Row ─── */
    const CandidateMiniRow = ({c, index, onDecision, processingId, onViewResume}) => {
  const scoreColor = c.match_score > 70 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : c.match_score > 40 ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-amber-600 bg-amber-50 border-amber-200';
  const barColor = c.match_score > 70 ? 'bg-emerald-500' : c.match_score > 40 ? 'bg-blue-500' : 'bg-amber-500';

    return (
    <div
      onClick={() => c.resume_url && onViewResume(c)}
      className={`flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/80 transition-all group border-b border-slate-50 last:border-none ${c.resume_url ? 'cursor-pointer' : ''}`}
      style={{ animation: `fadeIn 0.3s ease-out ${index * 40}ms both` }}
    >
      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 shrink-0">
        {index + 1}
      </div>
      <div className="flex items-center gap-2.5 min-w-[160px]">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
          {c.candidate_name?.charAt(0) || 'C'}
        </div>
        <div className="overflow-hidden">
          <p className="font-semibold text-slate-800 text-sm truncate">{c.candidate_name || 'Anonymous'}</p>
          <p className="text-[10px] text-slate-400 truncate">{c.candidate_email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 min-w-[100px]">
        <div className="flex-1 max-w-[60px] bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${c.match_score || 0}%` }} />
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${scoreColor}`}>{c.match_score || 0}%</span>
      </div>
      <div className="min-w-[90px] hidden lg:block">
        {c.recommendation ? (
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 truncate block max-w-[110px]">{c.recommendation}</span>
        ) : <span className="text-[10px] text-slate-300">—</span>}
      </div>
      <div className="flex gap-1 flex-wrap max-w-[130px] hidden xl:flex">
        {(c.matched_skills || c.matching_skills)?.slice(0, 2).map(s => (
          <span key={s} className="px-1.5 py-0.5 bg-blue-50 text-[9px] text-blue-700 font-semibold rounded border border-blue-100 truncate max-w-[65px]">{s}</span>
        ))}
        {(c.matched_skills || c.matching_skills)?.length > 2 && <span className="text-[9px] text-slate-400 font-bold">+{(c.matched_skills || c.matching_skills).length - 2}</span>}
      </div>
      <div className="min-w-[75px]">
        <Badge variant={c.decision === 'shortlisted' ? 'success' : c.decision === 'rejected' ? 'danger' : c.decision === 'hired' ? 'success' : c.status === 'processed' ? 'primary' : 'warning'} size="sm">
          {c.decision || (c.status === 'processed' ? 'Reviewed' : c.status || 'Pending')}
        </Badge>
      </div>
      <div className="flex items-center gap-1.5 ml-auto shrink-0">
        {c.resume_url && (
          <button
            onClick={(e) => { e.stopPropagation(); onViewResume(c); }}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-600/30 transition-all"
            title="View Resume & Ask AI"
          >
            <FileText size={13} />
          </button>
        )}
        {!c.decision && c.status === 'processed' && (
          <>
            <button onClick={(e) => { e.stopPropagation(); onDecision(c._id, 'shortlisted'); }} disabled={processingId === c._id}
              className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-all disabled:opacity-50" title="Shortlist">
              {processingId === c._id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDecision(c._id, 'rejected'); }} disabled={processingId === c._id}
              className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-500 hover:bg-rose-100 transition-all disabled:opacity-50" title="Reject">
              <XCircle size={13} />
            </button>
          </>
        )}
      </div>
    </div>
    );
};

    /* ─── Expandable Job Card ─── */
    const JobCard = ({job, index, onDecision, processingId, navigate, onViewResume}) => {
  const [expanded, setExpanded] = useState(false);
    const apps = job.applications || [];
  const shortlisted = apps.filter(a => a.decision === 'shortlisted');
  const rejected = apps.filter(a => a.decision === 'rejected');
  const sortedApps = [...apps].sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
  const topScore = sortedApps.length > 0 ? sortedApps[0]?.match_score || 0 : 0;

    return (
    <div className="glass-card-static overflow-hidden shadow-sm hover:shadow-md transition-all" style={{ animation: `slideIn 0.4s ease-out ${index * 60}ms both` }}>
      <div className="flex items-center justify-between px-6 py-4 cursor-pointer group" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <Briefcase size={18} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{job.job_title}</h4>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
              {job.company_name && <span>{job.company_name}</span>}
              {job.location && <span className="flex items-center gap-1"><MapPin size={10} />{job.location}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3">
            <div className="text-center"><p className="text-lg font-black text-slate-800">{apps.length}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total</p></div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="text-center"><p className="text-lg font-black text-emerald-600">{shortlisted.length}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Short</p></div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="text-center"><p className="text-lg font-black text-rose-500">{rejected.length}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Reject</p></div>
            {topScore > 0 && (<><div className="w-px h-8 bg-slate-100" /><div className="text-center"><p className="text-lg font-black text-indigo-600">{topScore}%</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Top</p></div></>)}
          </div>
          <ChevronDown size={18} className={`text-slate-300 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-200" style={{ animation: 'slideIn 0.3s ease-out' }}>
          <div className="flex items-center justify-between px-6 py-3 bg-slate-50/50 border-b border-slate-200">
            <p className="text-xs text-slate-500 font-medium">{apps.filter(a => a.status === 'processed').length} processed · {apps.filter(a => a.status !== 'processed').length} pending · {shortlisted.length} shortlisted</p>
            <button onClick={() => navigate(`/job/${job._id}/candidates`)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-600/30 transition-all">
              <BrainCircuit size={13} /> Full AI Roster
            </button>
          </div>
          {sortedApps.length > 0 ? (
            <div>
              <div className="flex items-center gap-4 px-5 py-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 bg-white">
                <div className="w-7">#</div><div className="min-w-[160px]">Candidate</div><div className="min-w-[100px]">Score</div>
                <div className="min-w-[90px] hidden lg:block">AI Rec</div><div className="max-w-[130px] hidden xl:block">Skills</div>
                <div className="min-w-[75px]">Status</div><div className="ml-auto">Actions</div>
              </div>
              {sortedApps.map((c, i) => <CandidateMiniRow key={c._id} c={c} index={i} onDecision={onDecision} processingId={processingId} onViewResume={onViewResume} />)}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-slate-400 italic"><Users size={24} className="mx-auto mb-2 text-slate-300" />No applications yet.</div>
          )}
        </div>
      )}
    </div>
    );
};

/* ═══════════════ MAIN ═══════════════ */
export const RecruiterDashboard = () => {
  const navigate = useNavigate();
    const {user} = useAuthStore();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [resumeViewer, setResumeViewer] = useState(null); // candidate object or null
    const [insightsModal, setInsightsModal] = useState({open: false, jobId: null, data: null, loading: false });

  useEffect(() => {fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try { const r = await apiClient.get('/recruiter/dashboard'); setDashboard(r.data); setError(''); }
    catch {setError('Failed to load recruiter data'); }
    finally {setLoading(false); }
  };

  const handleDecision = async (applicationId, decision) => {
    const job = dashboard.jobs.find(j => (j.applications || []).some(a => a._id === applicationId));
    if (!job) return;
    setProcessingId(applicationId);
    try {await apiClient.post(`/recruiter/job/${job._id}/candidate/${applicationId}/decision`, { decision }); setSuccess(`Candidate ${decision}!`); await fetchDashboard(); }
    catch (err) {setError(`Failed: ${err.response?.data?.error || err.message}`); }
    finally {setProcessingId(null); }
  };

  const fetchInsights = async (jobId) => {
      setInsightsModal({ open: true, jobId, data: null, loading: true });
    try { const r = await apiClient.get(`/recruiter/job/${jobId}/ai-insights`); setInsightsModal({open: true, jobId, data: r.data, loading: false }); }
    catch {setInsightsModal({ open: true, jobId, data: { error: 'Failed to load AI insights' }, loading: false }); }
  };

    const domainIcons = {'Machine Learning': Sparkles, 'Data Science': BarChart3, 'Backend': Briefcase, 'Frontend': LayoutDashboard, 'Fullstack': Activity, 'DevOps': Target, 'Mobile': Zap, 'Other': Filter };
    const domainGradients = {
      'Machine Learning': 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      'Data Science':     'linear-gradient(135deg, #60a5fa, #2563eb)',
      'Backend':          'linear-gradient(135deg, #2563eb, #1e40af)',
      'Frontend':         'linear-gradient(135deg, #93c5fd, #3b82f6)',
      'Fullstack':        'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      'DevOps':           'linear-gradient(135deg, #1d4ed8, #1e3a8a)',
      'Mobile':           'linear-gradient(135deg, #60a5fa, #2563eb)',
      'Other':            'linear-gradient(135deg, #94a3b8, #64748b)'
    };

    if (loading) return <div className="flex items-center justify-center min-h-[70vh]"><Loading text="Preparing your dashboard..." /></div>;
    if (error && !dashboard) return (
    <div className="max-w-md mx-auto mt-20"><Alert type="danger" message={error} title="Error" /><Button variant="primary" onClick={fetchDashboard} className="mt-4 w-full justify-center">Retry</Button></div>
    );

    const stats = [
    {label: 'Active Jobs',    value: dashboard?.total_jobs || 0,          icon: Briefcase,   trend: 12},
    {label: 'Applications',   value: dashboard?.total_applications || 0,   icon: Users,       trend: 8 },
    {label: 'Processed',      value: dashboard?.total_processed || 0,      icon: CheckCircle, trend: 24},
    {label: 'Pending',        value: dashboard?.total_pending || 0,         icon: Clock,       trend: -5},
    ];

    const domains = dashboard?.domains || { };
  const filteredJobs = selectedDomain ? (dashboard?.jobs || []).filter(j => j.domain === selectedDomain) : [];

    /* ═══════ DOMAIN-FIRST VIEW (no domain selected) ═══════ */
    if (!selectedDomain) {
    return (
    <div className="space-y-8">
      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Welcome */}
      <div className="flex justify-between items-start" style={{ animation: 'slideIn 0.4s ease-out' }}>
        <div>
          <span className="text-xs text-slate-400 font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1" style={{ marginBottom: '0.15rem' }}>
            Welcome, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{user?.name?.split(' ')[0] || 'Recruiter'}</span> 👋
          </h1>
          <p className="text-slate-500 text-sm">Your hiring pipeline at a glance.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" onClick={() => navigate('/bulk-upload')} icon={FileJson}
            className="rounded-xl border-blue-600/30 text-blue-600 hover:bg-blue-600/5 px-4">
            Upload JSON
          </Button>
          <Button variant="primary" onClick={() => navigate('/post-job')} icon={PlusCircle}
            className="rounded-xl shadow-lg shadow-blue-600/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-indigo-600 hover:to-[#004d40] border-none px-6">
            Post New Job
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => <StatCard key={s.label} {...s} delay={i * 80} isFirst={i === 0} />)}
      </div>

      {/* Domain Cards */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-blue-600/10 flex items-center justify-center"><TrendingUp size={15} className="text-blue-600" /></div>
          Domains ({Object.keys(domains).length})
        </h2>
        {Object.keys(domains).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Object.entries(domains).map(([name, data], idx) => {
              const Icon = domainIcons[name] || Filter;
              const gradient = domainGradients[name] || domainGradients['Other'];
              return (
                <div
                  key={name}
                  onClick={() => setSelectedDomain(name)}
                  className="group glass-card-static p-6 cursor-pointer relative overflow-hidden"
                  style={{ animation: `slideIn 0.5s ease-out ${idx * 100}ms both` }}
                >
                  {/* Blue accent bar on top */}
                  <div className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(90deg, #3b82f6, #6366f1)' }} />
                  <div className="flex justify-between items-start mb-5">
                    <div className="p-3 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: gradient }}><Icon size={22} /></div>
                    <ChevronRight className="text-slate-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{name}</h3>
                  <p className="text-slate-400 text-xs font-medium mb-5">{data.jobs_count} position{data.jobs_count !== 1 ? 's' : ''} · avg {data.avg_score}% score</p>
                  <div className="flex items-center justify-between pt-5 border-t border-slate-100/80">
                    <div><p className="text-2xl font-black text-slate-800">{data.total_applications}</p><p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Apps</p></div>
                    <div className="text-right"><p className="text-2xl font-black text-blue-600">{data.shortlisted}</p><p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Shortlisted</p></div>
                    <div className="text-right"><p className="text-2xl font-black text-blue-400">{data.rejected}</p><p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Rejected</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={Briefcase} title="No jobs posted yet" description="Post a new job to start receiving candidates." action={<Button variant="primary" onClick={() => navigate('/post-job')} icon={PlusCircle}>Post Job</Button>} />
        )}
      </div>

      {resumeViewer && <ResumeViewerPanel candidate={resumeViewer} onClose={() => setResumeViewer(null)} />}
    </div>
    );
  }

    /* ═══════ DOMAIN SELECTED: Show jobs ═══════ */
    const domData = domains[selectedDomain] || { };
    return (
    <div className="space-y-6">
      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Back + Header */}
      <div>
        <button onClick={() => setSelectedDomain(null)} className="group flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors mb-3">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">All Domains</span>
        </button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ background: domainGradients[selectedDomain] || domainGradients['Other'] }}>
            {React.createElement(domainIcons[selectedDomain] || Filter, { size: 24 })}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">{selectedDomain} <Badge variant="primary" size="sm">{domData.total_applications || 0} apps</Badge></h1>
            <p className="text-slate-500 text-sm">{domData.jobs_count || 0} positions · avg {domData.avg_score || 0}% match</p>
          </div>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Applications" value={domData.total_applications || 0} icon={Users}        delay={0}   isFirst={true} />
        <StatCard label="Shortlisted"  value={domData.shortlisted || 0}          icon={CheckCircle} delay={80}  />
        <StatCard label="Rejected"     value={domData.rejected || 0}             icon={XCircle}     delay={160} />
        <StatCard label="Avg Score"    value={domData.avg_score || 0}            icon={Target}      delay={240} />
      </div>

      {/* Jobs */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Briefcase size={16} className="text-blue-600" />
          Jobs in {selectedDomain} ({filteredJobs.length})
        </h2>
      </div>

      {filteredJobs.length > 0 ? (
        <div className="space-y-4">
          {filteredJobs.map((job, i) => (
            <JobCard key={job._id} job={job} index={i} onDecision={handleDecision} processingId={processingId} navigate={navigate} onViewResume={(c) => setResumeViewer(c)} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Briefcase} title={`No jobs in ${selectedDomain}`} description="Post a new job in this domain." />
      )}

      {/* AI Insights sidebar for this domain */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2" />
        <div className="space-y-5">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-2xl p-5 text-slate-800 dark:text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-blue-600/10 rounded-full -mr-14 -mt-14 blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30"><Zap size={18} className="text-white" /></div>
                <div><h3 className="font-bold text-xs text-slate-800 dark:text-white">AI Insights</h3><p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{selectedDomain}</p></div>
              </div>
              <div className="space-y-2.5">
                {filteredJobs.slice(0, 5).map(job => (
                  <button key={job._id} onClick={() => fetchInsights(job._id)} className="w-full flex justify-between items-center py-1.5 group/item">
                    <span className="text-[10px] font-semibold text-slate-500 group-hover/item:text-blue-600 dark:group-hover/item:text-white transition-colors truncate pr-2">{job.job_title}</span>
                    <ArrowRight size={11} className="text-slate-400 dark:text-slate-700 group-hover/item:text-blue-600 dark:group-hover/item:translate-x-1 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resume Viewer Overlay */}
      {resumeViewer && <ResumeViewerPanel candidate={resumeViewer} onClose={() => setResumeViewer(null)} />}

      {/* Insights Modal */}
      <Modal isOpen={insightsModal.open} title="AI Insights" onClose={() => setInsightsModal({ open: false, jobId: null, data: null, loading: false })} size="lg" icon={Zap}>
        {insightsModal.loading ? <Loading text="Generating AI insights..." /> : insightsModal.data?.error ? <Alert type="danger" message={insightsModal.data.error} /> : insightsModal.data ? (
          <div className="space-y-4">
            {insightsModal.data.summary && (<div className="p-4 bg-blue-50 border border-blue-100 rounded-xl"><h4 className="font-bold text-blue-900 text-sm mb-2">Executive Summary</h4><p className="text-sm text-blue-800 leading-relaxed">{insightsModal.data.summary}</p></div>)}
            {insightsModal.data.top_candidates && (<div><h4 className="font-bold text-sm text-slate-700 mb-2">Top Candidates</h4><div className="space-y-2">{insightsModal.data.top_candidates.map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">{i + 1}</div><div className="flex-1"><p className="text-sm font-semibold text-slate-800">{c.name || c.candidate_name}</p><p className="text-xs text-slate-400">{c.recommendation || ''}</p></div><span className="text-sm font-bold text-blue-600">{c.score || c.match_score}%</span></div>
            ))}</div></div>)}
            {!insightsModal.data.summary && !insightsModal.data.top_candidates && (<div className="bg-slate-50 rounded-xl p-4 border border-slate-200"><pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap">{JSON.stringify(insightsModal.data, null, 2)}</pre></div>)}
          </div>
        ) : <p className="text-slate-500 text-sm">No insights available.</p>}
      </Modal>
    </div>
    );
};
