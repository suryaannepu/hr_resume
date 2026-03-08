import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import { Navigation } from '../components/Navigation';
import { Card, Button, Badge, Modal, Loading, Alert, ScoreRing, AgentCard, AgentPipelineVisualizer, Tabs, SkillBadge } from '../components/Common';

export const JobCandidates = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [processingDecision, setProcessingDecision] = useState({});

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

  const handleDecision = async (applicationId, decision) => {
    setProcessingDecision({ ...processingDecision, [applicationId]: true });
    try {
      const res = await apiClient.post(`/recruiter/job/${jobId}/candidate/${applicationId}/decision`, { decision });
      setSuccess(res.data.message || `Candidate ${decision} successfully`);
      await fetchCandidates();
    } catch (err) {
      setError(`Failed to process decision: ${err.response?.data?.error || err.message}`);
    } finally {
      setProcessingDecision({ ...processingDecision, [applicationId]: false });
    }
  };

  const openCandidateDetail = async (applicationId) => {
    try {
      setDetailLoading(true);
      setShowModal(true);
      setActiveTab('overview');
      const res = await apiClient.get(`/recruiter/job/${jobId}/candidate/${applicationId}`);
      setSelectedCandidate(res.data.application);
    } catch (e) {
      setError('Failed to load candidate details');
      setShowModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) return <><Navigation userRole="recruiter" /><Loading text="Loading roster..." /></>;

  const agentTabs = [
    { key: 'overview', icon: '📊', label: 'Summary' },
    { key: 'insights', icon: '💡', label: 'Insights' },
    { key: 'coach', icon: '🎓', label: 'Coach Msg' },
    { key: 'interview', icon: '🎤', label: 'Interview Plan' },
    { key: 'risk', icon: '🛡️', label: 'Risk Info' },
    { key: 'committee', icon: '⚖️', label: 'Committee' },
  ];

  const decisionBadgeVariants = {
    shortlisted: 'warning',
    rejected: 'danger',
    hired: 'success'
  };

  const statusBadgeVariants = {
    interview_pending: 'warning',
    interview_completed: 'emerald',
    hired: 'success',
    rejected: 'danger',
    processed: 'primary'
  };

  return (
    <>
      <Navigation userRole="recruiter" />
      <div className="min-h-screen bg-slate-925 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" className="!p-2" onClick={() => navigate('/recruiter/dashboard')}>
                  ← Back
                </Button>
                <h1 className="text-3xl font-bold text-white">Ranked Roster</h1>
              </div>
              <p className="text-slate-400 mt-2 ml-12">Select candidates for interviews or reject them from this view.</p>
            </div>
          </div>

          {error && <Alert type="danger" message={error} onClose={() => setError('')} />}
          {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

          <div className="space-y-4">
            {candidates.map(candidate => (
              <div key={candidate._id} className="glass-card">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left: Score & Basic Info */}
                  <div className="flex items-start gap-4 lg:w-1/3">
                    <ScoreRing score={candidate.match_score || 0} size={84} />
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {candidate.candidate_name || 'Candidate'}
                      </h3>
                      <p className="text-sm text-brand-300 mb-2">{candidate.candidate_email}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={statusBadgeVariants[candidate.status] || 'primary'}>
                          {candidate.status === 'processed' ? `Rank #${candidate.rank}` : candidate.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {candidate.interview_score > 0 && (
                          <Badge variant="emerald">Interview: {candidate.interview_score}%</Badge>
                        )}
                      </div>
                      <p className="text-sm mt-3 text-slate-400">
                        {candidate.years_experience || 0} YOE • {candidate.education || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Middle: AI Insights & Pipeline */}
                  <div className="flex-1 border-y lg:border-y-0 lg:border-l border-white/10 py-4 lg:py-0 lg:pl-6">
                    {candidate.status === 'processing' ? (
                      <div>
                        <AgentPipelineVisualizer status={candidate.status} agentOutputs={candidate.agent_outputs} />
                      </div>
                    ) : candidate.status === 'processed' ? (
                      <div className="space-y-4">
                        {candidate.recommendation && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 uppercase">AI Recommendation:</span>
                            <span className="text-sm font-semibold text-white">
                              {candidate.recommendation}
                            </span>
                          </div>
                        )}
                        {candidate.key_strengths?.length > 0 && (
                          <div>
                            <span className="text-xs text-emerald-400 uppercase tracking-wider mb-1 block">Top Strengths</span>
                            <ul className="text-sm text-slate-300 space-y-1">
                              {candidate.key_strengths.slice(0, 2).map((s, i) => <li key={i}>✓ {s}</li>)}
                            </ul>
                          </div>
                        )}
                        {candidate.skill_gaps?.length > 0 && (
                          <div>
                            <span className="text-xs text-amber-400 uppercase tracking-wider mb-1 block">Key Gaps</span>
                            <ul className="text-sm text-slate-400 space-y-1">
                              {candidate.skill_gaps.slice(0, 1).map((s, i) => <li key={i}>△ {s}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm">Waiting for upload finishing...</p>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col justify-center gap-3 lg:w-48">
                    <Button
                      variant="secondary"
                      onClick={() => openCandidateDetail(candidate._id)}
                      disabled={candidate.status !== 'processed'}
                    >
                      🤖 View AI Report
                    </Button>

                    {!candidate.decision && candidate.status === 'processed' && (
                      <>
                        <Button
                          variant="success"
                          onClick={() => handleDecision(candidate._id, 'shortlisted')}
                          disabled={processingDecision[candidate._id]}
                          className="flex items-center justify-center gap-2"
                        >
                          {processingDecision[candidate._id] ? 'Sending...' : '✓ Shortlist (Interview)'}
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDecision(candidate._id, 'rejected')}
                          disabled={processingDecision[candidate._id]}
                          className="flex items-center justify-center gap-2"
                        >
                          {processingDecision[candidate._id] ? 'Sending...' : '✗ Reject'}
                        </Button>
                      </>
                    )}

                    {candidate.status === 'interview_completed' && candidate.decision !== 'hired' && (
                      <Button
                        variant="success"
                        onClick={() => handleDecision(candidate._id, 'hired')}
                        disabled={processingDecision[candidate._id]}
                        className="flex items-center justify-center gap-2"
                        pulse
                      >
                        {processingDecision[candidate._id] ? 'Sending...' : '🏆 Final Hire & Email'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {candidates.length === 0 && (
              <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-6xl mb-4">👥</p>
                <p className="text-xl text-slate-400">No candidates in the roster yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Candidate Full AI Report Modal */}
      <Modal isOpen={showModal} title="Candidate AI Dossier" onClose={() => setShowModal(false)} size="xl">
        {detailLoading ? <Loading text="Loading full dossier..." /> : selectedCandidate ? (
          <div>
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-white/10">
              <ScoreRing score={selectedCandidate.match_score || 0} size={80} label="Match Score" />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold text-white">{selectedCandidate.candidate_name || 'Candidate'}</h3>
                  {selectedCandidate.decision && <Badge variant={decisionBadgeVariants[selectedCandidate.decision]}>{selectedCandidate.decision.toUpperCase()}</Badge>}
                </div>
                <p className="text-sm text-brand-300 mb-2">{selectedCandidate.candidate_email}</p>
                <Badge variant="primary">{selectedCandidate.recommendation || 'Pending'}</Badge>
              </div>
            </div>

            <Tabs tabs={agentTabs} activeTab={activeTab} onChange={setActiveTab} />

            <div className="mt-6 min-h-[400px]">
              {activeTab === 'overview' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <AgentCard icon="⚖️" title="Committee Summary" accentColor="emerald">
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {selectedCandidate.committee_packet?.summary_for_recruiter || "No committee summary available."}
                    </p>
                  </AgentCard>

                  <AgentCard icon="📊" title="Skills Highlights" accentColor="brand">
                    {selectedCandidate.matching_skills?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-slate-500 mb-2">Matched Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedCandidate.matching_skills.map((s, i) => <SkillBadge key={i} skill={s} matched />)}
                        </div>
                      </div>
                    )}
                    {selectedCandidate.missing_skills?.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 mb-2">Missing Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedCandidate.missing_skills.map((s, i) => <SkillBadge key={i} skill={s} missing />)}
                        </div>
                      </div>
                    )}
                  </AgentCard>
                </div>
              )}

              {activeTab === 'insights' && (
                <AgentCard icon="💡" title="AI Insights" accentColor="emerald">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-emerald-400 mb-2">Key Strengths</p>
                      <ul className="space-y-2">
                        {selectedCandidate.key_strengths?.map((s, i) => <li key={i} className="text-sm text-slate-300">✓ {s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs text-amber-400 mb-2">Skill Gaps</p>
                      <ul className="space-y-2">
                        {selectedCandidate.skill_gaps?.map((s, i) => <li key={i} className="text-sm text-slate-300">△ {s}</li>)}
                      </ul>
                    </div>
                  </div>
                </AgentCard>
              )}

              {activeTab === 'coach' && (
                <AgentCard icon="🎓" title="What Coach Agent Told Candidate" accentColor="purple">
                  <div className="space-y-4">
                    <p className="text-sm text-purple-200 p-4 bg-purple-500/10 rounded-xl">
                      "{selectedCandidate.candidate_coaching?.short_message || 'N/A'}"
                    </p>
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Resume Suggestions given to them:</p>
                      <ul className="space-y-1">
                        {selectedCandidate.candidate_coaching?.resume_improvements?.map((r, i) => <li key={i} className="text-sm text-slate-400">• {r}</li>)}
                      </ul>
                    </div>
                  </div>
                </AgentCard>
              )}

              {activeTab === 'interview' && (
                <AgentCard icon="🎤" title="Suggested Interview Plan" accentColor="brand">
                  <div className="space-y-4">
                    {selectedCandidate.interview_plan?.interview_questions?.map((q, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex gap-2 mb-2">
                          <Badge variant="primary">{q.round || 'Round'}</Badge>
                          <Badge variant="warning">{q.type || 'Type'}</Badge>
                        </div>
                        <p className="text-sm font-semibold text-white mb-2">{q.question}</p>
                        <p className="text-xs text-emerald-300 italic">✓ Ideal Answer: {q.what_good_looks_like}</p>
                      </div>
                    ))}
                    {(!selectedCandidate.interview_plan?.interview_questions || selectedCandidate.interview_plan?.interview_questions.length === 0) && (
                      <p className="text-sm text-slate-500">No interview questions generated.</p>
                    )}
                  </div>
                </AgentCard>
              )}

              {activeTab === 'risk' && (
                <AgentCard icon="🛡️" title="Risk Analysis" accentColor="amber">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-400">Determined Risk Level:</span>
                      <Badge variant={selectedCandidate.risk_level === 'High' ? 'danger' : selectedCandidate.risk_level === 'Medium' ? 'warning' : 'success'}>
                        {selectedCandidate.risk_level || 'Low'}
                      </Badge>
                    </div>
                    {selectedCandidate.verification_questions?.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 mb-2">Suggesting probing these areas during interview:</p>
                        <ul className="space-y-3">
                          {selectedCandidate.verification_questions.map((q, i) => (
                            <li key={i} className="text-sm text-amber-200">? {q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AgentCard>
              )}

              {activeTab === 'committee' && (
                <AgentCard icon="⚖️" title="Full Committee Output" accentColor="emerald">
                  <pre className="text-xs text-slate-400 bg-black/50 p-4 rounded-xl overflow-x-auto">
                    {JSON.stringify(selectedCandidate.committee_packet, null, 2)}
                  </pre>
                </AgentCard>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
            </div>
          </div>
        ) : <Alert type="warning" message="No data available" />}
      </Modal>
    </>
  );
};
