import React, { useEffect, useState } from 'react';
import apiClient from '../utils/api';
import { Navigation } from '../components/Navigation';
import { Card, Badge, ScoreBar, Loading, Alert } from '../components/Common';
import './Dashboard.css';

export const CandidateDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await apiClient.get('/applications/candidate/all');
      setApplications(response.data.applications);
    } catch (err) {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      <Navigation userRole="candidate" />
      <div className="dashboard-container">
        <div className="container p-4">
          <h1>My Applications</h1>

          {error && <Alert type="danger" message={error} />}

          {applications.length > 0 ? (
            <div className="applications-list">
              {applications.map(app => (
                <Card key={app._id} className="application-card">
                  <div className="application-header">
                    <div>
                      <h3>Application Submitted</h3>
                      <p className="app-date">
                        {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={
                      app.status === 'processed' ? 'success' :
                      app.status === 'failed' ? 'danger' :
                      'primary'
                    }>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </Badge>
                  </div>

                  {app.status === 'processed' && (
                    <div className="application-results">
                      <div className="result-section">
                        <label>Match Score</label>
                        <ScoreBar score={app.match_score} max={100} />
                      </div>

                      <div className="result-row">
                        <div className="result-col">
                          <label>Recommendation</label>
                          <p>{app.recommendation}</p>
                        </div>
                        <div className="result-col">
                          <label>Confidence</label>
                          <p>{app.confidence_score}%</p>
                        </div>
                      </div>

                      {app.key_strengths && app.key_strengths.length > 0 && (
                        <div className="result-section">
                          <label>Your Strengths</label>
                          <ul className="bullet-list">
                            {app.key_strengths.map((strength, idx) => (
                              <li key={idx}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {app.skill_gaps && app.skill_gaps.length > 0 && (
                        <div className="result-section">
                          <label>Areas to Improve</label>
                          <ul className="bullet-list">
                            {app.skill_gaps.map((gap, idx) => (
                              <li key={idx}>{gap}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <p className="empty-state">
              No applications yet. <a href="/jobs">Browse jobs</a>
            </p>
          )}
        </div>
      </div>
    </>
  );
};
