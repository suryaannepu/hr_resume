import React, { useEffect, useState } from 'react';
import apiClient from '../utils/api';
import { Navigation } from '../components/Navigation';
import { Card, Badge, ScoreBar, Loading, Alert, Button, Modal } from '../components/Common';
import './Dashboard.css';

export const CandidateDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    const hasPending = applications.some(app => ['uploaded', 'processing'].includes(app.status));
    if (!hasPending) return;

    const id = setInterval(() => {
      fetchApplications();
    }, 4000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applications]);

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
          <div className="dashboard-header">
            <h1>My Applications</h1>
            {applications.some(app => app.status === 'processing') && (
              <Badge variant="primary">Live updating…</Badge>
            )}
          </div>

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

                  {(app.status === 'processed' || app.status === 'processing') && (
                    <div className="application-results">
                      <div className="result-section">
                        <label>Match Score</label>
                        <ScoreBar score={app.match_score} max={100} />
                        {app.status === 'processing' && (
                          <p style={{ marginTop: '0.5rem' }}>
                            AI agents are analyzing your resume… {app.processing_step ? `(${app.processing_step})` : ''}
                          </p>
                        )}
                      </div>

                      <div className="result-row">
                        <div className="result-col">
                          <label>Recommendation</label>
                          <p>{app.recommendation || 'Pending'}</p>
                        </div>
                        <div className="result-col">
                          <label>Confidence</label>
                          <p>{app.confidence_score != null ? `${app.confidence_score}%` : '—'}</p>
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

                      {app.status === 'processed' && (
                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setSelected(app);
                              setShowModal(true);
                            }}
                          >
                            View AI Report
                          </Button>
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

      <Modal
        isOpen={showModal}
        title="AI Resume Report"
        onClose={() => setShowModal(false)}
      >
        {selected ? (
          <div className="ai-report">
            <div className="ai-report-header">
              <div>
                <h3 style={{ marginBottom: '0.25rem' }}>{selected.candidate_name || 'Candidate'}</h3>
                <p style={{ margin: 0 }}>Recommendation: <strong>{selected.recommendation}</strong></p>
              </div>
              <div style={{ minWidth: 160 }}>
                <label>Final Score</label>
                <ScoreBar score={selected.match_score} />
              </div>
            </div>

            {selected.committee_packet?.summary_for_candidate && (
              <div className="result-section">
                <label>Summary</label>
                <p style={{ whiteSpace: 'pre-wrap' }}>{selected.committee_packet.summary_for_candidate}</p>
              </div>
            )}

            {selected.interview_focus?.length > 0 && (
              <div className="result-section">
                <label>Interview Focus Areas</label>
                <ul className="bullet-list">
                  {selected.interview_focus.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>
            )}

            {selected.candidate_coaching?.short_message && (
              <div className="result-section">
                <label>Coach Note</label>
                <p style={{ whiteSpace: 'pre-wrap' }}>{selected.candidate_coaching.short_message}</p>
              </div>
            )}

            {selected.candidate_coaching?.resume_improvements?.length > 0 && (
              <div className="result-section">
                <label>Resume Improvements</label>
                <ul className="bullet-list">
                  {selected.candidate_coaching.resume_improvements.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </>
  );
};
