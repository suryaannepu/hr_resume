import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../utils/api';
import { Navigation } from '../components/Navigation';
import { Card, Button, Badge, ScoreBar, Modal, Loading, Alert } from '../components/Common';
import './Dashboard.css';

export const JobCandidates = () => {
  const { jobId } = useParams();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, [jobId]);

  useEffect(() => {
    const hasPending = candidates.some(c => c.status && c.status !== 'processed' && c.status !== 'failed');
    if (!hasPending) return;

    const id = setInterval(() => {
      fetchCandidates();
    }, 4000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates]);

  const fetchCandidates = async () => {
    try {
      const response = await apiClient.get(`/recruiter/job/${jobId}/ranked-candidates`);
      setCandidates(response.data.candidates);
    } catch (err) {
      setError('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCandidate = (candidateId) => {
    setSelectedCandidates(prev =>
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleApproveShortlist = async () => {
    try {
      await apiClient.post(`/recruiter/job/${jobId}/shortlist/approve`, {
        candidate_ids: selectedCandidates
      });
      await fetchCandidates();
      setSelectedCandidates([]);
      setShowModal(false);
    } catch (err) {
      setError('Failed to approve shortlist');
    }
  };

  const openCandidateDetail = async (applicationId) => {
    try {
      setDetailLoading(true);
      setDetailModalOpen(true);
      const res = await apiClient.get(`/recruiter/job/${jobId}/candidate/${applicationId}`);
      setSelectedCandidate(res.data.application);
    } catch (e) {
      setError('Failed to load candidate details');
      setDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      <Navigation userRole="recruiter" />
      <div className="dashboard-container">
        <div className="container p-4">
          <div className="candidates-header">
            <h1>Ranked Candidates</h1>
            {selectedCandidates.length > 0 && (
              <Button 
                variant="success"
                onClick={() => setShowModal(true)}
              >
                Approve {selectedCandidates.length} Candidate{selectedCandidates.length !== 1 ? 's' : ''}
              </Button>
            )}
          </div>

          {error && <Alert type="danger" message={error} />}

          <div className="candidates-list">
            {candidates.map(candidate => (
              <Card key={candidate._id} className="candidate-card">
                <div className="candidate-header">
                  <div className="candidate-info">
                    <input
                      type="checkbox"
                      checked={selectedCandidates.includes(candidate._id)}
                      onChange={() => handleSelectCandidate(candidate._id)}
                      className="candidate-checkbox"
                      disabled={candidate.status !== 'processed'}
                    />
                    <div>
                      <h3>{candidate.candidate_name || 'Candidate'}</h3>
                      <p>{candidate.candidate_email}</p>
                    </div>
                  </div>
                  <Badge variant={
                    candidate.status !== 'processed' ? 'primary' :
                    candidate.match_score >= 70 ? 'success' :
                    candidate.match_score >= 50 ? 'warning' : 'danger'
                  }>
                    {candidate.status !== 'processed'
                      ? (candidate.status ? candidate.status.toUpperCase() : 'PENDING')
                      : `Rank #${candidate.rank}`}
                  </Badge>
                </div>

                <div className="candidate-details">
                  <div className="detail-section">
                    <label>Match Score</label>
                    <ScoreBar score={candidate.match_score} />
                  </div>

                  <div className="detail-row">
                    <div className="detail-col">
                      <label>Years of Experience</label>
                      <span>{candidate.years_experience || 'N/A'}</span>
                    </div>
                    <div className="detail-col">
                      <label>Education</label>
                      <span>{candidate.education || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <label>Skills</label>
                    <div className="skills-list">
                      {candidate.candidate_skills?.map(skill => (
                        <Badge key={skill} variant="primary">{skill}</Badge>
                      ))}
                    </div>
                  </div>

                  {candidate.key_strengths && candidate.key_strengths.length > 0 && (
                    <div className="detail-section">
                      <label>Strengths</label>
                      <ul className="bullet-list">
                        {candidate.key_strengths.map((strength, idx) => (
                          <li key={idx}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {candidate.skill_gaps && candidate.skill_gaps.length > 0 && (
                    <div className="detail-section">
                      <label>Skill Gaps</label>
                      <ul className="bullet-list">
                        {candidate.skill_gaps.map((gap, idx) => (
                          <li key={idx}>{gap}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="detail-section">
                    <label>Recommendation</label>
                    <Badge variant={
                      candidate.recommendation === 'Strong Fit' ? 'success' :
                      candidate.recommendation === 'Good Fit' ? 'primary' :
                      candidate.recommendation === 'Fair Fit' ? 'warning' :
                      'danger'
                    }>
                      {candidate.recommendation || 'Pending'}
                    </Badge>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <Button
                      variant="secondary"
                      onClick={() => openCandidateDetail(candidate._id)}
                    >
                      View AI Report
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {candidates.length === 0 && (
            <p className="empty-state">No candidates found for this job.</p>
          )}
        </div>
      </div>

      <Modal 
        isOpen={showModal}
        title="Confirm Shortlist"
        onClose={() => setShowModal(false)}
      >
        <p>Are you sure you want to shortlist {selectedCandidates.length} candidate{selectedCandidates.length !== 1 ? 's' : ''}?</p>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="success" onClick={handleApproveShortlist}>Confirm Shortlist</Button>
        </div>
      </Modal>

      <Modal
        isOpen={detailModalOpen}
        title="Candidate AI Report"
        onClose={() => setDetailModalOpen(false)}
      >
        {detailLoading ? (
          <Loading />
        ) : selectedCandidate ? (
          <div className="ai-report">
            {selectedCandidate.committee_packet?.summary_for_recruiter && (
              <div className="result-section">
                <label>Committee Summary</label>
                <p style={{ whiteSpace: 'pre-wrap' }}>{selectedCandidate.committee_packet.summary_for_recruiter}</p>
              </div>
            )}

            <div className="result-row">
              <div className="result-col">
                <label>Final Recommendation</label>
                <p><strong>{selectedCandidate.recommendation || '—'}</strong></p>
              </div>
              <div className="result-col">
                <label>Risk Level</label>
                <p><strong>{selectedCandidate.risk_level || 'Low'}</strong></p>
              </div>
            </div>

            {selectedCandidate.verification_questions?.length > 0 && (
              <div className="result-section">
                <label>Verification Questions</label>
                <ul className="bullet-list">
                  {selectedCandidate.verification_questions.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>
            )}

            {selectedCandidate.interview_plan?.interview_questions?.length > 0 && (
              <div className="result-section">
                <label>Interview Plan</label>
                <div className="interview-questions">
                  {selectedCandidate.interview_plan.interview_questions.map((q, i) => (
                    <div key={i} className="interview-q">
                      <div className="interview-q-head">
                        <Badge variant="primary">{q.round || 'Round'}</Badge>
                        <Badge variant="default">{q.type || 'Question'}</Badge>
                      </div>
                      <p style={{ marginTop: '0.5rem' }}><strong>{q.question}</strong></p>
                      {q.what_good_looks_like && (
                        <p style={{ marginTop: '0.25rem' }}>{q.what_good_looks_like}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Alert type="warning" message="No report available yet." />
        )}
      </Modal>
    </>
  );
};
