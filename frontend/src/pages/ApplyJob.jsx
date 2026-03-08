import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import useAuthStore from '../context/authStore';
import { Navigation } from '../components/Navigation';
import { Badge, Loading, Alert } from '../components/Common';

export const ApplyJob = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [jobRes, checkRes] = await Promise.all([
          apiClient.get(`/jobs/${jobId}`),
          apiClient.get(`/applications/check/${jobId}`),
        ]);
        setJob(jobRes.data);
        setAlreadyApplied(checkRes.data.applied);
      } catch (err) { setError('Failed to load job'); }
      finally { setLoading(false); }
    };
    load();
  }, [jobId]);

  const handleFileSelect = (file) => {
    if (file && file.type === 'application/pdf') { setResumeFile(file); setError(''); }
    else setError('Please select a valid PDF file');
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile) { setError('Please select a resume'); return; }
    setSubmitting(true); setError('');
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result.split(',')[1];
          await apiClient.post('/applications/apply', { job_id: jobId, resume_base64: base64, resume_filename: resumeFile.name });
          setSuccess(true);
          setTimeout(() => navigate('/candidate-dashboard'), 2000);
        } catch (err) {
          const msg = err.response?.data?.error || 'Failed to submit';
          if (err.response?.status === 409) setAlreadyApplied(true);
          setError(msg); setSubmitting(false);
        }
      };
      reader.readAsDataURL(resumeFile);
    } catch (err) { setError('Error processing file'); setSubmitting(false); }
  };

  if (loading) return <><Navigation userRole="candidate" /><Loading /></>;

  return (
    <>
      <Navigation userRole="candidate" />
      <div className="min-h-screen bg-slate-925 py-8 px-4">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Job Details */}
          {job && (
            <div className="glass-card-static">
              <h2 className="text-2xl font-bold text-white mb-1">{job.job_title}</h2>
              <p className="text-brand-300 font-medium mb-6">🏢 {job.company_name}</p>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Job Description</h4>
                <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </div>

              {job.required_skills?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.required_skills.map(skill => (
                      <span key={skill} className="badge bg-brand-500/10 text-brand-300 border border-brand-500/20">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {(job.technical_requirements?.length > 0 || job.soft_requirements?.length > 0) && (
                <div className="mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
                  {job.technical_requirements?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-slate-500">💻 Technical Skills</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">{job.technical_requirements.map((s, i) => <span key={i} className="badge bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs">{s}</span>)}</div>
                    </div>
                  )}
                  {job.soft_requirements?.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-slate-500">🤝 Soft Skills</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">{job.soft_requirements.map((s, i) => <span key={i} className="badge bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs">{s}</span>)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Application Form */}
          <div className="glass-card-static">
            {alreadyApplied ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-white mb-2">Already Applied!</h3>
                <p className="text-slate-400 mb-6">You've already submitted your application for this position.</p>
                <button className="btn-primary" onClick={() => navigate('/candidate-dashboard')}>
                  View My Applications →
                </button>
              </div>
            ) : success ? (
              <div className="text-center py-12 animate-slide-up">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-emerald-300 mb-2">Application Submitted!</h3>
                <p className="text-slate-400">AI agents are processing your resume. Redirecting...</p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-white mb-1">📤 Submit Application</h3>
                <p className="text-sm text-slate-400 mb-6">Upload your resume and our AI will analyze it</p>

                {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

                <form onSubmit={handleSubmit}>
                  {/* Drag & Drop */}
                  <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer mb-6
                    ${dragOver ? 'border-brand-500 bg-brand-500/10' : resumeFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-brand-500/50 hover:bg-white/[0.03]'}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('resume-upload').click()}>
                    <input type="file" id="resume-upload" accept=".pdf" className="hidden"
                      onChange={e => handleFileSelect(e.target.files[0])} disabled={submitting} />
                    {resumeFile ? (
                      <>
                        <div className="text-3xl mb-2">✅</div>
                        <p className="text-emerald-300 font-semibold">{resumeFile.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{(resumeFile.size / 1024).toFixed(0)} KB • Click to change</p>
                      </>
                    ) : (
                      <>
                        <div className="text-3xl mb-2">📄</div>
                        <p className="text-slate-300 font-medium">Drop your resume here</p>
                        <p className="text-xs text-slate-500 mt-1">or click to browse • PDF only</p>
                      </>
                    )}
                  </div>

                  {user && (
                    <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/20 mb-6">
                      <p className="text-sm text-slate-300"><span className="text-slate-500">📧 Email:</span> {user.email}</p>
                      <p className="text-sm text-slate-300 mt-1"><span className="text-slate-500">👤 Name:</span> {user.name}</p>
                    </div>
                  )}

                  <button type="submit" disabled={submitting || !resumeFile} className="btn-primary w-full text-center">
                    {submitting ? '⏳ Submitting & Analyzing...' : '✨ Submit Application'}
                  </button>
                </form>
                <p className="text-center text-xs text-slate-500 mt-4">Your resume will be analyzed by 9 AI agents</p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
