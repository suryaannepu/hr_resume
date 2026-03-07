import React, { useState, useEffect } from 'react';
import apiClient from '../utils/api';
import { Navigation } from '../components/Navigation';
import { Card, Button, Badge, ScoreBar, Loading, Alert } from '../components/Common';
import './Dashboard.css';

export const RecruiterDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState({});
  const [expandedJob, setExpandedJob] = useState(null);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 5000); // Refresh every 5 seconds for auto-score updates
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
    // Calculate score statistics for each job
    const jobsWithScores = data.jobs?.map(job => {
      const processedApps = job.applications?.filter(app => app.status === 'processed') || [];
      const scores = processedApps.map(app => app.match_score || 0);
      
      const avgScore = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      const scoreBreakdown = {
        excellent: scores.filter(s => s >= 80).length,
        good: scores.filter(s => s >= 60 && s < 80).length,
        fair: scores.filter(s => s >= 40 && s < 60).length,
        poor: scores.filter(s => s < 40).length
      };

      return {
        ...job,
        avgScore,
        scoreBreakdown,
        topCandidates: processedApps
          .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
          .slice(0, 3)
      };
    }) || [];

    return {
      ...data,
      jobs: jobsWithScores
    };
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  };

  const handleProcessApplications = async (jobId) => {
    setProcessing({ ...processing, [jobId]: true });
    try {
      const response = await apiClient.post(`/recruiter/job/${jobId}/process-pending`);
      setSuccess(`Processing ${response.data.submitted_count} applications...`);
      setTimeout(() => {
        fetchDashboard();
        setProcessing({ ...processing, [jobId]: false });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process applications');
      setProcessing({ ...processing, [jobId]: false });
    }
  };

  const handleAutoShortlist = async (jobId) => {
    setProcessing({ ...processing, [jobId]: true });
    try {
      const response = await apiClient.post(`/recruiter/job/${jobId}/auto-shortlist`, {
        threshold: 70
      });
      setSuccess(`Auto-shortlisted ${response.data.shortlisted_count} candidates!`);
      setTimeout(() => {
        fetchDashboard();
        setProcessing({ ...processing, [jobId]: false });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to auto-shortlist candidates');
      setProcessing({ ...processing, [jobId]: false });
    }
  };

  const handleViewCandidates = (jobId) => {
    window.location.href = `/job/${jobId}/candidates`;
  };

  if (loading) return <Loading />;

  const pendingCount = dashboard?.jobs?.reduce((sum, job) => 
    sum + (job.total_applications - job.processed_applications), 0) || 0;

  const totalAvgScore = dashboard?.jobs?.length > 0
    ? Math.round(
        dashboard.jobs.reduce((sum, job) => sum + (job.avgScore || 0), 0) / dashboard.jobs.length
      )
    : 0;

  return (
    <>
      <Navigation userRole="recruiter" />
      <div className="dashboard-container">
        <div className="container p-4">
          <div className="dashboard-header">
            <div>
              <h1>Recruiter Dashboard</h1>
              {pendingCount > 0 && (
                <p style={{ color: 'var(--warning-color)', fontWeight: 600, marginTop: '0.5rem' }}>
                  {pendingCount} applications awaiting processing
                </p>
              )}
            </div>
            <Button variant="primary" onClick={() => window.location.href = '/post-job'}>
              + Post New Job
            </Button>
          </div>

          {error && <Alert type="danger" message={error} onClose={() => setError('')} />}
          {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

          <div className="stats-grid">
            <Card>
              <div className="stat-box">
                <div className="stat-number">{dashboard?.total_jobs || 0}</div>
                <div className="stat-label">Active Jobs</div>
              </div>
            </Card>
            <Card>
              <div className="stat-box">
                <div className="stat-number">{dashboard?.total_applications || 0}</div>
                <div className="stat-label">Total Applications</div>
              </div>
            </Card>
            <Card>
              <div className="stat-box">
                <div className="stat-number">{dashboard?.total_processed || 0}</div>
                <div className="stat-label">Processed</div>
              </div>
            </Card>
            <Card>
              <div className="stat-box">
                <div className="stat-number" style={{ color: '#f59e0b' }}>{pendingCount}</div>
                <div className="stat-label">Pending</div>
              </div>
            </Card>
          </div>

          {/* Overall Score Summary */}
          {dashboard?.jobs?.length > 0 && (
            <Card style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Portfolio Performance</h3>
              <div className="candidates-summary">
                <div className="score-summary-item">
                  <div className="score-summary-count">{totalAvgScore}</div>
                  <div className="score-summary-label">Average Score</div>
                </div>
                {[80, 60, 40, 0].map((threshold, idx) => {
                  const qualityTier = ['Excellent (80+)', 'Good (60-79)', 'Fair (40-59)', 'Below 40'];
                  const count = dashboard.jobs.reduce((sum, job) => {
                    return sum + (job.scoreBreakdown?.[['excellent', 'good', 'fair', 'poor'][idx]] || 0);
                  }, 0);
                  const colors = ['#0cce6b', '#0284c7', '#d97706', '#ff4d5a'];
                  
                  return (
                    <div key={idx} className="score-summary-item">
                      <div className="score-summary-count" style={{ color: colors[idx] }}>
                        {count}
                      </div>
                      <div className="score-summary-label">{qualityTier[idx]}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <div className="jobs-list">
            <h2>Job Postings</h2>
            {dashboard?.jobs && dashboard.jobs.length > 0 ? (
              dashboard.jobs.map(job => {
                const unprocessed = job.total_applications - job.processed_applications;
                const isProcessing = processing[job.job_id];
                
                return (
                  <Card key={job.job_id} className={`job-card ${isProcessing ? 'processing' : ''}`}>
                    <div className="job-header">
                      <div style={{ flex: 1 }}>
                        <h3>{job.job_title}</h3>
                        <p className="job-meta">
                          <span>  {job.total_applications} applications</span>
                          {unprocessed > 0 && (
                            <span style={{ color: 'var(--warning-color)', fontWeight: 600 }}>
                               {unprocessed} pending
                            </span>
                          )}
                        </p>
                      </div>
                      <Badge variant={unprocessed > 0 ? 'warning' : 'success'}>
                        {job.processed_applications}/{job.total_applications} processed
                      </Badge>
                    </div>

                    {/* Score Display */}
                    {job.processed_applications > 0 && (
                      <div className="candidate-score-section">
                        <div className="score-display">
                          <div>
                            <div className="score-value">{job.avgScore}</div>
                            <div className="score-label">Average Score</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <Badge variant={job.avgScore >= 80 ? 'success' : job.avgScore >= 60 ? 'primary' : 'warning'}>
                            {job.avgScore >= 80 ? 'Excellent Pool' : job.avgScore >= 60 ? 'Good Pool' : 'Mixed Quality'}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Score Breakdown */}
                    {job.processed_applications > 0 && (
                      <div className="candidates-summary">
                        <div className="score-summary-item">
                          <div className="score-summary-count" style={{ color: '#0cce6b' }}>
                            {job.scoreBreakdown?.excellent || 0}
                          </div>
                          <div className="score-summary-label">Excellent</div>
                        </div>
                        <div className="score-summary-item">
                          <div className="score-summary-count" style={{ color: '#0284c7' }}>
                            {job.scoreBreakdown?.good || 0}
                          </div>
                          <div className="score-summary-label">Good</div>
                        </div>
                        <div className="score-summary-item">
                          <div className="score-summary-count" style={{ color: '#d97706' }}>
                            {job.scoreBreakdown?.fair || 0}
                          </div>
                          <div className="score-summary-label">Fair</div>
                        </div>
                        <div className="score-summary-item">
                          <div className="score-summary-count" style={{ color: '#ff4d5a' }}>
                            {job.scoreBreakdown?.poor || 0}
                          </div>
                          <div className="score-summary-label">Below 40</div>
                        </div>
                      </div>
                    )}

                    {/* Top Candidates Preview */}
                    {job.topCandidates && job.topCandidates.length > 0 && (
                      <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: 'var(--border-radius-lg)' }}>
                        <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem', color: 'var(--gray-700)' }}>Top Candidates</h4>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                          {job.topCandidates.map((candidate, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'white', borderRadius: 'var(--border-radius)', border: '1px solid var(--gray-200)' }}>
                              <div>
                                <p style={{ margin: 0, fontWeight: 600, color: 'var(--gray-900)' }}>
                                  {candidate.candidate_name || 'Candidate'}
                                </p>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                                  {candidate.recommendation || 'Pending Review'}
                                </p>
                              </div>
                              <Badge variant={getScoreBadge(candidate.match_score)}>
                                {candidate.match_score}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="job-stats">
                      <div className="job-stat">
                        <span className="stat-label">Total</span>
                        <span className="stat-value">{job.total_applications}</span>
                      </div>
                      <div className="job-stat">
                        <span className="stat-label">Processed</span>
                        <span className="stat-value">{job.processed_applications}</span>
                      </div>
                      <div className="job-stat">
                        <span className="stat-label">Shortlisted</span>
                        <span className="stat-value">{job.shortlist_count}</span>
                      </div>
                      <div className="job-stat">
                        <span className="stat-label">Approved</span>
                        <span className="stat-value">{job.approved_count}</span>
                      </div>
                    </div>

                    <div className="job-actions">
                      {unprocessed > 0 && (
                        <Button 
                          variant="primary"
                          onClick={() => handleProcessApplications(job.job_id)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Processing...' : `Process ${unprocessed}`}
                        </Button>
                      )}
                      {job.processed_applications > 0 && (
                        <Button 
                          variant={unprocessed > 0 ? 'secondary' : 'primary'}
                          onClick={() => handleAutoShortlist(job.job_id)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Shortlisting...' : 'Auto-Shortlist'}
                        </Button>
                      )}
                      <Button 
                        variant="secondary"
                        onClick={() => handleViewCandidates(job.job_id)}
                      >
                        View Candidates
                      </Button>
                    </div>
                  </Card>
                );
              })
            ) : (
              <p style={{ color: 'var(--gray-600)', fontSize: '1rem', marginTop: '2rem' }}>
                No jobs posted yet. <a href="/post-job">Create one</a>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
