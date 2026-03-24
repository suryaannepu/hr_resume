import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import useAuthStore from '../context/authStore';
import {
  Upload, FileJson, CheckCircle, XCircle, AlertTriangle,
  Loader2, Edit2, Trash2, ChevronDown, ChevronUp, Eye,
  Briefcase, MapPin, Clock, Users, Zap, Send, X, Plus,
  BarChart3, TrendingUp, Tag, Globe, Info
} from 'lucide-react';

/* ── Toast Notification ── */
const Toast = ({ toasts }) => (
  <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => (
      <div
        key={t.id}
        className={`px-4 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-2 pointer-events-auto transition-all duration-300 ${
          t.type === 'success' ? 'bg-emerald-600 text-white' :
          t.type === 'error' ? 'bg-rose-600 text-white' :
          'bg-slate-800 text-white'
        }`}
        style={{ animation: 'slideIn 0.3s ease-out' }}
      >
        {t.type === 'success' ? <CheckCircle size={16} /> : t.type === 'error' ? <XCircle size={16} /> : <Info size={16} />}
        {t.message}
      </div>
    ))}
  </div>
);

/* ── Job Type Badge ── */
const TypeBadge = ({ value, type }) => {
  const colors = {
    Remote: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Hybrid: 'bg-blue-50 text-blue-700 border-blue-200',
    Onsite: 'bg-slate-100 text-slate-700 border-slate-200',
    'Full-time': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Internship: 'bg-amber-50 text-amber-700 border-amber-200',
    Contract: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  const cls = colors[value] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${cls}`}>
      {value}
    </span>
  );
};

/* ── Edit Job Modal ── */
const EditJobModal = ({ job, index, onSave, onClose }) => {
  const [form, setForm] = useState({
    job_title: job.job_title || '',
    company_name: job.company_name || '',
    location: job.location || '',
    job_type: job.job_type || 'Onsite',
    employment_type: job.employment_type || 'Full-time',
    domain: job.domain || 'Other',
    experience_required: job.experience_required || '',
    salary_range: job.salary_range || '',
    deadline: job.deadline || '',
    description: job.description || '',
    required_skills: (job.required_skills || []).join(', '),
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    const skills = form.required_skills
      ? form.required_skills.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    onSave(index, { ...job, ...form, required_skills: skills });
    onClose();
  };

  const inputCls = "w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/10";
  const labelCls = "block text-xs font-semibold text-slate-600 mb-1";

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#009688]/10 flex items-center justify-center">
              <Edit2 size={16} className="text-[#009688]" />
            </div>
            <h3 className="font-bold text-slate-800">Edit Job #{index + 1}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Job Title *</label>
              <input className={inputCls} value={form.job_title} onChange={e => update('job_title', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Company Name</label>
              <input className={inputCls} value={form.company_name} onChange={e => update('company_name', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input className={inputCls} value={form.location} onChange={e => update('location', e.target.value)} placeholder="e.g. Bangalore, India" />
            </div>
            <div>
              <label className={labelCls}>Job Type</label>
              <select className={inputCls} value={form.job_type} onChange={e => update('job_type', e.target.value)}>
                {['Remote', 'Hybrid', 'Onsite'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Employment Type</label>
              <select className={inputCls} value={form.employment_type} onChange={e => update('employment_type', e.target.value)}>
                {['Full-time', 'Part-time', 'Internship', 'Contract'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Domain</label>
              <select className={inputCls} value={form.domain} onChange={e => update('domain', e.target.value)}>
                {['AI/ML', 'Data Science', 'Web Development', 'Mobile Development', 'DevOps', 'Cybersecurity', 'Blockchain', 'Other'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Experience Required</label>
              <input className={inputCls} value={form.experience_required} onChange={e => update('experience_required', e.target.value)} placeholder="e.g. 2+ years" />
            </div>
            <div>
              <label className={labelCls}>Salary Range</label>
              <input className={inputCls} value={form.salary_range} onChange={e => update('salary_range', e.target.value)} placeholder="e.g. ₹6-10 LPA" />
            </div>
            <div>
              <label className={labelCls}>Deadline</label>
              <input className={inputCls} type="date" value={form.deadline} onChange={e => update('deadline', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Required Skills (comma-separated)</label>
            <input className={inputCls} value={form.required_skills} onChange={e => update('required_skills', e.target.value)} placeholder="Python, React, SQL..." />
          </div>
          <div>
            <label className={labelCls}>Job Description *</label>
            <textarea className={`${inputCls} min-h-[120px] resize-y`} value={form.description} onChange={e => update('description', e.target.value)} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-white transition-colors">Cancel</button>
          <button onClick={handleSave} className="flex-1 px-4 py-2 rounded-xl bg-[#009688] text-white text-sm font-bold hover:bg-[#00796b] transition-colors">Save Changes</button>
        </div>
      </div>
    </div>
  );
};

/* ── Job Preview Card ── */
const JobPreviewCard = ({ job, index, selected, onToggle, onEdit, onDelete, postStatus }) => {
  const [expanded, setExpanded] = useState(false);

  const statusColors = {
    success: 'bg-emerald-50 border-emerald-200',
    failed: 'bg-rose-50 border-rose-200',
    posting: 'bg-blue-50 border-blue-200',
  };

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${
      postStatus?.status === 'success' ? 'border-emerald-200 bg-emerald-50/30' :
      postStatus?.status === 'failed' ? 'border-rose-200 bg-rose-50/30' :
      selected ? 'border-[#009688]/40 bg-[#009688]/5' : 'border-slate-200 bg-white'
    }`} style={{ animation: `fadeIn 0.3s ease-out ${index * 30}ms both` }}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(index)}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
            selected ? 'bg-[#009688] border-[#009688]' : 'border-slate-300 hover:border-[#009688]'
          }`}
        >
          {selected && <CheckCircle size={12} className="text-white" />}
        </button>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800 text-sm truncate">{job.job_title || 'Untitled'}</span>
            {job._is_duplicate && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-0.5">
                <AlertTriangle size={9} /> Possible Duplicate
              </span>
            )}
            {postStatus?.status === 'success' && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-0.5"><CheckCircle size={9} /> Posted</span>}
            {postStatus?.status === 'failed' && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-0.5"><XCircle size={9} /> Failed</span>}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {job.company_name && <span className="text-[11px] text-slate-500">{job.company_name}</span>}
            {job.location && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <MapPin size={10} /> {job.location}
              </span>
            )}
            {job.job_type && <TypeBadge value={job.job_type} />}
            {job.employment_type && <TypeBadge value={job.employment_type} />}
            {job.domain && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                {job.domain}
              </span>
            )}
          </div>
          {/* Skills */}
          {job.required_skills?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {job.required_skills.slice(0, 5).map((s, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-medium">
                  {s}
                </span>
              ))}
              {job.required_skills.length > 5 && (
                <span className="text-[9px] text-slate-400 font-bold">+{job.required_skills.length - 5}</span>
              )}
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 shrink-0">
          {job.experience_required && (
            <div className="flex items-center gap-1">
              <Users size={11} />
              <span>{job.experience_required}</span>
            </div>
          )}
          {job.deadline && (
            <div className="flex items-center gap-1">
              <Clock size={11} />
              <span>{job.deadline}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Toggle details"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={() => onEdit(index)}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(index)}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Expanded description */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50" style={{ animation: 'slideIn 0.2s ease-out' }}>
          <p className="text-xs text-slate-600 leading-relaxed mt-3 line-clamp-5">{job.description}</p>
          {job.salary_range && (
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
              <Tag size={10} /> {job.salary_range}
            </p>
          )}
          {job.resume_template && (
            <div className="mt-2 px-2 py-1 bg-[#009688]/5 border border-[#009688]/20 rounded-lg text-[10px] text-[#009688] font-medium">
              ✓ Resume template included
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ═══════════════ MAIN PAGE ═══════════════ */
export const BulkJobUpload = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const [step, setStep] = useState('upload'); // upload | preview | posting | done
  const [isDragging, setIsDragging] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [warnings, setWarnings] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postResults, setPostResults] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  /* ── Drag & Drop ── */
  const onDragOver = useCallback(e => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback(() => setIsDragging(false), []);
  const onDrop = useCallback(e => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, []);

  const parseFile = async (file) => {
    if (!file.name.endsWith('.json')) {
      addToast('Only .json files are supported', 'error');
      return;
    }
    setParsing(true);
    try {
      // Read the file locally first to show it as FormData
      const text = await file.text();
      const jsonData = JSON.parse(text);
      const rawJobs = Array.isArray(jsonData) ? jsonData : (jsonData.jobs || [jsonData]);
      
      // Send as JSON to parse endpoint
      const res = await apiClient.post('/bulk-upload/parse', { jobs: rawJobs });
      const data = res.data;
      setJobs(data.jobs || []);
      setWarnings(data.warnings || []);
      setDuplicates(data.duplicates || []);
      // Select all by default
      setSelected(new Set(data.jobs.map((_, i) => i)));
      setStep('preview');
      addToast(`Parsed ${data.total_parsed} jobs successfully`, 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to parse file', 'error');
    } finally {
      setParsing(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) parseFile(file);
  };

  /* ── Selection ── */
  const toggleJob = (i) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(jobs.map((_, i) => i)));
  const deselectAll = () => setSelected(new Set());

  /* ── Edit ── */
  const handleEdit = (idx) => setEditIndex(idx);
  const handleSave = (idx, updated) => {
    setJobs(prev => prev.map((j, i) => i === idx ? updated : j));
    addToast('Job updated', 'success');
  };

  /* ── Delete ── */
  const handleDelete = (idx) => {
    setJobs(prev => prev.filter((_, i) => i !== idx));
    setSelected(prev => {
      const next = new Set();
      prev.forEach(i => { if (i < idx) next.add(i); else if (i > idx) next.add(i - 1); });
      return next;
    });
  };

  /* ── Post ── */
  const handlePost = async (postAll = false) => {
    const toPost = postAll
      ? jobs
      : jobs.filter((_, i) => selected.has(i));

    if (toPost.length === 0) {
      addToast('No jobs selected to post', 'error');
      return;
    }
    setPosting(true);
    setStep('posting');
    try {
      const res = await apiClient.post('/bulk-upload/post', { jobs: toPost });
      setPostResults(res.data.results || []);
      setStep('done');
      addToast(`${res.data.total_posted} jobs posted successfully!`, 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Posting failed', 'error');
      setStep('preview');
    } finally {
      setPosting(false);
    }
  };

  const filteredJobs = jobs.filter(j =>
    !searchFilter ||
    j.job_title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    j.location?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    j.domain?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  /* ── UPLOAD STEP ── */
  if (step === 'upload') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4">
        <Toast toasts={toasts} />
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#009688] to-[#00796b] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#009688]/30">
              <FileJson size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">Bulk Job Upload</h1>
            <p className="text-slate-500">Upload a JSON file with multiple job listings. AI will auto-enhance each job.</p>
          </div>

          {/* Drop Zone */}
          <div
            ref={dropRef}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
              isDragging
                ? 'border-[#009688] bg-[#009688]/5 scale-[1.01]'
                : 'border-slate-200 hover:border-[#009688]/50 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileSelect}
            />
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all ${
              isDragging ? 'bg-[#009688] text-white scale-110' : 'bg-slate-100 text-slate-400 group-hover:bg-[#009688]/10 group-hover:text-[#009688]'
            }`}>
              {parsing ? <Loader2 size={36} className="animate-spin" /> : <Upload size={36} />}
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">
              {parsing ? 'Parsing jobs...' : isDragging ? 'Drop JSON file here' : 'Drag & Drop JSON file'}
            </h3>
            <p className="text-slate-400 text-sm mb-4">or click to browse — accepts .json files up to 500 jobs</p>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <Zap size={12} className="text-[#009688]" />
              <span>AI will auto-extract skills • Normalize job types • Detect duplicates</span>
            </div>
          </div>

          {/* JSON Format Reference */}
          <div className="mt-6 bg-slate-800 rounded-xl p-4 text-left">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Expected JSON Format</p>
            <pre className="text-xs text-emerald-400 font-mono overflow-x-auto leading-relaxed">{`[
  {
    "job_title": "Backend Engineer",
    "job_description": "We are looking for...",
    "location": { "city": "Bangalore", "country": "India" },
    "job_type": "Remote",           // Remote / Hybrid / Onsite
    "employment_type": "Full-time", // Full-time / Internship / Contract
    "deadline": "2025-06-30",
    "experience_required": "2+ years",
    "salary_range": "₹8-15 LPA",
    "required_skills": ["Python", "FastAPI"],
    "resume_template": {            // optional
      "about": "...", "projects": "..."
    }
  }
]`}</pre>
          </div>
        </div>
      </div>
    );
  }

  /* ── DONE STEP ── */
  if (step === 'done') {
    const successCount = postResults.filter(r => r.status === 'success').length;
    const failCount = postResults.filter(r => r.status === 'failed').length;
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Toast toasts={toasts} />
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Upload Complete!</h2>
          <p className="text-slate-500">{successCount} posted · {failCount} failed</p>
        </div>

        <div className="space-y-2 mb-8">
          {postResults.map((r, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
              r.status === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
            }`}>
              {r.status === 'success'
                ? <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                : <XCircle size={16} className="text-rose-500 shrink-0" />}
              <span className="text-sm font-medium text-slate-800 flex-1 truncate">{r.job_title}</span>
              {r.status === 'failed' && <span className="text-xs text-rose-600">{r.error}</span>}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setStep('upload'); setJobs([]); setPostResults([]); setSelected(new Set()); }}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
          >
            Upload More
          </button>
          <button
            onClick={() => navigate('/recruiter-dashboard')}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#009688] to-[#00796b] text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-[#009688]/20"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ── PREVIEW STEP ── */
  const selectedArr = jobs.filter((_, i) => selected.has(i));

  return (
    <div className="space-y-5">
      <Toast toasts={toasts} />
      {editIndex !== null && (
        <EditJobModal
          job={jobs[editIndex]}
          index={editIndex}
          onSave={handleSave}
          onClose={() => setEditIndex(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Preview Jobs</h1>
          <p className="text-slate-500 text-sm mt-0.5">{jobs.length} jobs parsed · {selected.size} selected</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setStep('upload'); setJobs([]); setSelected(new Set()); }}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            ← Upload New
          </button>
          <button
            disabled={posting}
            onClick={() => handlePost(false)}
            className="px-4 py-2.5 rounded-xl bg-[#009688] text-white text-sm font-bold hover:bg-[#00796b] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#009688]/20"
          >
            {posting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Post Selected ({selected.size})
          </button>
          <button
            disabled={posting}
            onClick={() => handlePost(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#009688] to-[#00796b] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#009688]/20"
          >
            {posting ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
            Post All ({jobs.length})
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Parsed', value: jobs.length, icon: FileJson, color: 'text-[#009688] bg-[#009688]/10' },
          { label: 'Selected', value: selected.size, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Warnings', value: warnings.length, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
          { label: 'Possible Dups', value: duplicates.length, icon: Info, color: 'text-rose-500 bg-rose-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {(warnings.length > 0 || duplicates.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
          <p className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-2">
            <AlertTriangle size={15} /> Notices
          </p>
          {[...warnings, ...duplicates].slice(0, 5).map((w, i) => (
            <p key={i} className="text-xs text-amber-700">{w}</p>
          ))}
          {(warnings.length + duplicates.length) > 5 && (
            <p className="text-xs text-amber-600 font-medium">+{warnings.length + duplicates.length - 5} more notices</p>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Filter jobs..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#009688]"
          />
          <Eye size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <button onClick={selectAll} className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors">
          Select All
        </button>
        <button onClick={deselectAll} className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors">
          Deselect All
        </button>
      </div>

      {/* Jobs List */}
      <div className="space-y-2">
        {filteredJobs.map((job, displayIdx) => {
          const realIdx = jobs.indexOf(job);
          const postStatus = postResults.find(r => r.job_title === job.job_title);
          return (
            <JobPreviewCard
              key={realIdx}
              job={job}
              index={realIdx}
              selected={selected.has(realIdx)}
              onToggle={toggleJob}
              onEdit={handleEdit}
              onDelete={handleDelete}
              postStatus={postStatus}
            />
          );
        })}
      </div>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-4 bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-4 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-600 font-medium">
          <span className="font-bold text-slate-900">{selected.size}</span> of {jobs.length} jobs selected
        </p>
        <div className="flex gap-3">
          <button
            disabled={posting || selected.size === 0}
            onClick={() => handlePost(false)}
            className="px-5 py-2.5 rounded-xl border border-[#009688] text-[#009688] text-sm font-bold hover:bg-[#009688]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={14} /> Post Selected ({selected.size})
          </button>
          <button
            disabled={posting}
            onClick={() => handlePost(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#009688] to-[#00796b] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-[#009688]/20"
          >
            {posting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Post All ({jobs.length})
          </button>
        </div>
      </div>
    </div>
  );
};
