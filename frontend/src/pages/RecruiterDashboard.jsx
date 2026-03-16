import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import useAuthStore from '../context/authStore';
import {
  Card,
  Button,
  Badge,
  Loading,
  Alert,
  SectionHeader,
  ScoreRing,
  RecruiterStatCard,
  Skeleton,
  EmptyState,
  StatWidget
} from '../components/Common';
import {
  Sparkles,
  Search,
  PlusCircle,
  Bell,
  MessageSquare,
  Briefcase,
  Users,
  BarChart3,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle,
  XCircle,
  MoreVertical,
  Lightbulb,
  Zap,
  Target,
  Trophy,
  Star,
  Eye,
  FileText,
  AlertCircle,
  LayoutDashboard
} from 'lucide-react';

/* ═══════════════════════════════════════════
   THEMED JOB CARD — Full Functionality
   ═══════════════════════════════════════════ */
const JobCard = ({ job, onProcess, onAutoShortlist, onAIRank, onAIInsights, onDecision, onViewCandidates, processing, rankings, insights }) => {
  const unprocessed = job.total_applications - job.processed_applications;
  const isProcessing = processing[job.job_id];
  const jobInsight = insights[job.job_id] || job.ai_insights;
  const jobRanking = rankings[job.job_id];

  const getScoreBadgeVariant = (score) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  };

  return (
    <Card className="overflow-hidden border-none shadow-sm">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#e0f2f1] flex items-center justify-center flex-shrink-0">
            <Briefcase size={24} className="text-[#009688]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">{job.job_title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-sm text-slate-500">{job.total_applications} applications</span>
              {unprocessed > 0 && (
                <Badge variant="warning">
                  <Clock size={12} className="mr-1" />
                  {unprocessed} pending
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Avg Match</p>
            <Badge variant={getScoreBadgeVariant(job.avgScore)}>{job.avgScore || 0}%</Badge>
          </div>
          <ScoreRing score={job.avgScore || 0} size={56} strokeWidth={5} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-slate-800">{job.total_applications}</p>
          <p className="text-xs text-slate-500">Total</p>
        </div>
        <div className="bg-[#e0f2f1] rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-[#009688]">{job.processed_applications}</p>
          <p className="text-xs text-slate-500">Processed</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{job.shortlist_count}</p>
          <p className="text-xs text-slate-500">Shortlisted</p>
        </div>
        <div className="bg-violet-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-violet-600">{job.approved_count}</p>
          <p className="text-xs text-slate-500">Approved</p>
        </div>
      </div>

      {/* Score Distribution */}
      <div className="mb-6 p-4 bg-slate-50 rounded-xl">
        <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <BarChart3 size={16} className="text-[#009688]" />
          Candidate Score Distribution
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Excellent', key: 'excellent', color: 'bg-emerald-500' },
            { label: 'Good', key: 'good', color: 'bg-blue-500' },
            { label: 'Fair', key: 'fair', color: 'bg-amber-500' },
            { label: 'Below', key: 'poor', color: 'bg-rose-500' },
          ].map((tier) => (
            <div key={tier.key} className="text-center">
              <div className={`${tier.color} h-2 rounded-full mb-1`} style={{
                opacity: (job.scoreBreakdown?.[tier.key] || 0) > 0 ? 1 : 0.3
              }} />
              <p className="text-xs font-semibold text-slate-700">{job.scoreBreakdown?.[tier.key] || 0}</p>
              <p className="text-[10px] text-slate-500">{tier.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights Panel */}
      {jobInsight && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-[#e0f2f1] to-[#e8f5e9] border border-[#009688]/20">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={18} className="text-[#009688]" />
            <span className="font-semibold text-slate-800">AI Executive Insights</span>
            {jobInsight.pool_quality && (
              <Badge variant={
                jobInsight.pool_quality === 'Excellent' ? 'excellent' :
                  jobInsight.pool_quality === 'Good' ? 'good' : 'warning'
              }>
                {jobInsight.pool_quality}
              </Badge>
            )}
          </div>

          {jobInsight.executive_summary ? (
            <>
              <p className="text-sm text-slate-600 mb-3">{jobInsight.executive_summary}</p>
              {jobInsight.top_recommendation && (
                <div className="flex items-start gap-2 bg-white rounded-lg p-3 border border-[#009688]/10">
                  <Sparkles size={14} className="text-[#009688] mt-0.5" />
                  <p className="text-sm text-slate-700">{jobInsight.top_recommendation}</p>
                </div>
              )}
              {jobInsight.key_concerns?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {jobInsight.key_concerns.map((c, i) => (
                    <span key={i} className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full flex items-center gap-1">
                      <AlertCircle size={10} /> {c}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500 italic">{jobInsight.insights || jobInsight.error || "Click 'AI Insights' to analyze this candidate pool."}</p>
          )}
        </div>
      )}

      {/* AI Ranking Results */}
      {jobRanking?.ranking?.ranked_candidates && (
        <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} className="text-amber-600" />
            <span className="font-semibold text-slate-800">AI Ranking Results</span>
          </div>

          {jobRanking.ranking.overall_analysis && (
            <p className="text-sm text-slate-500 mb-4 italic">{jobRanking.ranking.overall_analysis}</p>
          )}

          <div className="space-y-2">
            {jobRanking.ranking.ranked_candidates.slice(0, 5).map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-[#009688]/30 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' :
                  i === 1 ? 'bg-slate-200 text-slate-700' :
                    i === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-600'
                  }`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-800">{c.name || 'Candidate'}</p>
                  <p className="text-xs text-slate-500 truncate max-w-xs">{c.ranking_reason}</p>
                </div>
                <Badge variant={getScoreBadgeVariant(c.score)}>{c.score}%</Badge>
              </div>
            ))}
          </div>

          {jobRanking.shortlist?.shortlist_reasoning && (
            <div className="mt-4 p-3 rounded-lg bg-[#e0f2f1] border border-[#009688]/20">
              <p className="text-xs text-[#00796b]">
                <span className="font-semibold">Shortlist Reasoning:</span> {jobRanking.shortlist.shortlist_reasoning}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Top Candidates Quick Actions */}
      {job.topCandidates && job.topCandidates.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Star size={16} className="text-amber-500" />
            Top Candidates & Quick Actions
          </p>
          <div className="space-y-2">
            {job.topCandidates.map((c, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <Badge variant={getScoreBadgeVariant(c.match_score)}>{c.match_score}%</Badge>
                    <span className="text-[10px] text-slate-500 mt-1 uppercase">Match</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{c.candidate_name || 'Candidate'}</p>
                    <p className="text-xs text-slate-500">{c.recommendation || 'Pending'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!c.decision ? (
                    <>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => onDecision(job.job_id, c._id, 'shortlisted')}
                        disabled={processing[`dec_${c._id}`]}
                        icon={CheckCircle}
                      >
                        Shortlist
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDecision(job.job_id, c._id, 'rejected')}
                        disabled={processing[`dec_${c._id}`]}
                        icon={XCircle}
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <Badge variant={c.decision === 'rejected' ? 'danger' : 'success'}>
                      {c.decision === 'shortlisted' ? 'Shortlisted' : c.decision === 'hired' ? 'Hired' : 'Rejected'}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewCandidates(job.job_id)}
                    icon={Eye}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons — Themed */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-6 border-t border-slate-200">
        {unprocessed > 0 && (
          <Button
            variant="warning"
            onClick={() => onProcess(job.job_id)}
            disabled={isProcessing}
            icon={Zap}
            className="rounded-full px-6 shadow-sm hover:shadow-md"
          >
            {isProcessing ? 'Processing...' : `Process ${unprocessed}`}
          </Button>
        )}
        {job.processed_applications > 0 && (
          <>
            <Button
              variant="primary"
              onClick={() => onAIRank(job.job_id)}
              disabled={processing[`rank_${job.job_id}`]}
              icon={Trophy}
              className="rounded-full px-6 shadow-sm hover:shadow-md bg-gradient-to-r from-[#009688] to-[#00796b] border-none"
            >
              {processing[`rank_${job.job_id}`] ? 'Ranking...' : 'AI Rank & Shortlist'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => onAIInsights(job.job_id)}
              disabled={processing[`insight_${job.job_id}`]}
              icon={Lightbulb}
              className="rounded-full px-6 shadow-sm hover:shadow-md"
            >
              {processing[`insight_${job.job_id}`] ? 'Analyzing...' : 'AI Insights'}
            </Button>
            <Button
              variant="primary"
              onClick={() => onAutoShortlist(job.job_id)}
              disabled={isProcessing}
              icon={Target}
              className="rounded-full px-6 shadow-sm hover:shadow-md"
            >
              Auto-Shortlist (70%+)
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          onClick={() => onViewCandidates(job.job_id)}
          icon={Users}
          className="rounded-full px-6 hover:bg-slate-100 text-slate-600"
        >
          View All Candidates
        </Button>
      </div>
    </Card>
  );
};

/* ═══════════════════════════════════════════
   THEMED PORTFOLIO SUMMARY
   ═══════════════════════════════════════════ */
const PortfolioSummary = ({ dashboard }) => {
  if (!dashboard?.jobs?.length) return null;

  const totalAvgScore = dashboard.jobs.length > 0
    ? Math.round(dashboard.jobs.reduce((sum, job) => sum + (job.avgScore || 0), 0) / dashboard.jobs.length)
    : 0;

  const scoreTiers = [
    { label: 'Excellent (80+)', key: 'excellent', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Good (60-79)', key: 'good', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Fair (40-59)', key: 'fair', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Below 40', key: 'poor', color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <Card className="border-none shadow-sm border-l-4 border-l-[#009688]">
      <SectionHeader
        title="Portfolio Performance"
        subtitle="Overview of all your job postings and candidate quality"
        icon={BarChart3}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className={`${scoreTiers[0].bg} rounded-xl p-4 text-center`}>
          <p className={`text-3xl font-bold text-[#009688]`}>{totalAvgScore}%</p>
          <p className="text-xs text-slate-600 mt-1">Avg Score</p>
        </div>

        {scoreTiers.map((tier) => {
          const count = dashboard.jobs.reduce((sum, job) => sum + (job.scoreBreakdown?.[tier.key] || 0), 0);
          return (
            <div key={tier.key} className={`${tier.bg} rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${tier.color}`}>{count}</p>
              <p className="text-xs text-slate-600 mt-1">{tier.label}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

/* ═══════════════════════════════════════════
   MAIN RECRUITER DASHBOARD
   ═══════════════════════════════════════════ */
export const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const { dashboard: cachedData, setDashboardData } = useAuthStore(state => ({ 
    dashboard: state.dashboardData, 
    setDashboardData: state.setDashboardData 
  }));
  const [dashboard, setDashboard] = useState(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState({});
  const [rankings, setRankings] = useState({});
  const [insights, setInsights] = useState({});

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await apiClient.get('/recruiter/dashboard');
      const enrichedData = enrichDashboardWithScores(response.data);
      setDashboard(enrichedData);
      setDashboardData(enrichedData);
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

  const pendingCount = dashboard?.jobs?.reduce((sum, job) => sum + (job.total_applications - job.processed_applications), 0) || 0;

  /* ── Loading State ── */
  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in-up">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="border-none shadow-sm">
              <Skeleton className="h-12 w-12 rounded-xl mb-4" />
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </Card>
          ))}
        </div>
        <Card className="border-none shadow-sm">
          <Skeleton className="h-6 w-48 mb-6" />
          <div className="grid grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </Card>
        <div className="space-y-6">
          {[1, 2].map(i => (
            <Card key={i}>
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  /* ── Main Render ── */
  return (
    <div className="space-y-8">
      {/* Alerts */}
      {error && <Alert type="danger" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Stats Grid — Themed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <RecruiterStatCard
          label="Active Jobs"
          value={dashboard?.total_jobs || 0}
          trend={3}
          icon={Briefcase}
          color="blue"
        />
        <RecruiterStatCard
          label="Total Applications"
          value={dashboard?.total_applications || 0}
          trend={12}
          icon={Users}
          color="purple"
        />
        <RecruiterStatCard
          label="Processed"
          value={dashboard?.total_processed || 0}
          trend={8}
          icon={CheckCircle}
          color="emerald"
        />
        <RecruiterStatCard
          label="Pending Review"
          value={pendingCount}
          trend={pendingCount > 0 ? -2 : 0}
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Middle Section: Portfolio + AI Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <PortfolioSummary dashboard={dashboard} />
        </div>

        {/* AI Insight of the Day — Premium Dark Card */}
        <div className="bg-[#0f172a] rounded-3xl p-8 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#009688]/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-[#009688]/20 transition-colors"></div>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#009688] flex items-center justify-center shadow-lg shadow-[#009688]/20">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-widest text-[#009688]">AI Insight</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Daily Optimization</p>
            </div>
          </div>

          <h3 className="text-xl font-bold leading-tight mb-4">
            {pendingCount > 0 ? (
              <>You have <span className="text-[#009688]">{pendingCount} unprocessed</span> applications awaiting AI analysis.</>
            ) : (
              <>All caught up! Your candidate pipeline is <span className="text-[#009688]">fully analyzed</span>.</>
            )}
          </h3>

          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            {pendingCount > 0
              ? "Process pending applications to unlock AI-powered ranking, shortlisting, and executive insights for each role."
              : "Use AI Rank & Shortlist on your jobs to find the best candidates automatically."
            }
          </p>

          <button
            onClick={() => navigate('/post-job')}
            className="flex items-center gap-2 group/btn"
          >
            <span className="text-xs font-black uppercase tracking-widest text-[#009688]">Post New Job</span>
            <ArrowRight size={16} className="text-[#009688] group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Active Jobs — Full Functionality */}
      <div>
        <SectionHeader
          title="Active Jobs"
          subtitle="Manage your job postings and review AI-powered candidate analysis"
          icon={Briefcase}
          action={
            <Button variant="primary" onClick={() => navigate('/post-job')} icon={PlusCircle}>
              Post New Job
            </Button>
          }
        />

        {dashboard?.jobs && dashboard.jobs.length > 0 ? (
          <div className="space-y-6">
            {dashboard.jobs.map(job => (
              <JobCard
                key={job.job_id}
                job={job}
                onProcess={handleProcessApplications}
                onAutoShortlist={handleAutoShortlist}
                onAIRank={handleAIRank}
                onAIInsights={handleAIInsights}
                onDecision={handleDecision}
                onViewCandidates={handleViewCandidates}
                processing={processing}
                rankings={rankings}
                insights={insights}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title="No jobs posted yet"
            description="Create your first job posting to start receiving AI-analyzed candidate applications."
            action={<Button onClick={() => navigate('/post-job')} icon={PlusCircle}>Create First Job</Button>}
          />
        )}
      </div>
    </div>
  );
};
