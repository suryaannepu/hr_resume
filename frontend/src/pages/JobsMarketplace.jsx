import React, { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../context/authStore';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import { Navigation } from '../components/Navigation';
import { Badge, Loading, Alert, Card, Button, SectionHeader, EmptyState, Skeleton } from '../components/Common';
import {
  Search, Briefcase, Building, CheckCircle, Laptop, Users, ArrowRight, Clock, X,
  MapPin, Bookmark, BookmarkCheck, Zap, Filter, ChevronDown, ChevronUp,
  FileText, BookOpen, Award, Target, Lightbulb, Code2, GraduationCap,
  Loader2, Star, TrendingUp, Globe, AlertCircle, Upload, Download, Sparkles
} from 'lucide-react';

/* ─── Resume Template Modal ─── */
const ResumeTemplateModal = ({ job, onClose }) => {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('template'); // 'template' | 'auto'
  
  // Auto-Tailor State
  const [file, setFile] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [tailoredPdfUrl, setTailoredPdfUrl] = useState(null);
  const [tailoredFilename, setTailoredFilename] = useState('tailored_resume.pdf');
  const [originalPdfUrl, setOriginalPdfUrl] = useState(null);
  const [generateError, setGenerateError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get(`/jobs/${job._id}/resume-template`);
        setTemplate(res.data.resume_template);
      } catch {
        setError('Failed to load template');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [job._id]);

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setOriginalPdfUrl(URL.createObjectURL(selectedFile));
    }
  };

  const generateResume = async () => {
    if (!file) return;
    setGenerating(true);
    setGenerateError('');
    setTailoredPdfUrl(null);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64String = reader.result.split(',')[1]; // Remove data URL prefix
        try {
          const res = await apiClient.post(`/jobs/${job._id}/generate-resume`, {
            resume_base64: base64String
          });
          
          const { pdf_base64, filename } = res.data;
          const byteCharacters = atob(pdf_base64);
          const byteNumbers = Array.from(byteCharacters).map(c => c.charCodeAt(0));
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(blob);
          
          setTailoredPdfUrl(blobUrl);
          setTailoredFilename(filename || 'tailored_resume.pdf');
        } catch (err) {
          setGenerateError(err.response?.data?.error || 'Failed to generate resume');
        } finally {
          setGenerating(false);
        }
      };
    } catch (err) {
      setGenerateError('Error processing file');
      setGenerating(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!tailoredPdfUrl) return;
    const a = document.createElement('a');
    a.href = tailoredPdfUrl;
    a.download = tailoredFilename;
    a.click();
  };

  const sectionConfig = [
    {
      key: 'about', icon: Users, label: 'About / Summary', color: 'bg-blue-50 border-blue-100', iconColor: 'bg-blue-100 text-blue-600',
      required: true, tip: 'Keep it to 2-3 impactful sentences tailored to this role.'
    },
    {
      key: 'education', icon: GraduationCap, label: 'Education', color: 'bg-violet-50 border-violet-100', iconColor: 'bg-violet-100 text-violet-600',
      required: true, tip: 'Include your CGPA if above 7.0.'
    },
    {
      key: 'skills', icon: Code2, label: 'Skills', color: 'bg-emerald-50 border-emerald-100', iconColor: 'bg-emerald-100 text-emerald-600',
      required: true
    },
    {
      key: 'projects', icon: Target, label: 'Projects', color: 'bg-amber-50 border-amber-100', iconColor: 'bg-amber-100 text-amber-600',
      required: true
    },
    {
      key: 'experience', icon: Briefcase, label: 'Experience', color: 'bg-rose-50 border-rose-100', iconColor: 'bg-rose-100 text-rose-600',
      required: true
    },
    {
      key: 'certifications', icon: Award, label: 'Certifications', color: 'bg-slate-50 border-slate-100', iconColor: 'bg-slate-100 text-slate-500',
      required: false, tip: 'Optional but can significantly boost your profile.'
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden z-10"
        style={{ animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-[#009688]/5 to-transparent flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#009688]/10 flex items-center justify-center">
                <FileText size={20} className="text-[#009688]" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">Smart Resume Tools</h2>
                <p className="text-xs text-slate-500 mt-0.5">{job.job_title} · {job.company_name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={18} />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-4 mt-5 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('template')}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === 'template' ? 'border-[#009688] text-[#009688]' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Requirements Template
            </button>
            <button
              onClick={() => setActiveTab('auto')}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'auto' ? 'border-[#009688] text-[#009688]' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Sparkles size={14} className={activeTab === 'auto' ? "text-[#009688]" : "text-amber-500"} /> Auto-Tailor Resume
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'template' ? (
            loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 size={30} className="animate-spin text-[#009688] mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Loading AI-generated template...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-rose-500">{error}</div>
            ) : template ? (
              <>
                {/* AI Tips Banner */}
                {template.ai_tips?.length > 0 && (
                  <div className="bg-gradient-to-r from-[#009688]/10 to-[#009688]/5 border border-[#009688]/20 rounded-xl p-4">
                    <p className="text-xs font-bold text-[#009688] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Zap size={12} /> AI Tips for This Role
                    </p>
                    {template.ai_tips.map((tip, i) => (
                      <p key={i} className="text-sm text-slate-700 flex items-start gap-2 mt-1.5">
                        <span className="text-[#009688] mt-0.5">→</span> {tip}
                      </p>
                    ))}
                  </div>
                )}

                {/* Sections */}
                {sectionConfig.map(section => {
                  const data = template[section.key];
                  if (!data && !section.required) return null;
                  const Icon = section.icon;

                  return (
                    <div key={section.key} className={`rounded-xl border p-4 ${section.color}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${section.iconColor}`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <h3 className="font-bold text-slate-800 text-sm">{section.label}</h3>
                          {section.required ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-600">Required</span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-500">Optional</span>
                          )}
                        </div>
                      </div>

                      {/* Section content */}
                      {section.key === 'skills' && typeof data === 'object' ? (
                        <div className="space-y-2">
                          {data.required?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1.5">Must-have Skills</p>
                              <div className="flex flex-wrap gap-1.5">
                                {data.required.map((s, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-emerald-600 text-white rounded text-xs font-medium">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {data.nice_to_have?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nice-to-have</p>
                              <div className="flex flex-wrap gap-1.5">
                                {data.nice_to_have.map((s, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded text-xs font-medium">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {data.tip && (
                            <p className="text-xs text-emerald-700 flex items-center gap-1 mt-1">
                              <Lightbulb size={11} /> {data.tip}
                            </p>
                          )}
                        </div>
                      ) : typeof data === 'object' && data !== null ? (
                        <div className="space-y-1.5">
                          {data.description && <p className="text-sm text-slate-600">{data.description}</p>}
                          {data.tip && (
                            <p className="text-xs text-slate-500 flex items-start gap-1.5 bg-white/70 rounded-lg px-2 py-1.5 mt-1">
                              <Lightbulb size={11} className="mt-0.5 shrink-0 text-amber-500" /> {data.tip}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-sm text-slate-600">{data}</p>
                          {section.tip && (
                            <p className="text-xs text-slate-500 flex items-start gap-1.5 bg-white/70 rounded-lg px-2 py-1.5">
                              <Lightbulb size={11} className="mt-0.5 shrink-0 text-amber-500" /> {section.tip}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ) : null
          ) : (
            // Auto-Tailor Tab
            <div className="space-y-6">
              {!tailoredPdfUrl && !generating ? (
                <>
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
                    <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-2">
                      <Sparkles size={16} className="text-amber-500" /> AI Resume Tailoring
                    </h3>
                    <p className="text-sm text-amber-700/80 leading-relaxed">
                      Upload your existing resume (PDF). Our advanced AI will intelligently rewrite and format your experience to perfectly highlight your fit for <strong>{job.job_title}</strong> based on the exact skills the recruiter is looking for.
                    </p>
                  </div>
                  
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 hover:border-[#009688]/50 transition-colors bg-slate-50/50">
                    <input
                      type="file"
                      id="tailor-resume"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="tailor-resume" className="flex flex-col items-center justify-center cursor-pointer">
                      <div className="w-14 h-14 bg-white shadow-sm rounded-full flex items-center justify-center mb-4 text-[#009688]">
                        <Upload size={24} />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 mb-1">
                        {file ? file.name : "Select your PDF Resume"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {file ? "Ready to tailor" : "Click to browse files"}
                      </p>
                    </label>
                  </div>

                  {generateError && <Alert type="danger" message={generateError} />}
                  
                  {file && (
                    <Button 
                      variant="primary" 
                      onClick={generateResume}
                      icon={Sparkles}
                      className="w-full justify-center py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-none shadow-lg shadow-amber-500/20"
                    >
                      Tailor My Resume Now
                    </Button>
                  )}
                </>
              ) : generating ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 size={40} className="animate-spin text-amber-500 mb-4" />
                  <h3 className="font-bold text-slate-800 mb-2">AI is tailoring your resume...</h3>
                  <p className="text-sm text-slate-500 text-center max-w-sm">
                    Reading your experience and matching it with the {job.job_title} requirements. This usually takes 5-10 seconds.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-emerald-800 text-sm flex items-center gap-1.5"><CheckCircle size={15} /> Successfully Generated!</h3>
                      <p className="text-xs text-emerald-700 mt-0.5">Your resume has been completely rewritten.</p>
                    </div>
                    <Button size="sm" onClick={handleDownloadPdf} icon={Download} className="bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                      Download PDF
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-4">
                      {/* Left: Original */}
                      <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-2">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Original Resume</p>
                          </div>
                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50" style={{ height: '360px' }}>
                              {originalPdfUrl ? (
                                  <iframe src={originalPdfUrl} title="Original Resume" width="100%" height="100%" style={{ border: 'none' }} />
                              ) : null}
                          </div>
                      </div>

                      {/* Right: Tailored */}
                      <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-2">
                              <span className="w-2 h-2 rounded-full bg-[#009688]" />
                              <p className="text-[10px] font-semibold text-[#009688] uppercase tracking-wide">AI Tailored Resume</p>
                              <span className="px-1 py-0.5 bg-[#009688]/10 text-[#009688] text-[9px] rounded-full">NEW</span>
                          </div>
                          <div className="border border-[#009688]/30 rounded-xl overflow-hidden" style={{ height: '360px' }}>
                              <iframe src={tailoredPdfUrl} title="Tailored Resume" width="100%" height="100%" style={{ border: 'none' }} />
                          </div>
                      </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          
          <button
            onClick={() => window.location.href = `/apply/${job._id}`}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#009688] to-[#00796b] text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-[#009688]/20"
          >
            Apply to Job
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Filter Sidebar ─── */
const FilterPanel = ({ filters, onChange, jobs, onClose }) => {
  const allLocations = [...new Set(jobs.map(j => j.location).filter(Boolean))].slice(0, 20);
  const allSkills = [...new Set(jobs.flatMap(j => j.required_skills || []))].slice(0, 30);
  const allJobTypes = ['Remote', 'Hybrid', 'Onsite'];
  const allEmployment = ['Full-time', 'Part-time', 'Internship', 'Contract'];

  const toggle = (key, value) => {
    const current = filters[key] || [];
    onChange({
      ...filters,
      [key]: current.includes(value) ? current.filter(v => v !== value) : [...current, value]
    });
  };

  const ChipGroup = ({ label, options, filterKey }) => (
    <div className="mb-5">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => {
          const active = (filters[filterKey] || []).includes(opt);
          return (
            <button
              key={opt}
              onClick={() => toggle(filterKey, opt)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                active
                  ? 'bg-[#009688] text-white border-[#009688]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#009688]/50'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Filter size={15} className="text-[#009688]" /> Filters
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => onChange({})}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Clear all
          </button>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      <ChipGroup label="Job Type" options={allJobTypes} filterKey="job_type" />
      <ChipGroup label="Employment" options={allEmployment} filterKey="employment_type" />
      {allLocations.length > 0 && <ChipGroup label="Location" options={allLocations} filterKey="location" />}
      {allSkills.length > 0 && <ChipGroup label="Skills" options={allSkills.slice(0, 15)} filterKey="skills" />}
    </div>
  );
};

/* ─── Job Card ─── */
const JobCard = ({ job, hasApplied, isSaved, onSave, onViewTemplate }) => {
  const navigate = useNavigate();
  const isExpired = job.deadline && new Date(job.deadline) < new Date();

  return (
    <Card className="group relative flex flex-col hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-0.5 transition-all duration-300">
      {/* Top-right badges */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
        {hasApplied && (
          <Badge variant="success" className="shadow-sm">
            <CheckCircle size={11} className="mr-1 inline-block" /> Applied
          </Badge>
        )}
        <button
          onClick={e => { e.stopPropagation(); onSave(job._id, isSaved); }}
          className={`p-1.5 rounded-lg border transition-all ${
            isSaved ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-white border-slate-200 text-slate-300 hover:text-amber-400 hover:border-amber-200'
          }`}
          title={isSaved ? 'Remove bookmark' : 'Bookmark job'}
        >
          {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
        </button>
      </div>

      {/* Header */}
      <div className="mb-4 pr-20">
        <div className="w-12 h-12 bg-gradient-to-br from-[#009688]/10 to-[#009688]/20 text-[#009688] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Briefcase size={22} />
        </div>
        <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#009688] transition-colors leading-tight">{job.job_title}</h3>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-sm text-slate-500 font-medium flex items-center gap-1">
            <Building size={13} className="text-slate-400" /> {job.company_name}
          </span>
          {job.location && (
            <span className="text-sm text-slate-400 flex items-center gap-1">
              <MapPin size={12} /> {job.location}
            </span>
          )}
        </div>
      </div>

      {/* Type badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {job.job_type && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            job.job_type === 'Remote' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            job.job_type === 'Hybrid' ? 'bg-blue-50 text-blue-700 border-blue-200' :
            'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {job.job_type === 'Remote' && <Globe size={9} className="inline-block mr-0.5" />}
            {job.job_type}
          </span>
        )}
        {job.employment_type && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">
            {job.employment_type}
          </span>
        )}
        {job.domain && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-[#009688]/10 text-[#009688] border-[#009688]/20">
            {job.domain}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-2 flex-1">{job.description}</p>

      {/* Deadline */}
      {job.deadline && (
        <div className={`mb-4 p-2.5 rounded-xl border flex items-center gap-2 ${
          isExpired ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-amber-50 border-amber-100 text-amber-700'
        }`}>
          <Clock size={14} />
          <span className="text-xs font-semibold">
            Deadline: {new Date(job.deadline).toLocaleDateString()}
            {isExpired && ' (Expired)'}
          </span>
        </div>
      )}

      {/* Experience */}
      {job.experience_required && (
        <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
          <Star size={11} className="text-amber-400" /> {job.experience_required} experience
        </p>
      )}

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {job.required_skills?.slice(0, 4).map((skill, i) => (
          <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-medium">{skill}</span>
        ))}
        {job.required_skills?.length > 4 && (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-xs font-medium">+{job.required_skills.length - 4}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        {/* View Resume Template */}
        <button
          onClick={() => onViewTemplate(job)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#009688]/30 text-[#009688] text-xs font-semibold hover:bg-[#009688]/5 transition-colors"
        >
          <FileText size={13} /> Resume Template
        </button>

        {/* Apply / Quick Apply */}
        <Button
          variant={hasApplied ? 'ghost' : (isExpired ? 'secondary' : 'primary')}
          className="flex-1 justify-center"
          onClick={() => !hasApplied && !isExpired && navigate(`/apply/${job._id}`)}
          disabled={hasApplied || isExpired}
          icon={hasApplied ? CheckCircle : (isExpired ? X : Zap)}
        >
          {hasApplied ? 'Applied' : (isExpired ? 'Expired' : 'Quick Apply')}
        </Button>
      </div>
    </Card>
  );
};

/* ═══════════════ MAIN ═══════════════ */
export const JobsMarketplace = () => {
  const navigate = useNavigate();
  const { cachedJobs, setCachedJobs } = useAuthStore(state => ({
    cachedJobs: state.allJobs,
    setCachedJobs: state.setAllJobs
  }));
  const [jobs, setJobs] = useState(cachedJobs || []);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [loading, setLoading] = useState(!cachedJobs || cachedJobs.length === 0);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('latest');
  const [templateJob, setTemplateJob] = useState(null);

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      const [jobsRes, appsRes, savedRes] = await Promise.all([
        apiClient.get('/jobs/list'),
        apiClient.get('/applications/candidate/all'),
        apiClient.get('/applications/saved-jobs').catch(() => ({ data: { saved_jobs: [] } })),
      ]);
      const fetchedJobs = jobsRes.data.jobs || [];
      setJobs(fetchedJobs);
      setCachedJobs(fetchedJobs);
      setAppliedJobs(new Set((appsRes.data.applications || []).map(a => a.job_id)));
      setSavedJobs(new Set((savedRes.data.saved_jobs || []).map(s => s.job_id)));
    } catch (err) { setError('Failed to load jobs'); }
    finally { setLoading(false); }
  };

  const handleSaveJob = async (jobId, isSaved) => {
    try {
      if (isSaved) {
        await apiClient.delete(`/applications/saved-jobs/${jobId}`).catch(() =>
          apiClient.post('/applications/unsave-job', { job_id: jobId })
        );
        setSavedJobs(prev => { const n = new Set(prev); n.delete(jobId); return n; });
      } else {
        await apiClient.post('/applications/save-job', { job_id: jobId });
        setSavedJobs(prev => new Set([...prev, jobId]));
      }
    } catch { /* silent fail */ }
  };

  /* ── Filter & Sort ── */
  const getFilteredSorted = useCallback(() => {
    let result = [...jobs];

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(j =>
        j.job_title?.toLowerCase().includes(q) ||
        j.company_name?.toLowerCase().includes(q) ||
        j.description?.toLowerCase().includes(q) ||
        j.required_skills?.some(s => s.toLowerCase().includes(q)) ||
        j.location?.toLowerCase().includes(q)
      );
    }

    // Job type filter
    if (filters.job_type?.length > 0) {
      result = result.filter(j => filters.job_type.includes(j.job_type));
    }

    // Employment type filter
    if (filters.employment_type?.length > 0) {
      result = result.filter(j => filters.employment_type.includes(j.employment_type));
    }

    // Location filter
    if (filters.location?.length > 0) {
      result = result.filter(j => filters.location.some(l => j.location?.includes(l)));
    }

    // Skills filter
    if (filters.skills?.length > 0) {
      result = result.filter(j =>
        filters.skills.some(s => j.required_skills?.map(sk => sk.toLowerCase()).includes(s.toLowerCase()))
      );
    }

    // Sort
    if (sortBy === 'latest') {
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sortBy === 'deadline') {
      result.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      });
    }

    return result;
  }, [jobs, search, filters, sortBy]);

  const filtered = getFilteredSorted();
  const activeFilterCount = Object.values(filters).flat().length;

  if (loading && (!jobs || jobs.length === 0)) {
    return (
      <>
        <Navigation userRole="candidate" />
        <div className="min-h-screen bg-slate-50 py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="h-64">
                  <Skeleton className="w-12 h-12 rounded-xl mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-6" />
                  <Skeleton className="h-12 w-full mb-4" />
                </Card>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation userRole="candidate" />
      {templateJob && <ResumeTemplateModal job={templateJob} onClose={() => setTemplateJob(null)} />}

      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <SectionHeader
              title="Job Marketplace"
              subtitle={`${filtered.length} ${filtered.length === 1 ? 'position' : 'positions'} available`}
              icon={Search}
            />

            {/* Search + Filter controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  placeholder="Search jobs, skills, companies..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input-field pl-10 bg-white border-slate-200 w-full text-sm"
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-[#009688] text-white border-[#009688]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#009688]/50'
                }`}
              >
                <Filter size={15} />
                Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 bg-white focus:outline-none focus:border-[#009688] cursor-pointer"
              >
                <option value="latest">Latest First</option>
                <option value="deadline">Deadline Soon</option>
              </select>
            </div>
          </div>

          {error && <Alert type="danger" message={error} className="mb-4" />}

          {/* Filter Panel */}
          {showFilters && (
            <div className="mb-6" style={{ animation: 'slideIn 0.2s ease-out' }}>
              <FilterPanel
                filters={filters}
                onChange={setFilters}
                jobs={jobs}
                onClose={() => setShowFilters(false)}
              />
            </div>
          )}

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {Object.entries(filters).flatMap(([key, values]) =>
                (values || []).map(v => (
                  <span key={`${key}-${v}`} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#009688]/10 border border-[#009688]/20 text-[#009688] rounded-full text-xs font-medium">
                    {v}
                    <button onClick={() => {
                      const next = { ...filters, [key]: (filters[key] || []).filter(x => x !== v) };
                      setFilters(next);
                    }}>
                      <X size={11} />
                    </button>
                  </span>
                ))
              )}
              <button onClick={() => setFilters({})} className="text-xs text-slate-400 hover:text-rose-500 transition-colors px-2">Clear all</button>
            </div>
          )}

          {/* Job Grid */}
          {filtered.length === 0 ? (
            <EmptyState
              title="No jobs found"
              description="Try adjusting your search or filters."
              icon={Search}
              action={<Button variant="secondary" onClick={() => { setSearch(''); setFilters({}); }}>Clear Filters</Button>}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(job => (
                <JobCard
                  key={job._id}
                  job={job}
                  hasApplied={appliedJobs.has(job._id)}
                  isSaved={savedJobs.has(job._id)}
                  onSave={handleSaveJob}
                  onViewTemplate={setTemplateJob}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
