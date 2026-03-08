import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import { Navigation } from '../components/Navigation';
import { Loading, Alert, Badge, ScoreRing, Button } from '../components/Common';

export const AIInterview = () => {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState(null); // not_started | in_progress | completed | evaluated
    const [conversation, setConversation] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [questionInfo, setQuestionInfo] = useState({ current: 0, total: 0 });
    const [evaluation, setEvaluation] = useState(null);
    const chatEndRef = useRef(null);

    useEffect(() => { checkStatus(); }, [applicationId]);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conversation]);

    const checkStatus = async () => {
        try {
            const res = await apiClient.get(`/interview/${applicationId}/status`);
            const d = res.data;
            setStatus(d.status);
            setSessionId(d.session_id || null);
            setConversation(d.conversation || []);
            setQuestionInfo({ current: d.current_question || 0, total: d.total_questions || 0 });
            setEvaluation(d.evaluation || null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load interview status');
        } finally {
            setLoading(false);
        }
    };

    const startInterview = async () => {
        setSending(true);
        try {
            const res = await apiClient.post(`/interview/${applicationId}/start`);
            const d = res.data;
            setSessionId(d.session_id);
            setStatus('in_progress');
            if (d.message) {
                setConversation(prev => [...prev, { role: 'interviewer', content: d.message }]);
            }
            setQuestionInfo({ current: d.question_number || 1, total: d.total_questions || 0 });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to start interview');
        } finally {
            setSending(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || sending) return;
        const msg = input.trim();
        setInput('');
        setConversation(prev => [...prev, { role: 'candidate', content: msg }]);
        setSending(true);
        try {
            const res = await apiClient.post(`/interview/${applicationId}/chat`, { message: msg });
            const d = res.data;
            if (d.message) {
                setConversation(prev => [...prev, { role: 'interviewer', content: d.message }]);
            }
            setQuestionInfo({ current: d.question_number || questionInfo.current, total: d.total_questions || questionInfo.total });
            if (d.status === 'completed') {
                setStatus('completed');
                // Poll for evaluation
                setTimeout(async () => {
                    const evalRes = await apiClient.get(`/interview/${applicationId}/status`);
                    setEvaluation(evalRes.data.evaluation || null);
                    if (evalRes.data.status === 'evaluated') setStatus('evaluated');
                }, 3000);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (loading) return <><Navigation userRole="candidate" /><Loading text="Loading interview..." /></>;

    return (
        <>
            <Navigation userRole="candidate" />
            <div className="min-h-screen bg-slate-925 py-8 px-4">
                <div className="max-w-4xl mx-auto">

                    {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <button className="btn-ghost !p-2" onClick={() => navigate('/candidate-dashboard')}>← Back</button>
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                🎤 AI Interview
                                {status === 'in_progress' && <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />}
                            </h1>
                            {questionInfo.total > 0 && status === 'in_progress' && (
                                <p className="text-sm text-slate-400 mt-1">Question {questionInfo.current} of {questionInfo.total}</p>
                            )}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {questionInfo.total > 0 && (
                        <div className="w-full h-2 bg-white/10 rounded-full mb-6 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${(questionInfo.current / questionInfo.total) * 100}%` }}
                            />
                        </div>
                    )}

                    {/* Not Started State */}
                    {status === 'not_started' && (
                        <div className="glass-card text-center py-16">
                            <div className="text-6xl mb-6">🎤</div>
                            <h2 className="text-2xl font-bold text-white mb-3">Your AI Interview is Ready!</h2>
                            <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                                You've been selected for an interview! Our AI interviewer will ask you a series of technical and behavioral questions.
                                Take your time with each answer — there's no timer on individual questions.
                            </p>
                            <div className="space-y-3">
                                <button className="btn-primary text-lg px-10 py-4" onClick={startInterview} disabled={sending}>
                                    {sending ? '⏳ Starting...' : '🚀 Start Interview Now'}
                                </button>
                                <p className="text-xs text-slate-500">You can take this interview anytime before the deadline</p>
                            </div>
                        </div>
                    )}

                    {/* Not Invited */}
                    {status === 'not_invited' && (
                        <div className="glass-card text-center py-16">
                            <div className="text-6xl mb-6">📋</div>
                            <h2 className="text-xl font-bold text-white mb-3">No Interview Available</h2>
                            <p className="text-slate-400">You haven't been invited for an interview for this application yet.</p>
                        </div>
                    )}

                    {/* Chat Interface */}
                    {(status === 'in_progress' || status === 'completed' || status === 'evaluated') && (
                        <div className="glass-card !p-0 overflow-hidden">
                            {/* Chat Header */}
                            <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-lg">🤖</div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">AI Interviewer</p>
                                        <p className="text-xs text-slate-500">{status === 'in_progress' ? 'Active' : 'Interview Complete'}</p>
                                    </div>
                                </div>
                                {status !== 'in_progress' && <Badge variant="success">✓ Completed</Badge>}
                            </div>

                            {/* Chat Messages */}
                            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto" style={{ minHeight: '300px' }}>
                                {conversation.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'candidate' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'candidate'
                                                ? 'bg-brand-500/20 border border-brand-500/30 text-brand-100 rounded-br-md'
                                                : 'bg-white/5 border border-white/10 text-slate-300 rounded-bl-md'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {sending && (
                                    <div className="flex justify-start">
                                        <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md p-4 text-sm text-slate-400">
                                            <span className="flex items-center gap-2">
                                                <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Input */}
                            {status === 'in_progress' && (
                                <div className="p-4 border-t border-white/10 bg-white/[0.02]">
                                    <div className="flex gap-3">
                                        <textarea
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 resize-none"
                                            rows="3"
                                            placeholder="Type your answer here..."
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                            disabled={sending}
                                        />
                                        <button
                                            className="btn-primary self-end !px-6 !py-3"
                                            onClick={sendMessage}
                                            disabled={sending || !input.trim()}
                                        >
                                            {sending ? '...' : 'Send →'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-2">Press Enter to send, Shift+Enter for new line</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Evaluation Results */}
                    {evaluation && (
                        <div className="glass-card mt-6 border-l-4 border-l-emerald-500">
                            <h3 className="text-lg font-bold text-white mb-4">📊 Interview Evaluation</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                                {[
                                    { label: 'Overall', score: evaluation.overall_score, color: 'text-white' },
                                    { label: 'Communication', score: evaluation.communication_score, color: 'text-brand-400' },
                                    { label: 'Technical', score: evaluation.technical_score, color: 'text-emerald-400' },
                                    { label: 'Problem Solving', score: evaluation.problem_solving_score, color: 'text-amber-400' },
                                    { label: 'Cultural Fit', score: evaluation.cultural_fit_score, color: 'text-purple-400' },
                                ].map((item, i) => (
                                    <div key={i} className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
                                        <ScoreRing score={item.score || 0} size={50} />
                                        <p className="text-xs text-slate-500 mt-2">{item.label}</p>
                                    </div>
                                ))}
                            </div>
                            <Badge variant={
                                evaluation.hire_recommendation?.includes('Strong') ? 'success' :
                                    evaluation.hire_recommendation?.includes('Hire') ? 'primary' : 'warning'
                            }>
                                {evaluation.hire_recommendation || 'Pending'}
                            </Badge>
                            {evaluation.detailed_feedback && (
                                <p className="text-sm text-slate-300 mt-4 p-4 bg-white/[0.03] rounded-xl border border-white/5">
                                    {evaluation.detailed_feedback}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
