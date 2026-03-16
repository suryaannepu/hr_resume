import React, { useState, useEffect } from 'react';
import useAuthStore from '../context/authStore';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import { Navigation } from '../components/Navigation';
import { Badge, Loading, Alert, Card, Button, SectionHeader, EmptyState, Skeleton } from '../components/Common';
import { Search, Briefcase, Building, CheckCircle, Laptop, Users, ArrowRight } from 'lucide-react';

export const JobsMarketplace = () => {
  const navigate = useNavigate();
  const { cachedJobs, setCachedJobs } = useAuthStore(state => ({
    cachedJobs: state.allJobs,
    setCachedJobs: state.setAllJobs
  }));
  const [jobs, setJobs] = useState(cachedJobs);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [loading, setLoading] = useState(!cachedJobs || cachedJobs.length === 0);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      const [jobsRes, appsRes] = await Promise.all([
        apiClient.get('/jobs/list'),
        apiClient.get('/applications/candidate/all'),
      ]);
      const fetchedJobs = jobsRes.data.jobs || [];
      setJobs(fetchedJobs);
      setCachedJobs(fetchedJobs);
      const appliedSet = new Set((appsRes.data.applications || []).map(a => a.job_id));
      setAppliedJobs(appliedSet);
    } catch (err) { setError('Failed to load jobs'); }
    finally { setLoading(false); }
  };

  const filtered = jobs.filter(j => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      j.job_title?.toLowerCase().includes(q) ||
      j.company_name?.toLowerCase().includes(q) ||
      j.description?.toLowerCase().includes(q) ||
      j.required_skills?.some(s => s.toLowerCase().includes(q))
    );
  });

  if (loading && (!jobs || jobs.length === 0)) {
    return (
      <>
        <Navigation userRole="candidate" />
        <div className="min-h-screen bg-slate-50 py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-full max-w-sm rounded-xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="h-64 h-full flex flex-col">
                  <Skeleton className="w-12 h-12 rounded-xl mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-6" />
                  <Skeleton className="h-12 w-full mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
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
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <SectionHeader
              title="Job Marketplace"
              subtitle={`${filtered.length} ${filtered.length === 1 ? 'position' : 'positions'} available`}
              icon={Search}
            />
            <div className="relative max-w-sm w-full">
              <input
                type="text"
                placeholder="Search jobs, companies, skills..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-10 bg-white border-slate-200"
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {error && <Alert type="danger" message={error} />}

          {filtered.length === 0 ? (
            <EmptyState
              title="No jobs found"
              description="We couldn't find any jobs matching your search criteria. Try adjusting your filters."
              icon={Search}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(job => {
                const hasApplied = appliedJobs.has(job._id);
                return (
                  <Card key={job._id} className="group relative flex flex-col">
                    {hasApplied && (
                      <div className="absolute top-4 right-4 z-10 transition-transform group-hover:scale-105">
                        <Badge variant="success" className="shadow-sm">
                          <CheckCircle size={12} className="mr-1 inline-block" /> Applied
                        </Badge>
                      </div>
                    )}

                    <div className="mb-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                        <Briefcase size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{job.job_title}</h3>
                      <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                        <Building size={14} className="text-slate-400" /> {job.company_name}
                      </p>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed mb-6 line-clamp-3 flex-1">{job.description}</p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {job.required_skills?.slice(0, 5).map((skill, i) => (
                        <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-medium">{skill}</span>
                      ))}
                      {job.required_skills?.length > 5 && (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium">+{job.required_skills.length - 5}</span>
                      )}
                    </div>

                    {/* Technical vs Soft */}
                    {(job.technical_requirements?.length > 0 || job.soft_requirements?.length > 0) && (
                      <div className="mb-6 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex gap-4 text-xs">
                          {job.technical_requirements?.length > 0 && (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Laptop size={14} className="text-emerald-500" />
                              <span>{job.technical_requirements.length} Technical</span>
                            </div>
                          )}
                          {job.soft_requirements?.length > 0 && (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Users size={14} className="text-amber-500" />
                              <span>{job.soft_requirements.length} Soft</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <Button
                      variant={hasApplied ? 'ghost' : 'primary'}
                      className="w-full justify-center mt-auto"
                      onClick={() => !hasApplied && navigate(`/apply/${job._id}`)}
                      disabled={hasApplied}
                      icon={hasApplied ? CheckCircle : ArrowRight}
                    >
                      {hasApplied ? 'Already Applied' : 'Apply Now'}
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
