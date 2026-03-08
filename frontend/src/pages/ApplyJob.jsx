import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import useAuthStore from '../context/authStore';
import { Navigation } from '../components/Navigation';
import { Badge, Loading, Alert, Card, Button } from '../components/Common';
import { CheckCircle, Sparkles, FileText, Building, Laptop, Users, Upload, Mail, User, ArrowRight } from 'lucide-react';

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

  if (loading) return <><Navigation userRole="candidate" /><Loading text="Loading job details..." /></>;

  return (
    <>
      <Navigation userRole="candidate" />
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Job Details */}
          {job && (
            <Card className="flex flex-col h-full">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{job.job_title}</h2>
              <div className="flex items-center gap-2 text-blue-600 font-medium mb-8">
                <Building size={18} /> {job.company_name}
              </div>

              <div className="mb-8">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Job Description</h4>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </div>

              {job.required_skills?.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.required_skills.map(skill => (
                      <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-semibold">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {(job.technical_requirements?.length > 0 || job.soft_requirements?.length > 0) && (
                <div className="mt-auto p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  {job.technical_requirements?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-2">
                        <Laptop size={14} className="text-emerald-500" /> Technical Skills
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {job.technical_requirements.map((s, i) => (
                          <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {job.soft_requirements?.length > 0 && (
                    <div className={job.technical_requirements?.length > 0 ? 'pt-4 border-t border-slate-200' : ''}>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-2">
                        <Users size={14} className="text-amber-500" /> Soft Skills
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {job.soft_requirements.map((s, i) => (
                          <span key={i} className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-xs font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Application Form */}
          <Card className="flex flex-col h-full bg-blue-50/30">
            {alreadyApplied ? (
              <div className="text-center py-16 m-auto">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">Already Applied!</h3>
                <p className="text-slate-600 mb-8 max-w-sm mx-auto">You've already submitted your application for this position.</p>
                <Button className="mx-auto" onClick={() => navigate('/candidate-dashboard')} icon={ArrowRight}>
                  View My Applications
                </Button>
              </div>
            ) : success ? (
              <div className="text-center py-16 m-auto animate-fade-in-up">
                <div className="w-20 h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">Application Submitted!</h3>
                <p className="text-slate-600 max-w-sm mx-auto">AI agents are processing your resume. Redirecting to your dashboard...</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <Upload size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Submit Application</h3>
                </div>
                <p className="text-sm text-slate-500 mb-8 ml-13">Upload your resume and our AI will analyze it</p>

                {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                  {/* Drag & Drop */}
                  <div
                    className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer mb-8 flex-1 flex flex-col items-center justify-center
                      ${dragOver
                        ? 'border-blue-500 bg-blue-50'
                        : resumeFile
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-slate-300 hover:border-blue-400 hover:bg-white bg-slate-50'
                      }`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('resume-upload').click()}
                  >
                    <input type="file" id="resume-upload" accept=".pdf" className="hidden"
                      onChange={e => handleFileSelect(e.target.files[0])} disabled={submitting} />
                    {resumeFile ? (
                      <>
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                          <CheckCircle size={32} />
                        </div>
                        <p className="text-emerald-700 font-bold text-lg mb-1">{resumeFile.name}</p>
                        <p className="text-sm text-emerald-600">{(resumeFile.size / 1024).toFixed(0)} KB • Click or drag to change</p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                          <FileText size={32} />
                        </div>
                        <p className="text-slate-800 font-bold mb-2">Drop your resume here</p>
                        <p className="text-sm text-slate-500">or click to browse • PDF format only</p>
                      </>
                    )}
                  </div>

                  {user && (
                    <div className="p-4 rounded-xl bg-white border border-slate-200 mb-8 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <Mail size={16} className="text-slate-400" />
                        <span className="text-sm text-slate-500 w-12">Email:</span>
                        <span className="text-sm font-medium text-slate-800">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <User size={16} className="text-slate-400" />
                        <span className="text-sm text-slate-500 w-12">Name:</span>
                        <span className="text-sm font-medium text-slate-800">{user.name}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={submitting || !resumeFile}
                    className="w-full justify-center"
                    size="lg"
                    icon={submitting ? Sparkles : Upload}
                  >
                    {submitting ? 'Submitting & Analyzing...' : 'Submit Application'}
                  </Button>
                  <p className="text-center text-xs text-slate-500 mt-4 flex items-center justify-center gap-1.5">
                    <Sparkles size={12} className="text-blue-500" />
                    Your resume will be analyzed by 9 AI agents
                  </p>
                </form>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};
