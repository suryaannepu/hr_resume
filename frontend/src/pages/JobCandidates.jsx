import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import { Navigation } from '../components/Navigation';
import { Card, Button, Badge, Modal, Loading, Alert, ScoreRing, AgentCard, AgentPipelineVisualizer, Tabs, SkillBadge } from '../components/Common';
import { BarChart3, Lightbulb, GraduationCap, Mic2, Shield, Scale, Users, BrainCircuit, Trophy, CheckCircle, XCircle, AlertTriangle, HelpCircle, ArrowLeft } from 'lucide-react';

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
    { key: 'overview', icon: <BarChart3 size={16} />, label: 'Summary' },
    { key: 'insights', icon: <Lightbulb size={16} />, label: 'Insights' },
    { key: 'coach', icon: <GraduationCap size={16} />, label: 'Coach Msg' },
    { key: 'interview', icon: <Mic2 size={16} />, label: 'Interview Plan' },
    { key: 'results', icon: <Trophy size={16} />, label: 'Performance' },
    { key: 'risk', icon: <Shield size={16} />, label: 'Risk Info' },
    { key: 'committee', icon: <Scale size={16} />, label: 'Committee' },
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
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" className="!p-2 text-slate-500 hover:text-slate-800" onClick={() => navigate('/recruiter-dashboard')} icon={ArrowLeft}>
                  Back
                </Button>
                <h1 className="text-3xl font-bold text-slate-800">Ranked Roster</h1>
              </div>
              <p className="text-slate-500 mt-2 ml-[88px]">Select candidates for interviews or reject them from this view.</p>
            </div>
          </div>

          {error && <Alert type="danger" message={error} onClose={() => setError('')} />}
          {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

          <div className="space-y-4">
            {candidates.map(candidate => (
              <Card key={candidate._id} className="overflow-hidden border border-slate-200">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left: Score & Basic Info */}
                  <div className="flex items-start gap-4 lg:w-1/3">
                    <ScoreRing score={candidate.match_score || 0} size={84} />
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        {candidate.candidate_name || 'Candidate'}
                      </h3>
                      <p className="text-sm font-medium text-blue-600 mb-2">{candidate.candidate_email}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant={statusBadgeVariants[candidate.status] || 'primary'}>
                          {candidate.status === 'processed' ? `Rank #${candidate.rank}` : candidate.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {candidate.interview_score > 0 && (
                          <Badge variant="success">Interview: {candidate.interview_score}%</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {candidate.years_experience || 0} YOE • {candidate.education || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Middle: AI Insights & Pipeline */}
                  <div className="flex-1 border-y lg:border-y-0 lg:border-l border-slate-200 py-4 lg:py-0 lg:pl-6">
                    {candidate.status === 'processing' ? (
                      <div>
                        <AgentPipelineVisualizer status={candidate.status} agentOutputs={candidate.agent_outputs} />
                      </div>
                    ) : ['processed', 'interview_pending', 'interview_completed', 'hired', 'rejected'].includes(candidate.status) && candidate.committee_packet ? (
                      <div className="space-y-4">
                        {candidate.recommendation && (
                          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100">
                            <span className="text-xs font-semibold uppercase tracking-wider">AI Rec:</span>
                            <span className="text-sm font-bold">
                              {candidate.recommendation}
                            </span>
                          </div>
                        )}
                        {candidate.key_strengths?.length > 0 && (
                          <div>
                            <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wider mb-2 block flex items-center gap-1.5"><CheckCircle size={12} /> Top Strengths</span>
                            <ul className="text-sm text-slate-600 space-y-1">
                              {candidate.key_strengths.slice(0, 2).map((s, i) => <li key={i} className="flex items-start gap-1"><span className="text-emerald-500">•</span> {s}</li>)}
                            </ul>
                          </div>
                        )}
                        {candidate.skill_gaps?.length > 0 && (
                          <div className="pt-2">
                            <span className="text-xs text-amber-600 font-semibold uppercase tracking-wider mb-2 block flex items-center gap-1.5"><AlertTriangle size={12} /> Key Gaps</span>
                            <ul className="text-sm text-slate-600 space-y-1">
                              {candidate.skill_gaps.slice(0, 1).map((s, i) => <li key={i} className="flex items-start gap-1"><span className="text-amber-500">•</span> {s}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm flex items-center justify-center h-full">Waiting for upload finishing...</p>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col justify-center gap-3 lg:w-56">
                    <Button
                      variant="secondary"
                      onClick={() => openCandidateDetail(candidate._id)}
                      disabled={!['processed', 'interview_pending', 'interview_completed', 'hired', 'rejected'].includes(candidate.status)}
                      icon={BrainCircuit}
                      className="w-full justify-center"
                    >
                      View AI Report
                    </Button>

                    {!candidate.decision && candidate.status === 'processed' && (
                      <>
                        <Button
                          variant="success"
                          onClick={() => handleDecision(candidate._id, 'shortlisted')}
                          disabled={processingDecision[candidate._id]}
                          className="w-full justify-center"
                          icon={CheckCircle}
                        >
                          {processingDecision[candidate._id] ? 'Sending...' : 'Shortlist'}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleDecision(candidate._id, 'rejected')}
                          disabled={processingDecision[candidate._id]}
                          className="w-full justify-center text-rose-600 hover:bg-rose-50"
                          icon={XCircle}
                        >
                          {processingDecision[candidate._id] ? 'Sending...' : 'Reject'}
                        </Button>
                      </>
                    )}

                    {candidate.status === 'interview_completed' && candidate.decision !== 'hired' && (
                      <Button
                        variant="success"
                        onClick={() => handleDecision(candidate._id, 'hired')}
                        disabled={processingDecision[candidate._id]}
                        className="w-full justify-center shadow-lg shadow-emerald-500/20"
                        icon={Trophy}
                      >
                        {processingDecision[candidate._id] ? 'Sending...' : 'Final Hire & Email'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {candidates.length === 0 && (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <div className="w-16 h-16 bg-blue-50 text-blue-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users size={32} />
                </div>
                <p className="text-xl font-bold text-slate-700 mb-2">No candidates yet</p>
                <p className="text-slate-500 max-w-sm mx-auto">This job has no candidates in the roster. Applications will appear here once processed.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Candidate Full AI Report Modal */}
      <Modal isOpen={showModal} title="Candidate AI Dossier" onClose={() => setShowModal(false)} size="xl" icon={BrainCircuit}>
        {detailLoading ? <Loading text="Loading full dossier..." /> : selectedCandidate ? (
          <div>
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-slate-200">
              <ScoreRing score={selectedCandidate.match_score || 0} size={80} label="Match Score" />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-2xl font-bold text-slate-800">{selectedCandidate.candidate_name || 'Candidate'}</h3>
                  {selectedCandidate.decision && <Badge variant={decisionBadgeVariants[selectedCandidate.decision]}>{selectedCandidate.decision.toUpperCase()}</Badge>}
                </div>
                <div className="flex gap-4">
                  <p className="text-sm font-medium text-blue-600 mb-3">{selectedCandidate.candidate_email}</p>
                </div>
                <Badge variant="primary">{selectedCandidate.recommendation || 'Pending'}</Badge>
              </div>
            </div>

            <Tabs tabs={agentTabs} activeTab={activeTab} onChange={setActiveTab} />

            <div className="mt-6 min-h-[400px]">
              {activeTab === 'overview' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <AgentCard icon={Scale} title="Committee Summary" accentColor="emerald">
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap mt-2">
                      {selectedCandidate.committee_packet?.summary_for_recruiter || "No committee summary available."}
                    </p>
                  </AgentCard>

                  <AgentCard icon={BarChart3} title="Skills Highlights" accentColor="brand">
                    <div className="mt-2">
                      {selectedCandidate.matching_skills?.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Matched Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedCandidate.matching_skills.map((s, i) => <SkillBadge key={`match-${i}`} skill={s} matched />)}
                          </div>
                        </div>
                      )}
                      {selectedCandidate.missing_skills?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Missing Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedCandidate.missing_skills.map((s, i) => <SkillBadge key={`miss-${i}`} skill={s} missing />)}
                          </div>
                        </div>
                      )}
                    </div>
                  </AgentCard>
                </div>
              )}

              {activeTab === 'insights' && (
                <AgentCard icon={Lightbulb} title="AI Insights" accentColor="emerald">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                      <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5"><CheckCircle size={14} /> Key Strengths</p>
                      <ul className="space-y-2">
                        {selectedCandidate.key_strengths?.map((s, i) => <li key={i} className="text-sm text-emerald-700 flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span> <span>{s}</span></li>)}
                        {(!selectedCandidate.key_strengths || selectedCandidate.key_strengths.length === 0) && <li className="text-sm text-emerald-600 italic">No key strengths identified</li>}
                      </ul>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                      <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-1.5"><AlertTriangle size={14} /> Skill Gaps</p>
                      <ul className="space-y-2">
                        {selectedCandidate.skill_gaps?.map((s, i) => <li key={i} className="text-sm text-amber-700 flex items-start gap-2"><span className="text-amber-500 mt-0.5">•</span> <span>{s}</span></li>)}
                        {(!selectedCandidate.skill_gaps || selectedCandidate.skill_gaps.length === 0) && <li className="text-sm text-amber-600 italic">No major skill gaps identified</li>}
                      </ul>
                    </div>
                  </div>
                </AgentCard>
              )}

              {activeTab === 'coach' && (
                <AgentCard icon={GraduationCap} title="What Coach Agent Told Candidate" accentColor="purple">
                  <div className="space-y-4 mt-4">
                    <div className="p-4 bg-violet-50 text-violet-800 rounded-xl border border-violet-100">
                      <p className="text-sm italic font-medium">"{selectedCandidate.candidate_coaching?.short_message || 'N/A'}"</p>
                    </div>
                    {(selectedCandidate.candidate_coaching?.resume_improvements?.length > 0) && (
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Resume Suggestions given</p>
                        <ul className="space-y-2">
                          {selectedCandidate.candidate_coaching.resume_improvements.map((r, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AgentCard>
              )}

              {activeTab === 'interview' && (
                <AgentCard icon={Mic2} title="Suggested Interview Plan" accentColor="brand">
                  <div className="space-y-4 mt-4">
                    {selectedCandidate.interview_plan?.interview_questions?.map((q, i) => (
                      <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                        <div className="flex gap-2 mb-3">
                          <Badge variant="primary" size="sm" className="font-semibold shadow-sm">{q.round || 'Round'}</Badge>
                          <Badge variant="warning" size="sm" className="font-semibold shadow-sm">{q.type || 'Type'}</Badge>
                        </div>
                        <p className="text-sm font-bold text-slate-800 mb-3">{q.question}</p>
                        <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 text-xs">
                          <span className="font-bold uppercase tracking-wider flex items-center gap-1 mb-1"><CheckCircle size={12} /> Ideal Answer Elements:</span>
                          {q.what_good_looks_like}
                        </div>
                      </div>
                    ))}
                    {(!selectedCandidate.interview_plan?.interview_questions || selectedCandidate.interview_plan?.interview_questions.length === 0) && (
                      <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        No interview questions generated.
                      </div>
                    )}
                  </div>
                </AgentCard>
              )}

              {activeTab === 'results' && (
                <AgentCard icon={Trophy} title="Official Interview Performance" accentColor="brand">
                  {selectedCandidate.interview_evaluation ? (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-bold text-slate-800">Final Assessment</h4>
                        <Badge variant={selectedCandidate.interview_evaluation.hire_recommendation?.includes('Strong') ? 'success' : selectedCandidate.interview_evaluation.hire_recommendation?.includes('Hire') ? 'primary' : 'warning'}>
                          {selectedCandidate.interview_evaluation.hire_recommendation || 'Pending Review'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        {[
                          { label: 'Overall', score: selectedCandidate.interview_evaluation.overall_score },
                          { label: 'Communication', score: selectedCandidate.interview_evaluation.communication_score },
                          { label: 'Technical', score: selectedCandidate.interview_evaluation.technical_score },
                          { label: 'Problem Solving', score: selectedCandidate.interview_evaluation.problem_solving_score },
                          { label: 'Culture Fit', score: selectedCandidate.interview_evaluation.cultural_fit_score },
                        ].map((item, i) => (
                          <div key={i} className="flex flex-col items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <ScoreRing score={item.score || 0} size={60} />
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-2 text-center">{item.label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <h4 className="font-bold text-blue-900 mb-2 text-sm uppercase tracking-wider">Detailed Feedback</h4>
                        <p className="text-sm text-blue-800 leading-relaxed">{selectedCandidate.interview_evaluation.detailed_feedback}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-4">
                      No interview performance data available yet.
                    </div>
                  )}
                </AgentCard>
              )}

              {activeTab === 'risk' && (
                <AgentCard icon={Shield} title="Risk Analysis" accentColor="amber">
                  <div className="space-y-6 mt-4">
                    <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-sm font-semibold text-slate-700">Determined Risk Level:</span>
                      <Badge variant={selectedCandidate.risk_level === 'High' ? 'danger' : selectedCandidate.risk_level === 'Medium' ? 'warning' : 'success'}>
                        {selectedCandidate.risk_level || 'Low'}
                      </Badge>
                    </div>
                    {selectedCandidate.verification_questions?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2"><HelpCircle size={14} className="text-blue-500" /> Probe these areas during interview:</p>
                        <ul className="space-y-3">
                          {selectedCandidate.verification_questions.map((q, i) => (
                            <li key={i} className="bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-100 text-sm flex items-start gap-2 shadow-sm">
                              <span className="font-bold bg-amber-200 text-amber-900 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{i + 1}</span>
                              {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AgentCard>
              )}

              {activeTab === 'committee' && (
                <AgentCard icon={Scale} title="Full Committee Output" accentColor="emerald">
                  <div className="mt-4 bg-slate-800 rounded-xl p-4 overflow-x-auto shadow-inner border border-slate-700">
                    <pre className="text-xs text-slate-300 font-mono">
                      {JSON.stringify(selectedCandidate.committee_packet, null, 2)}
                    </pre>
                  </div>
                </AgentCard>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button variant="ghost" onClick={() => setShowModal(false)} className="px-6">Close</Button>
            </div>
          </div>
        ) : <Alert type="warning" message="No data available" />}
      </Modal>
    </>
  );
};
