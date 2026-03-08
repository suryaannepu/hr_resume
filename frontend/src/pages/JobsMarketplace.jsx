import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import { Navigation } from '../components/Navigation';
import { Badge, Loading, Alert } from '../components/Common';

export const JobsMarketplace = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      const [jobsRes, appsRes] = await Promise.all([
        apiClient.get('/jobs/list'),
        apiClient.get('/applications/candidate/all'),
      ]);
      setJobs(jobsRes.data.jobs || []);
      const appliedSet = new Set((appsRes.data.applications || []).map(a => a.job_id));
      setAppliedJobs(appliedSet);
    } catch (err) { setError('Failed to load jobs'); }
    finally { setLoading(false); }
  };

  const filtered = jobs.filter(j =>
    j.job_title?.toLowerCase().includes(search.toLowerCase()) ||
    j.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    j.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <><Navigation userRole="candidate" /><Loading text="Loading jobs..." /></>;

  return (
    <>
      <Navigation userRole="candidate" />
      <div className="min-h-screen bg-slate-925 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">🔍 Job Marketplace</h1>
              <p className="text-slate-400 mt-1">{filtered.length} {filtered.length === 1 ? 'position' : 'positions'} available</p>
            </div>
            <div className="relative max-w-sm w-full">
              <input type="text" placeholder="Search jobs, companies, skills..." value={search} onChange={e => setSearch(e.target.value)}
                className="input-field pl-10" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
            </div>
          </div>

          {error && <Alert type="danger" message={error} />}

          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-6xl mb-4">🔍</p>
              <p className="text-xl text-slate-400">No jobs found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(job => {
                const hasApplied = appliedJobs.has(job._id);
                return (
                  <div key={job._id} className="glass-card group relative">
                    {hasApplied && (
                      <div className="absolute top-4 right-4 z-10">
                        <Badge variant="success">✓ Applied</Badge>
                      </div>
                    )}

                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition-colors">{job.job_title}</h3>
                      <p className="text-sm text-slate-400 font-medium mt-1">🏢 {job.company_name}</p>
                    </div>

                    <p className="text-sm text-slate-400 leading-relaxed mb-4 line-clamp-3">{job.description}</p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {job.required_skills?.slice(0, 5).map((skill, i) => (
                        <span key={i} className="badge bg-brand-500/10 text-brand-300 border border-brand-500/20 text-xs">{skill}</span>
                      ))}
                      {job.required_skills?.length > 5 && (
                        <span className="badge bg-white/5 text-slate-400 border border-white/10 text-xs">+{job.required_skills.length - 5}</span>
                      )}
                    </div>

                    {/* Technical vs Soft */}
                    {(job.technical_requirements?.length > 0 || job.soft_requirements?.length > 0) && (
                      <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <div className="flex gap-4 text-xs">
                          {job.technical_requirements?.length > 0 && (
                            <div><span className="text-slate-500">💻 Technical:</span> <span className="text-slate-300">{job.technical_requirements.length}</span></div>
                          )}
                          {job.soft_requirements?.length > 0 && (
                            <div><span className="text-slate-500">🤝 Soft:</span> <span className="text-slate-300">{job.soft_requirements.length}</span></div>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      className={`w-full ${hasApplied ? 'btn-secondary cursor-default' : 'btn-primary'}`}
                      onClick={() => !hasApplied && navigate(`/apply/${job._id}`)}
                      disabled={hasApplied}
                    >
                      {hasApplied ? '✓ Already Applied' : '✨ Apply Now →'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
