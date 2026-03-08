import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import { Navigation } from '../components/Navigation';
import { Card, Button, Badge, ScoreBar, Loading, Alert, ScoreRing } from '../components/Common';

export const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState({});
  const [rankings, setRankings] = useState({});
  const [insights, setInsights] = useState({});

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await apiClient.get('/recruiter/dashboard');
      const enrichedData = enrichDashboardWithScores(response.data);
      setDashboard(enrichedData);
      setError('');
    } catch (err) {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const enrichDashboardWithScores = (data) => {
    const jobsWithScores = data.jobs?.map(job => {
      const visibleApps = job.applications || [];
      const scores = visibleApps.map(app => app.match_score || 0);
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const scoreBreakdown = {
        excellent: scores.filter(s => s >= 80).length,
        good: scores.filter(s => s >= 60 && s < 80).length,
        fair: scores.filter(s => s >= 40 && s < 60).length,
        poor: scores.filter(s => s < 40).length
      };

      const topCandidatesList = visibleApps
        .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
        .slice(0, 3);

      return { ...job, avgScore, scoreBreakdown, topCandidates: topCandidatesList };
    }) || [];
    return { ...data, jobs: jobsWithScores };
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  };

  const handleProcessApplications = async (jobId) => {
    setProcessing(p => ({ ...p, [jobId]: true }));
    try {
      const response = await apiClient.post(`/recruiter/job/${jobId}/process-pending`);
      setSuccess(`Processing ${response.data.submitted_count} applications...`);
      setTimeout(() => { fetchDashboard(); setProcessing(p => ({ ...p, [jobId]: false })); }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process applications');
      setProcessing(p => ({ ...p, [jobId]: false }));
    }
  };

  const handleAutoShortlist = async (jobId) => {
    setProcessing(p => ({ ...p, [jobId]: true }));
    try {
      const response = await apiClient.post(`/recruiter/job/${jobId}/auto-shortlist`, { threshold: 70 });
      setSuccess(`Auto-shortlisted ${response.data.shortlisted_count} candidates!`);
      setTimeout(() => { fetchDashboard(); setProcessing(p => ({ ...p, [jobId]: false })); }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to auto-shortlist candidates');
      setProcessing(p => ({ ...p, [jobId]: false }));
    }
  };

  const handleAIRank = async (jobId) => {
    setProcessing(p => ({ ...p, [`rank_${jobId}`]: true }));
    try {
      const response = await apiClient.post(`/recruiter/job/${jobId}/ai-rank`);
      setRankings(r => ({ ...r, [jobId]: response.data }));
      setSuccess('AI Ranking & Shortlisting complete!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to run AI ranking');
    } finally {
      setProcessing(p => ({ ...p, [`rank_${jobId}`]: false }));
    }
  };

  const handleAIInsights = async (jobId) => {
    setProcessing(p => ({ ...p, [`insight_${jobId}`]: true }));
    try {
      const response = await apiClient.get(`/recruiter/job/${jobId}/ai-insights`);
      setInsights(ins => ({ ...ins, [jobId]: response.data }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load AI insights');
    } finally {
      setProcessing(p => ({ ...p, [`insight_${jobId}`]: false }));
    }
  };

  const handleDecision = async (jobId, applicationId, decision) => {
    setProcessing(p => ({ ...p, [`dec_${applicationId}`]: true }));
    try {
      const res = await apiClient.post(`/recruiter/job/${jobId}/candidate/${applicationId}/decision`, { decision });
      setSuccess(res.data.message || `Candidate ${decision} successfully`);
      fetchDashboard();
    } catch (err) {
      setError(`Failed to process decision: ${err.response?.data?.error || err.message}`);
    } finally {
      setProcessing(p => ({ ...p, [`dec_${applicationId}`]: false }));
    }
  };

  const handleViewCandidates = (jobId) => { navigate(`/job/${jobId}/candidates`); };

  if (loading) return <><Navigation userRole="recruiter" /><Loading text="Loading dashboard..." /></>;

  const pendingCount = dashboard?.jobs?.reduce((sum, job) => sum + (job.total_applications - job.processed_applications), 0) || 0;
  const totalAvgScore = dashboard?.jobs?.length > 0 ? Math.round(dashboard.jobs.reduce((sum, job) => sum + (job.avgScore || 0), 0) / dashboard.jobs.length) : 0;

  return (
    <>
      <Navigation userRole="recruiter" />
      <div className="min-h-screen bg-slate-925 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">🏢 Recruiter Dashboard</h1>
              {pendingCount > 0 && <p className="text-amber-400 font-semibold mt-2">{pendingCount} applications awaiting AI processing</p>}
            </div>
            <Button variant="primary" onClick={() => navigate('/post-job')}>+ Post New Job</Button>
          </div>

          {error && <Alert type="danger" message={error} onClose={() => setError('')} />}
          {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="stat-card"><div className="text-2xl font-bold text-white">{dashboard?.total_jobs || 0}</div><div className="text-xs text-slate-500 mt-1">Active Jobs</div></div>
            <div className="stat-card"><div className="text-2xl font-bold text-white">{dashboard?.total_applications || 0}</div><div className="text-xs text-slate-500 mt-1">Total Applications</div></div>
            <div className="stat-card"><div className="text-2xl font-bold text-emerald-400">{dashboard?.total_processed || 0}</div><div className="text-xs text-slate-500 mt-1">Processed</div></div>
            <div className="stat-card"><div className="text-2xl font-bold text-amber-500">{pendingCount}</div><div className="text-xs text-slate-500 mt-1">Pending</div></div>
          </div>

          {/* Portfolio Summary */}
          {dashboard?.jobs?.length > 0 && (
            <div className="glass-card mb-8 border-l-4 border-l-brand-500">
              <h3 className="text-lg font-bold text-white mb-4">Portfolio Performance</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-2xl font-bold text-white">{totalAvgScore}</span>
                  <span className="text-xs text-slate-400 mt-1">Avg Score</span>
                </div>
                {[
                  { label: 'Excellent (80+)', key: 'excellent', color: 'text-emerald-400' },
                  { label: 'Good (60-79)', key: 'good', color: 'text-brand-400' },
                  { label: 'Fair (40-59)', key: 'fair', color: 'text-amber-400' },
                  { label: 'Below 40', key: 'poor', color: 'text-rose-400' },
                ].map((tier, idx) => {
                  const count = dashboard.jobs.reduce((sum, job) => sum + (job.scoreBreakdown?.[tier.key] || 0), 0);
                  return (
                    <div key={idx} className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-xl border border-white/10">
                      <span className={`text-2xl font-bold ${tier.color}`}>{count}</span>
                      <span className="text-xs text-slate-400 mt-1">{tier.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Jobs List */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Active Jobs</h2>
            {dashboard?.jobs && dashboard.jobs.length > 0 ? (
              <div className="space-y-4">
                {dashboard.jobs.map(job => {
                  const unprocessed = job.total_applications - job.processed_applications;
                  const isProcessing = processing[job.job_id];
                  const jobInsight = insights[job.job_id] || job.ai_insights;
                  const jobRanking = rankings[job.job_id];

                  return (
                    <div key={job.job_id} className={`glass-card transition-all duration-300 ${isProcessing ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : ''}`}>
                      {/* Job Header */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{job.job_title}</h3>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            <span>{job.total_applications} total applications</span>
                            {unprocessed > 0 && <Badge variant="warning">{unprocessed} pending analysis</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-white">Avg Match</p>
                            <Badge variant={getScoreBadge(job.avgScore)}>{job.avgScore || 0}%</Badge>
                          </div>
                          <ScoreRing score={job.avgScore || 0} size={50} strokeWidth={4} />
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4 border-y border-white/10 mb-6">
                        <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total</p><p className="text-lg font-semibold text-white">{job.total_applications}</p></div>
                        <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Processed</p><p className="text-lg font-semibold text-emerald-400">{job.processed_applications}</p></div>
                        <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Shortlisted</p><p className="text-lg font-semibold text-brand-400">{job.shortlist_count}</p></div>
                        <div><p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Approved</p><p className="text-lg font-semibold text-white">{job.approved_count}</p></div>
                      </div>

                      {/* AI Insights Panel */}
                      {jobInsight && (
                        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-brand-500/5 via-emerald-500/5 to-purple-500/5 border border-brand-500/20">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">💡</span>
                            <span className="text-sm font-bold text-white">AI Executive Insights</span>
                            {jobInsight.pool_quality && (
                              <Badge variant={jobInsight.pool_quality === 'Excellent' ? 'success' : jobInsight.pool_quality === 'Good' ? 'primary' : 'warning'}>
                                Pool: {jobInsight.pool_quality}
                              </Badge>
                            )}
                          </div>

                          {jobInsight.executive_summary ? (
                            <>
                              <p className="text-sm text-slate-300 mb-3">{jobInsight.executive_summary}</p>
                              {jobInsight.top_recommendation && (
                                <p className="text-xs text-brand-300 bg-brand-500/10 px-3 py-2 rounded-lg inline-block">💡 {jobInsight.top_recommendation}</p>
                              )}
                              {jobInsight.key_concerns?.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {jobInsight.key_concerns.map((c, i) => (
                                    <span key={i} className="text-xs text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg">⚠ {c}</span>
                                  ))}
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-slate-400 italic">{jobInsight.insights || jobInsight.error || "Click 'AI Insights' below to analyze this candidate pool."}</p>
                          )}
                        </div>
                      )}

                      {/* AI Ranking Results */}
                      {jobRanking?.ranking?.ranked_candidates && (
                        <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/10">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">🏆</span>
                            <span className="text-sm font-bold text-white">AI Ranking Results</span>
                          </div>
                          {jobRanking.ranking.overall_analysis && (
                            <p className="text-sm text-slate-400 mb-3 italic">{jobRanking.ranking.overall_analysis}</p>
                          )}
                          <div className="space-y-2">
                            {jobRanking.ranking.ranked_candidates.slice(0, 5).map((c, i) => (
                              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                                <span className={`text-lg font-bold ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                                  #{c.rank || i + 1}
                                </span>
                                <span className="text-sm text-white flex-1">{c.name || 'Candidate'}</span>
                                <Badge variant={getScoreBadge(c.score)}>{c.score}%</Badge>
                                <span className="text-xs text-slate-500 max-w-xs truncate hidden md:inline">{c.ranking_reason}</span>
                              </div>
                            ))}
                          </div>
                          {jobRanking.shortlist?.shortlist_reasoning && (
                            <div className="mt-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                              <p className="text-xs text-emerald-300"><span className="font-semibold">Shortlist Reasoning:</span> {jobRanking.shortlist.shortlist_reasoning}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Top Candidates Preview */}
                      {job.topCandidates && job.topCandidates.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-slate-300 mb-3">Top Candidates & Quick Actions</h4>
                          <div className="grid md:grid-cols-1 gap-3">
                            {job.topCandidates.map((c, i) => (
                              <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex flex-col items-center">
                                    <Badge variant={getScoreBadge(c.match_score)}>{c.match_score}%</Badge>
                                    <span className="text-[10px] text-slate-500 mt-1 uppercase">Match</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-white line-clamp-1">{c.candidate_name || 'Candidate'}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{c.recommendation || 'Pending'}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {!c.decision ? (
                                    <>
                                      <button
                                        className="btn-success !py-1.5 !px-3 text-xs"
                                        onClick={() => handleDecision(job.job_id, c._id, 'shortlisted')}
                                        disabled={processing[`dec_${c._id}`]}
                                      >
                                        {processing[`dec_${c._id}`] ? '...' : '✓ Shortlist'}
                                      </button>
                                      <button
                                        className="btn-danger !py-1.5 !px-3 text-xs"
                                        onClick={() => handleDecision(job.job_id, c._id, 'rejected')}
                                        disabled={processing[`dec_${c._id}`]}
                                      >
                                        {processing[`dec_${c._id}`] ? '...' : '✗ Reject'}
                                      </button>
                                    </>
                                  ) : (
                                    <Badge variant={c.decision === 'rejected' ? 'danger' : 'success'}>
                                      {c.decision === 'shortlisted' ? '🚀 Shortlisted' : c.decision === 'hired' ? '🎊 Hired' : '✗ Rejected'}
                                    </Badge>
                                  )}
                                  <button className="btn-ghost !p-2 text-slate-400 hover:text-white" title="View details" onClick={() => handleViewCandidates(job.job_id)}>
                                    👁️
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-3 pt-4">
                        {unprocessed > 0 && (
                          <Button variant="warning" onClick={() => handleProcessApplications(job.job_id)} disabled={isProcessing} className="flex items-center gap-2">
                            <span>⚡</span> {isProcessing ? 'Processing...' : `Process ${unprocessed}`}
                          </Button>
                        )}
                        {job.processed_applications > 0 && (
                          <>
                            <Button variant="primary" onClick={() => handleAIRank(job.job_id)} disabled={processing[`rank_${job.job_id}`]} className="flex items-center gap-2">
                              <span>🏆</span> {processing[`rank_${job.job_id}`] ? 'Ranking...' : 'AI Rank & Shortlist'}
                            </Button>
                            <Button variant="secondary" onClick={() => handleAIInsights(job.job_id)} disabled={processing[`insight_${job.job_id}`]} className="flex items-center gap-2">
                              <span>💡</span> {processing[`insight_${job.job_id}`] ? 'Analyzing...' : 'AI Insights'}
                            </Button>
                            <Button variant="primary" onClick={() => handleAutoShortlist(job.job_id)} disabled={isProcessing} className="flex items-center gap-2">
                              <span>🎯</span> Auto-Shortlist (70%+)
                            </Button>
                          </>
                        )}
                        <Button variant="secondary" onClick={() => handleViewCandidates(job.job_id)} className="flex items-center gap-2">
                          <span>👥</span> View Full Roster
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-6xl mb-4">🚀</p>
                <p className="text-xl text-slate-400 mb-4">No jobs posted yet</p>
                <Button variant="primary" onClick={() => navigate('/post-job')}>Create First Job</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
