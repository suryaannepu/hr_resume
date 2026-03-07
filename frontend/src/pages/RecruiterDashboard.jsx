import React, { useState, useEffect } from 'react';
import apiClient from '../utils/api';
import { Navigation } from '../components/Navigation';
import { Card, Button, Badge, ScoreBar, Loading, Alert } from '../components/Common';
import './Dashboard.css';

export const RecruiterDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedJob, setExpandedJob] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await apiClient.get('/recruiter/dashboard');
      setDashboard(response.data);
    } catch (err) {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCandidates = (jobId) => {
    window.location.href = `/job/${jobId}/candidates`;
  };

  if (loading) return <Loading />;

  return (
    <>
      <Navigation userRole="recruiter" />
      <div className="dashboard-container">
        <div className="container p-4">
          <div className="dashboard-header">
            <h1>Recruiter Dashboard</h1>
            <Button variant="primary" onClick={() => window.location.href = '/post-job'}>
              + Post New Job
            </Button>
          </div>

          {error && <Alert type="danger" message={error} />}

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
          </div>

          <div className="jobs-list">
            <h2>Job Postings</h2>
            {dashboard?.jobs && dashboard.jobs.length > 0 ? (
              dashboard.jobs.map(job => (
                <Card key={job.job_id} className="job-card">
                  <div className="job-header">
                    <div>
                      <h3>{job.job_title}</h3>
                      <p className="job-meta">Posted • {job.total_applications} applications</p>
                    </div>
                    <Badge variant="primary">{job.processed_applications} processed</Badge>
                  </div>

                  <div className="job-stats">
                    <div className="job-stat">
                      <span className="stat-label">Total Applications</span>
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
                    <Button 
                      variant="primary"
                      onClick={() => handleViewCandidates(job.job_id)}
                    >
                      View Candidates
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <p className="empty-state">No jobs posted yet. <a href="/post-job">Create one</a></p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
