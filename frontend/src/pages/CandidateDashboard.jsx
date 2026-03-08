import React, { useEffect, useState } from 'react';
import apiClient from '../utils/api';
import { Navigation } from '../components/Navigation';
import { Badge, ScoreRing, ScoreBar, Loading, Alert, Modal, AgentCard, AgentPipelineVisualizer, SkillBadge, Tabs } from '../components/Common';

export const CandidateDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [detailApp, setDetailApp] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { fetchApplications(); }, []);

  useEffect(() => {
    const hasPending = applications.some(app => ['uploaded', 'processing'].includes(app.status));
    if (!hasPending) return;
    const id = setInterval(fetchApplications, 4000);
    return () => clearInterval(id);
  }, [applications]);

  const fetchApplications = async () => {
    try {
      const res = await apiClient.get('/applications/candidate/all');
      setApplications(res.data.applications);
    } catch (err) { setError('Failed to load applications'); }
    finally { setLoading(false); }
  };

  const openDetail = async (app) => {
    setShowModal(true);
    setDetailLoading(true);
    setActiveTab('overview');
    try {
      const res = await apiClient.get(`/applications/status/${app._id}`);
      setDetailApp(res.data);
    } catch { setDetailApp(app); }
    finally { setDetailLoading(false); }
  };

  if (loading) return <><Navigation userRole="candidate" /><Loading text="Loading applications..." /></>;

  const processed = applications.filter(a => a.status === 'processed');
  const avgScore = processed.length ? Math.round(processed.reduce((s, a) => s + (a.match_score || 0), 0) / processed.length) : 0;

  const agentTabs = [
    { key: 'overview', icon: '📊', label: 'Overview' },
    { key: 'scoring', icon: '🎯', label: 'Scoring' },
    { key: 'insights', icon: '💡', label: 'Insights' },
    { key: 'coach', icon: '🎓', label: 'Coach' },
    { key: 'interview', icon: '🎤', label: 'Interview' },
    { key: 'risk', icon: '🛡️', label: 'Risk' },
    { key: 'committee', icon: '⚖️', label: 'Committee' },
  ];

  const statusBadgeVariants = {
    uploaded: 'default',
    processing: 'primary',
    processed: 'success',
    failed: 'danger',
    interview_pending: 'warning',
    interview_completed: 'emerald',
    hired: 'success',
    rejected: 'danger'
  };

  const statusText = {
    uploaded: 'Uploaded',
    processing: '⏳ Processing',
    processed: '✓ Analyzed',
    failed: '✗ Failed',
    interview_pending: '🎤 Interview Pending',
    interview_completed: '✅ Interview Done',
    hired: '🎊 HIRED',
    rejected: '📝 Not Selected'
  };

  return (
    <>
      <Navigation userRole="candidate" />
      <div className="min-h-screen bg-slate-925 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">📋 My Applications</h1>
              <p className="text-slate-400 mt-1">{applications.length} application{applications.length !== 1 ? 's' : ''}</p>
            </div>
            {applications.some(a => a.status === 'processing') && (
              <Badge variant="primary">🔄 Live updating…</Badge>
            )}
          </div>

          {error && <Alert type="danger" message={error} />}

          {/* Stats */}
          {processed.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="stat-card"><div className="text-2xl font-bold text-white">{applications.length}</div><div className="text-xs text-slate-500 mt-1">Total</div></div>
              <div className="stat-card"><div className="text-2xl font-bold text-emerald-400">{processed.length}</div><div className="text-xs text-slate-500 mt-1">Processed</div></div>
              <div className="stat-card"><ScoreRing score={avgScore} size={60} /><div className="text-xs text-slate-500 mt-1">Avg Score</div></div>
              <div className="stat-card"><div className="text-2xl font-bold text-brand-400">{Math.max(...processed.map(a => a.match_score || 0))}</div><div className="text-xs text-slate-500 mt-1">Best Match</div></div>
            </div>
          )}

          {/* Applications */}
          {applications.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-6xl mb-4">📋</p>
              <p className="text-xl text-slate-400 mb-4">No applications yet</p>
              <a href="/jobs" className="btn-primary inline-block">🔍 Browse Jobs</a>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map(app => (
                <div key={app._id} className="glass-card">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Left */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">
                          {app.job_title || 'Application'}
                          <span className="text-slate-500 font-normal ml-2">@ {app.company_name || 'Unknown'}</span>
                        </h3>
                        <Badge variant={statusBadgeVariants[app.status] || 'primary'}>
                          {statusText[app.status] || app.status.toUpperCase()}
                        </Badge>
                        {app.decision && app.decision !== 'rejected' && (
                          <Badge variant={app.decision === 'hired' ? 'success' : 'warning'}>
                            {app.decision === 'hired' ? '🎉 SELECTED & HIRED' : '🚀 SHORTLISTED'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{new Date(app.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>

                    {/* Score */}
                    {app.status === 'processed' && (
                      <div className="flex items-center gap-6">
                        <ScoreRing score={app.match_score || 0} size={64} label="Match" />
                        <div>
                          <Badge variant={
                            (app.recommendation || '').includes('Strong') ? 'success' :
                              (app.recommendation || '').includes('Good') ? 'primary' :
                                (app.recommendation || '').includes('Fair') ? 'warning' : 'default'
                          }>{app.recommendation || 'Pending'}</Badge>
                        </div>
                      </div>
                    )}

                    {/* Processing indicator */}
                    {app.status === 'processing' && (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                        <span className="text-sm text-brand-300">{app.processing_step || 'analyzing'}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick info */}
                  {app.status === 'processed' && (
                    <>
                      {/* Interview Invitation Banner */}
                      {(app.status === 'interview_pending' || app.decision === 'shortlisted') && !app.interview_completed && (
                        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-brand-500/10 to-purple-500/10 border border-emerald-500/30">
                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl animate-pulse">🎤</div>
                              <div>
                                <p className="text-sm font-bold text-emerald-300">You're Shortlisted for an AI Interview!</p>
                                <p className="text-xs text-slate-400 mt-0.5">Take your interview anytime — it's AI-powered and available 24/7</p>
                              </div>
                            </div>
                            <button
                              className="btn-primary flex items-center gap-2"
                              onClick={() => window.location.href = `/interview/${app._id}`}
                            >
                              🚀 Take Interview Now
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Interview Completed State */}
                      {app.interview_completed && app.status !== 'hired' && (
                        <div className="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">✅</div>
                            <div>
                              <p className="text-sm font-bold text-emerald-400">Interview Completed</p>
                              <p className="text-xs text-slate-400 font-medium">Wait for the recruiter's final decision.</p>
                            </div>
                          </div>
                          {app.interview_score && <Badge variant="emerald">Score: {app.interview_score}%</Badge>}
                        </div>
                      )}

                      {/* HIRED State */}
                      {app.status === 'hired' && (
                        <div className="mt-4 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-brand-500/20 to-purple-500/20 border-2 border-emerald-500/40 text-center">
                          <div className="text-4xl mb-3 animate-bounce">🎊</div>
                          <h4 className="text-xl font-bold text-white mb-2">You're Hired!</h4>
                          <p className="text-sm text-slate-300 max-w-md mx-auto">
                            Congratulations! The hiring team has selected you for the <strong>{app.job_title}</strong> role.
                            Check your email for the official offer and next steps.
                          </p>
                        </div>
                      )}

                      {/* Coach Agent Quick Peek */}
                      {app.candidate_coaching?.short_message && (
                        <div className="mt-4 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🎓</span>
                            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">AI Coach Says</span>
                          </div>
                          <p className="text-sm text-purple-200/80 italic">&ldquo;{app.candidate_coaching.short_message}&rdquo;</p>
                          {app.candidate_coaching.recommended_skills_to_learn?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span className="text-xs text-slate-500">Learn:</span>
                              {app.candidate_coaching.recommended_skills_to_learn.slice(0, 4).map((s, i) => (
                                <span key={i} className="text-xs bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-lg border border-purple-500/20">{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Skills */}
                      {app.extracted_skills?.length > 0 && (
                        <div className="mt-4">
                          <span className="text-xs text-slate-500 mb-2 block">Extracted Skills</span>
                          <div className="flex flex-wrap gap-1.5">
                            {app.extracted_skills.slice(0, 8).map((s, i) => <SkillBadge key={i} skill={s} />)}
                            {app.extracted_skills.length > 8 && <span className="badge bg-white/5 text-slate-500 border border-white/5 text-xs">+{app.extracted_skills.length - 8}</span>}
                          </div>
                        </div>
                      )}

                      {/* Quick strengths */}
                      {app.key_strengths?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {app.key_strengths.slice(0, 3).map((s, i) => (
                            <span key={i} className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">✓ {s}</span>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 flex justify-end">
                        <button className="btn-secondary btn-sm" onClick={() => openDetail(app)}>
                          🤖 View Full AI Report →
                        </button>
                      </div>
                    </>
                  )}

                  {/* Pipeline for processing */}
                  {app.status === 'processing' && (
                    <div className="mt-4">
                      <AgentPipelineVisualizer status={app.status} agentOutputs={app.agent_outputs} />
                    </div>
                  )}
                </div>

              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={showModal} title="🤖 AI Analysis Report" onClose={() => setShowModal(false)} size="xl">
        {detailLoading ? <Loading text="Loading full report..." /> : detailApp ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-white/10">
              <ScoreRing score={detailApp.match_score || 0} size={80} label="Final Score" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{detailApp.candidate_name || 'Candidate'}</h3>
                <Badge variant={
                  (detailApp.recommendation || '').includes('Strong') ? 'success' :
                    (detailApp.recommendation || '').includes('Good') ? 'primary' :
                      (detailApp.recommendation || '').includes('Fair') ? 'warning' : 'default'
                }>{detailApp.recommendation || 'Pending'}</Badge>
              </div>
            </div>

            {/* Pipeline */}
            <div className="mb-6">
              <AgentPipelineVisualizer status={detailApp.status} agentOutputs={detailApp.agent_outputs} />
            </div>

            {/* Tabs */}
            <Tabs tabs={agentTabs} activeTab={activeTab} onChange={setActiveTab} />

            <div className="mt-6">
              {activeTab === 'overview' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <AgentCard icon="📊" title="Score Breakdown" accentColor="brand">
                    <div className="space-y-3">
                      <ScoreBar score={detailApp.skill_match || 0} label="Skill Match" />
                      <ScoreBar score={detailApp.experience_match || 0} label="Experience" />
                      <ScoreBar score={detailApp.education_match || 0} label="Education" />
                    </div>
                  </AgentCard>
                  <AgentCard icon="💡" title="Key Highlights" accentColor="emerald">
                    {detailApp.key_strengths?.length > 0 ? (
                      <ul className="space-y-2">{detailApp.key_strengths.map((s, i) => <li key={i} className="text-sm text-emerald-300 flex items-start gap-2"><span>✓</span>{s}</li>)}</ul>
                    ) : <p className="text-sm text-slate-500">No highlights yet</p>}
                  </AgentCard>
                  {detailApp.skill_gaps?.length > 0 && (
                    <AgentCard icon="⚠️" title="Areas to Improve" accentColor="amber">
                      <ul className="space-y-2">{detailApp.skill_gaps.map((g, i) => <li key={i} className="text-sm text-amber-300 flex items-start gap-2"><span>△</span>{g}</li>)}</ul>
                    </AgentCard>
                  )}
                  {detailApp.growth_potential && (
                    <AgentCard icon="📈" title="Growth Potential" accentColor="brand">
                      <p className="text-sm text-slate-300">{detailApp.growth_potential}</p>
                    </AgentCard>
                  )}
                </div>
              )}

              {activeTab === 'scoring' && (
                <AgentCard icon="🎯" title="Scoring Agent Analysis" accentColor="brand">
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center"><ScoreRing score={detailApp.skill_match || 0} size={60} /><p className="text-xs text-slate-500 mt-1">Skills</p></div>
                      <div className="text-center"><ScoreRing score={detailApp.experience_match || 0} size={60} /><p className="text-xs text-slate-500 mt-1">Experience</p></div>
                      <div className="text-center"><ScoreRing score={detailApp.education_match || 0} size={60} /><p className="text-xs text-slate-500 mt-1">Education</p></div>
                    </div>
                    {detailApp.matching_skills?.length > 0 && (
                      <div><p className="text-xs text-slate-500 mb-2">Matched Skills</p><div className="flex flex-wrap gap-1.5">{detailApp.matching_skills.map((s, i) => <SkillBadge key={i} skill={s} matched />)}</div></div>
                    )}
                    {detailApp.missing_skills?.length > 0 && (
                      <div><p className="text-xs text-slate-500 mb-2">Missing Skills</p><div className="flex flex-wrap gap-1.5">{detailApp.missing_skills.map((s, i) => <SkillBadge key={i} skill={s} missing />)}</div></div>
                    )}
                  </div>
                </AgentCard>
              )}

              {activeTab === 'insights' && (
                <div className="space-y-4">
                  <AgentCard icon="💡" title="Insight Agent" accentColor="emerald">
                    {detailApp.key_strengths?.length > 0 && <div className="mb-4"><p className="text-xs text-slate-500 mb-2">Key Strengths</p><ul className="space-y-1">{detailApp.key_strengths.map((s, i) => <li key={i} className="text-sm text-emerald-300">✓ {s}</li>)}</ul></div>}
                    {detailApp.skill_gaps?.length > 0 && <div className="mb-4"><p className="text-xs text-slate-500 mb-2">Skill Gaps</p><ul className="space-y-1">{detailApp.skill_gaps.map((g, i) => <li key={i} className="text-sm text-amber-300">△ {g}</li>)}</ul></div>}
                    {detailApp.growth_potential && <div className="mb-4"><p className="text-xs text-slate-500 mb-2">Growth Potential</p><p className="text-sm text-slate-300">{detailApp.growth_potential}</p></div>}
                    {detailApp.interview_focus?.length > 0 && <div><p className="text-xs text-slate-500 mb-2">Interview Focus Areas</p><ul className="space-y-1">{detailApp.interview_focus.map((a, i) => <li key={i} className="text-sm text-brand-300">🎯 {a}</li>)}</ul></div>}
                  </AgentCard>
                </div>
              )}

              {activeTab === 'coach' && (
                <AgentCard icon="🎓" title="Coach Agent" accentColor="purple">
                  {detailApp.candidate_coaching ? (
                    <div className="space-y-4">
                      {detailApp.candidate_coaching.short_message && <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20"><p className="text-sm text-purple-200">{detailApp.candidate_coaching.short_message}</p></div>}
                      {detailApp.candidate_coaching.resume_improvements?.length > 0 && <div><p className="text-xs text-slate-500 mb-2">📝 Resume Improvements</p><ul className="space-y-2">{detailApp.candidate_coaching.resume_improvements.map((t, i) => <li key={i} className="text-sm text-slate-300 flex items-start gap-2"><span className="text-brand-400">→</span>{t}</li>)}</ul></div>}
                      {detailApp.candidate_coaching.skill_upgrade_plan?.length > 0 && <div><p className="text-xs text-slate-500 mb-2">📚 Skill Upgrade Plan</p>{detailApp.candidate_coaching.skill_upgrade_plan.map((s, i) => <div key={i} className="p-3 rounded-lg bg-white/[0.03] border border-white/5 mb-2"><p className="text-sm font-semibold text-white">{s.skill}</p>{s.why_it_matters && <p className="text-xs text-slate-400 mt-1">{s.why_it_matters}</p>}{s.first_steps && <p className="text-xs text-brand-300 mt-1">→ {s.first_steps}</p>}</div>)}</div>}
                      {detailApp.candidate_coaching.portfolio_suggestions?.length > 0 && <div><p className="text-xs text-slate-500 mb-2">💼 Portfolio Suggestions</p><ul className="space-y-1">{detailApp.candidate_coaching.portfolio_suggestions.map((s, i) => <li key={i} className="text-sm text-slate-300">• {s}</li>)}</ul></div>}
                    </div>
                  ) : <p className="text-sm text-slate-500">Coach data not available</p>}
                </AgentCard>
              )}

              {activeTab === 'interview' && (
                <AgentCard icon="🎤" title="Interview Agent" accentColor="brand">
                  {detailApp.interview_plan ? (
                    <div className="space-y-4">
                      {detailApp.interview_plan.estimated_level && <Badge variant="primary">Level: {detailApp.interview_plan.estimated_level}</Badge>}
                      {detailApp.interview_plan.focus_areas?.length > 0 && <div><p className="text-xs text-slate-500 mb-2">Focus Areas</p><div className="flex flex-wrap gap-1.5">{detailApp.interview_plan.focus_areas.map((a, i) => <Badge key={i} variant="primary">{a}</Badge>)}</div></div>}
                      {detailApp.interview_plan.interview_questions?.length > 0 && <div className="space-y-3">{detailApp.interview_plan.interview_questions.map((q, i) => (
                        <div key={i} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                          <div className="flex gap-2 mb-2"><Badge variant="primary">{q.round || 'Round'}</Badge><Badge variant="default">{q.type || 'Question'}</Badge></div>
                          <p className="text-sm font-medium text-white">{q.question}</p>
                          {q.what_good_looks_like && <p className="text-xs text-slate-400 mt-2 italic">✓ Good answer: {q.what_good_looks_like}</p>}
                        </div>
                      ))}</div>}
                    </div>
                  ) : <p className="text-sm text-slate-500">Interview plan not available</p>}
                </AgentCard>
              )}

              {activeTab === 'risk' && (
                <AgentCard icon="🛡️" title="Risk Agent" accentColor="amber">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">Risk Level:</span>
                      <Badge variant={detailApp.risk_level === 'Low' ? 'success' : detailApp.risk_level === 'High' ? 'danger' : 'warning'}>
                        {detailApp.risk_level || 'Low'}
                      </Badge>
                    </div>
                    {detailApp.verification_questions?.length > 0 && <div><p className="text-xs text-slate-500 mb-2">Verification Questions</p><ul className="space-y-2">{detailApp.verification_questions.map((q, i) => <li key={i} className="text-sm text-slate-300 flex items-start gap-2"><span className="text-amber-400">?</span>{q}</li>)}</ul></div>}
                  </div>
                </AgentCard>
              )}

              {activeTab === 'committee' && (
                <AgentCard icon="⚖️" title="Committee Agent — Final Decision" accentColor="emerald">
                  {detailApp.committee_packet ? (
                    <div className="space-y-4">
                      {detailApp.committee_packet.summary_for_candidate && <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"><p className="text-sm text-emerald-200 whitespace-pre-wrap">{detailApp.committee_packet.summary_for_candidate}</p></div>}
                      {detailApp.committee_packet.top_strengths?.length > 0 && <div><p className="text-xs text-slate-500 mb-2">Top Strengths</p><ul className="space-y-1">{detailApp.committee_packet.top_strengths.map((s, i) => <li key={i} className="text-sm text-emerald-300">✓ {s}</li>)}</ul></div>}
                      {detailApp.committee_packet.top_gaps?.length > 0 && <div><p className="text-xs text-slate-500 mb-2">Top Gaps</p><ul className="space-y-1">{detailApp.committee_packet.top_gaps.map((g, i) => <li key={i} className="text-sm text-amber-300">△ {g}</li>)}</ul></div>}
                      {detailApp.committee_packet.next_step && <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5"><p className="text-xs text-slate-500">Next Step</p><p className="text-sm text-white font-semibold">{detailApp.committee_packet.next_step}</p></div>}
                    </div>
                  ) : <p className="text-sm text-slate-500">Committee decision not available</p>}
                </AgentCard>
              )}
            </div>
          </div>
        ) : <Alert type="warning" message="No data available" />}
      </Modal>
    </>
  );
};
