import React, { useEffect, useState, useRef } from 'react';
import apiClient from '../utils/api';
import { Navigation } from '../components/Navigation';
import {
    Badge,
    ScoreRing,
    ScoreBar,
    Alert,
    AgentCard,
    AgentPipelineVisualizer,
    SkillBadge,
    SectionHeader,
    StatWidget,
    EmptyState,
    InfoBox,
    Timeline,
    Button,
    Card,
    Skeleton
} from '../components/Common';
import {
    FileText,
    Lightbulb,
    GraduationCap,
    Mic2,
    Shield,
    Scale,
    Target,
    Sparkles,
    CheckCircle,
    AlertCircle,
    Clock,
    Award,
    ArrowRight,
    BookOpen,
    Zap,
    Users,
    Briefcase,
    Search,
    Star,
    BrainCircuit,
    MessageSquare,
    Rocket,
    TrendingUp as TrendingUpIcon,
    X,
    Play,
    Send,
    StopCircle,
    Eye,
    MapPin,
} from 'lucide-react';

// AI Coach Chat Component
const AICoachChat = ({ coaching, application }) => {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const chatEndRef = useRef(null);
    const [chatHistory, setChatHistory] = useState([
        { type: 'ai', content: coaching?.short_message || 'Hi! I am your AI Career Coach. How can I help you improve your candidacy today?' }
    ]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const suggestions = [
        'How can I improve my resume?',
        'What skills should I learn?',
        'Am I a good fit for this role?',
        'Interview tips please'
    ];

    const handleSend = async (textToSend = message) => {
        if (!textToSend.trim() || sending) return;

        const newHistory = [...chatHistory, { type: 'user', content: textToSend }];
        setChatHistory(newHistory);
        setMessage('');
        setSending(true);

        try {
            const res = await apiClient.post(`/applications/chat/${application._id}`, {
                message: textToSend,
                history: chatHistory.slice(-6)
            });
            setChatHistory(prev => [...prev, { type: 'ai', content: res.data.reply }]);
        } catch (err) {
            setChatHistory(prev => [...prev, { type: 'ai', content: "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again later." }]);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 h-64 overflow-y-auto space-y-3">
                {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.type === 'ai' ? 'bg-violet-100 text-violet-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                            {msg.type === 'ai' ? <GraduationCap size={16} /> : <Users size={16} />}
                        </div>
                        <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.type === 'ai'
                            ? 'bg-white border border-slate-200 text-slate-700'
                            : 'bg-blue-600 text-white'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {sending && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-violet-100 text-violet-600">
                            <GraduationCap size={16} />
                        </div>
                        <div className="p-3 rounded-xl text-sm bg-white border border-slate-200">
                            <span className="flex items-center gap-1.5"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></span>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, i) => (
                    <button
                        key={i}
                        disabled={sending}
                        onClick={() => handleSend(suggestion)}
                        className="px-3 py-1.5 text-xs bg-violet-50 text-violet-700 rounded-full border border-violet-200 hover:bg-violet-100 transition-colors disabled:opacity-50"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={sending ? "Coach is typing..." : "Ask your AI Coach..."}
                    disabled={sending}
                    className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 disabled:bg-slate-50"
                />
                <Button size="sm" onClick={() => handleSend()} disabled={sending} icon={sending ? null : Sparkles}>
                    {sending ? "..." : "Ask"}
                </Button>
            </div>

            {coaching?.resume_improvements?.length > 0 && (
                <InfoBox type="info" title="Resume Improvements">
                    <ul className="space-y-2 mt-2">
                        {coaching.resume_improvements.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                                <ArrowRight size={14} className="text-violet-500 mt-1 flex-shrink-0" />
                                <span className="text-slate-600">{tip}</span>
                            </li>
                        ))}
                    </ul>
                </InfoBox>
            )}

            {coaching?.skill_upgrade_plan?.length > 0 && (
                <div className="space-y-3">
                    <p className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                        <BookOpen size={16} className="text-violet-600" />
                        Skill Upgrade Plan
                    </p>
                    {coaching.skill_upgrade_plan.slice(0, 3).map((skill, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Target size={14} className="text-violet-500" />
                                <span className="font-semibold text-sm text-slate-800">{skill.skill}</span>
                            </div>
                            {skill.why_it_matters && (
                                <p className="text-xs text-slate-500 mb-2">{skill.why_it_matters}</p>
                            )}
                            {skill.first_steps && (
                                <div className="flex items-center gap-2 text-xs text-violet-600 bg-violet-50 px-2 py-1.5 rounded-lg">
                                    <Rocket size={12} />
                                    {skill.first_steps}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Resume Analyzer Component
const ResumeAnalyzer = ({ application }) => {
    const analysisPoints = [
        { label: 'Skills Match', score: application.skill_match || 0, icon: Target },
        { label: 'Experience', score: application.experience_match || 0, icon: Briefcase },
        { label: 'Education', score: application.education_match || 0, icon: BookOpen },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-6">
                <ScoreRing score={application.match_score || 0} size={100} label="Overall Match" />
                <div className="flex-1 space-y-3">
                    {analysisPoints.map((point, i) => (
                        <ScoreBar key={i} score={point.score} label={point.label} />
                    ))}
                </div>
            </div>

            {application.matching_skills?.length > 0 && (
                <div>
                    <p className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-2">
                        <CheckCircle size={16} className="text-emerald-600" />
                        Matching Skills ({application.matching_skills.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {application.matching_skills.map((skill, i) => (
                            <SkillBadge key={i} skill={skill} matched />
                        ))}
                    </div>
                </div>
            )}

            {application.missing_skills?.length > 0 && (
                <div>
                    <p className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-2">
                        <AlertCircle size={16} className="text-amber-600" />
                        Skills to Develop ({application.missing_skills.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {application.missing_skills.slice(0, 6).map((skill, i) => (
                            <SkillBadge key={i} skill={skill} missing />
                        ))}
                    </div>
                </div>
            )}

            {application.extracted_skills?.length > 0 && (
                <div>
                    <p className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-2">
                        <BrainCircuit size={16} className="text-blue-600" />
                        Skills Detected in Your Resume
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {application.extracted_skills.slice(0, 12).map((skill, i) => (
                            <SkillBadge key={i} skill={skill} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Interactive Interview Practice Component
const InterviewPractice = ({ application }) => {
    const [mode, setMode] = useState('idle');
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [answer, setAnswer] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [questionNum, setQuestionNum] = useState(0);
    const [history, setHistory] = useState([]);
    const [previousQuestions, setPreviousQuestions] = useState([]);
    const answerRef = useRef(null);

    const fetchQuestion = async () => {
        setMode('loading');
        setAnswer('');
        setFeedback(null);
        const nextNum = questionNum + 1;
        try {
            const res = await apiClient.post(`/practice/${application._id}/question`, {
                question_number: nextNum,
                previous_questions: previousQuestions,
            });
            setCurrentQuestion(res.data);
            setQuestionNum(nextNum);
            setPreviousQuestions(prev => [...prev, res.data.question]);
            setMode('question');
            setTimeout(() => answerRef.current?.focus(), 200);
        } catch (err) {
            console.error('Failed to fetch question:', err);
            setMode('idle');
        }
    };

    const submitAnswer = async () => {
        if (!answer.trim()) return;
        setMode('evaluating');
        try {
            const res = await apiClient.post(`/practice/${application._id}/evaluate`, {
                question: currentQuestion.question,
                question_type: currentQuestion.question_type,
                answer: answer.trim(),
            });
            setFeedback(res.data);
            setHistory(prev => [...prev, {
                question: currentQuestion.question,
                question_type: currentQuestion.question_type,
                answer: answer.trim(),
                ...res.data,
            }]);
            setMode('feedback');
        } catch (err) {
            console.error('Failed to evaluate answer:', err);
            setMode('question');
        }
    };

    const quitPractice = () => setMode('summary');
    const resetPractice = () => {
        setMode('idle');
        setHistory([]);
        setPreviousQuestions([]);
        setQuestionNum(0);
        setCurrentQuestion(null);
        setFeedback(null);
        setAnswer('');
    };

    const avgScore = history.length ? Math.round(history.reduce((s, h) => s + (h.score || 0), 0) / history.length) : 0;

    if (mode === 'idle') {
        return (
            <div className="text-center py-10 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-5">
                    <Mic2 size={28} className="text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Interview Practice</h3>
                <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                    Get AI-generated interview questions tailored to this role. Answer them and receive instant scoring with feedback.
                </p>
                <Button onClick={fetchQuestion} icon={Play}>Start Practice</Button>
            </div>
        );
    }

    if (mode === 'loading' || mode === 'evaluating') {
        return (
            <div className="text-center py-12 animate-fade-in">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-slate-500 font-medium">
                    {mode === 'loading' ? 'Generating your next question...' : 'Evaluating your answer...'}
                </p>
            </div>
        );
    }

    if (mode === 'summary') {
        return (
            <div className="space-y-5 animate-slide-up-fade">
                <div className="text-center">
                    <ScoreRing score={avgScore} size={90} label="Average Score" />
                    <p className="text-sm text-slate-500 mt-2">{history.length} question{history.length !== 1 ? 's' : ''} completed</p>
                </div>
                <div className="space-y-3 max-h-72 overflow-y-auto">
                    {history.map((h, i) => (
                        <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <Badge variant="default" size="sm">Q{i + 1} - {h.question_type}</Badge>
                                <Badge variant={h.score >= 70 ? 'success' : h.score >= 40 ? 'warning' : 'danger'}>{h.score}%</Badge>
                            </div>
                            <p className="text-sm text-slate-700 font-medium">{h.question}</p>
                        </div>
                    ))}
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={resetPractice} className="flex-1">Start Over</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="animate-slide-up-fade">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">{questionNum}</div>
                        <Badge variant="primary" size="sm">{currentQuestion?.question_type || 'Question'}</Badge>
                        {currentQuestion?.difficulty && <Badge variant="default" size="sm">{currentQuestion.difficulty}</Badge>}
                    </div>
                    <button onClick={quitPractice} className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors">
                        <StopCircle size={14} /> Quit Practice
                    </button>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-5">
                    <p className="text-sm font-semibold text-slate-800 leading-relaxed">{currentQuestion?.question}</p>
                    {currentQuestion?.focus_area && (
                        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                            <Target size={12} /> Focus: {currentQuestion.focus_area}
                        </p>
                    )}
                </div>
            </div>

            {mode === 'question' && (
                <div className="animate-fade-in">
                    <textarea
                        ref={answerRef}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
                        rows={5}
                        placeholder="Type your answer here... Be as detailed as you can."
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) submitAnswer(); }}
                    />
                    <div className="flex items-center justify-between mt-3">
                        <p className="text-xs text-slate-400">Ctrl+Enter to submit</p>
                        <Button onClick={submitAnswer} disabled={!answer.trim()} icon={Send} size="sm">Submit Answer</Button>
                    </div>
                </div>
            )}

            {mode === 'feedback' && feedback && (
                <div className="space-y-4 animate-slide-up-fade">
                    <div className="flex items-center gap-4 p-4 rounded-xl border bg-white border-slate-200">
                        <ScoreRing score={feedback.score || 0} size={64} />
                        <div>
                            <Badge variant={feedback.score >= 70 ? 'success' : feedback.score >= 40 ? 'warning' : 'danger'} size="lg">
                                {feedback.verdict || 'Evaluated'}
                            </Badge>
                            {feedback.tip && <p className="text-xs text-slate-500 mt-1">{feedback.tip}</p>}
                        </div>
                    </div>

                    {feedback.what_was_good?.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                            <p className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1"><CheckCircle size={14} /> What you did well</p>
                            <ul className="space-y-1">
                                {feedback.what_was_good.map((g, i) => <li key={i} className="text-sm text-emerald-700">{g}</li>)}
                            </ul>
                        </div>
                    )}

                    {feedback.what_was_missed?.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1"><AlertCircle size={14} /> What you could improve</p>
                            <ul className="space-y-1">
                                {feedback.what_was_missed.map((m, i) => <li key={i} className="text-sm text-amber-700">{m}</li>)}
                            </ul>
                        </div>
                    )}

                    {feedback.ideal_answer_hint && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-xs font-bold text-blue-700 mb-1 flex items-center gap-1"><Lightbulb size={14} /> Ideal answer hint</p>
                            <p className="text-sm text-blue-700">{feedback.ideal_answer_hint}</p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button onClick={fetchQuestion} icon={ArrowRight} className="flex-1">Next Question</Button>
                        <Button variant="secondary" onClick={quitPractice} icon={StopCircle}>Quit</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Career Insights Component
const CareerInsights = ({ application }) => {
    return (
        <div className="space-y-6">
            {application.key_strengths?.length > 0 && (
                <InfoBox type="success" title="Your Key Strengths">
                    <ul className="space-y-2 mt-2">
                        {application.key_strengths.map((strength, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-600">{strength}</span>
                            </li>
                        ))}
                    </ul>
                </InfoBox>
            )}

            {application.growth_potential && (
                <InfoBox type="info" title="Growth Potential">
                    <p className="text-sm text-slate-600 mt-2">{application.growth_potential}</p>
                </InfoBox>
            )}

            {application.interview_focus?.length > 0 && (
                <div>
                    <p className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-2">
                        <Target size={16} className="text-blue-600" />
                        Recommended Interview Focus
                    </p>
                    <Timeline items={application.interview_focus.map((focus, i) => ({
                        title: focus,
                        completed: i < 2,
                        description: i === 0 ? 'Priority area' : undefined
                    }))} />
                </div>
            )}

            <div className={`p-4 rounded-xl border ${application.recommendation?.includes('Strong')
                ? 'bg-emerald-50 border-emerald-200'
                : application.recommendation?.includes('Good')
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-amber-50 border-amber-200'
                }`}>
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${application.recommendation?.includes('Strong')
                        ? 'bg-emerald-100 text-emerald-600'
                        : application.recommendation?.includes('Good')
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-amber-100 text-amber-600'
                        }`}>
                        <Award size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">AI Recommendation</p>
                        <p className="font-semibold text-slate-800">{application.recommendation || 'Analysis Pending'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Risk Assessment Component
const RiskAssessment = ({ application }) => {
    const riskLevel = application.risk_level || 'Low';
    const riskConfig = {
        Low: { color: 'emerald', icon: CheckCircle, text: 'Low Risk Profile' },
        Medium: { color: 'amber', icon: AlertCircle, text: 'Medium Risk - Review Recommended' },
        High: { color: 'rose', icon: Shield, text: 'High Risk - Attention Needed' },
    };
    const config = riskConfig[riskLevel] || riskConfig.Low;
    const Icon = config.icon;

    return (
        <div className="space-y-6">
            <div className={`p-6 rounded-xl border bg-${config.color}-50 border-${config.color}-200`}>
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-${config.color}-100 flex items-center justify-center`}>
                        <Icon size={28} className={`text-${config.color}-600`} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Risk Assessment</p>
                        <p className={`text-xl font-bold text-${config.color}-700`}>{config.text}</p>
                    </div>
                </div>
            </div>

            {application.verification_questions?.length > 0 && (
                <div>
                    <p className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-2">
                        <MessageSquare size={16} className="text-rose-600" />
                        Areas to Clarify in Interview
                    </p>
                    <div className="space-y-3">
                        {application.verification_questions.map((q, i) => (
                            <div key={i} className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4">
                                <span className="w-6 h-6 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {i + 1}
                                </span>
                                <p className="text-sm text-slate-700">{q}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <InfoBox type="info">
                The Risk Agent analyzes your profile for potential concerns like gaps in employment,
                vague job descriptions, or missing qualifications. Addressing these areas can improve your candidacy.
            </InfoBox>
        </div>
    );
};

// Committee Decision Component
const CommitteeDecision = ({ committeePacket }) => {
    if (!committeePacket) {
        return (
            <EmptyState
                icon={Scale}
                title="Committee Review Pending"
                description="The AI Committee is reviewing your application. A comprehensive assessment will be available soon."
            />
        );
    }

    return (
        <div className="space-y-6">
            {committeePacket.summary_for_candidate && (
                <InfoBox type="info" title="Committee Summary">
                    <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{committeePacket.summary_for_candidate}</p>
                </InfoBox>
            )}

            <div className="grid md:grid-cols-2 gap-4">
                {committeePacket.top_strengths?.length > 0 && (
                    <InfoBox type="success" title="Top Strengths">
                        <ul className="space-y-2 mt-2">
                            {committeePacket.top_strengths.map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-slate-600">{s}</span>
                                </li>
                            ))}
                        </ul>
                    </InfoBox>
                )}

                {committeePacket.top_gaps?.length > 0 && (
                    <InfoBox type="warning" title="Areas for Improvement">
                        <ul className="space-y-2 mt-2">
                            {committeePacket.top_gaps.map((g, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <AlertCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-slate-600">{g}</span>
                                </li>
                            ))}
                        </ul>
                    </InfoBox>
                )}
            </div>

            {committeePacket.next_step && (
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-4">
                    <p className="text-xs text-cyan-600 uppercase tracking-wider font-semibold mb-1">Recommended Next Step</p>
                    <p className="text-sm font-medium text-slate-800">{committeePacket.next_step}</p>
                </div>
            )}

            <div className="flex items-center justify-center gap-8">
                <ScoreRing
                    score={committeePacket.final_match_score || 0}
                    size={80}
                    label="Final Match"
                />
                <div className="text-center">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Confidence</p>
                    <p className="text-2xl font-bold text-slate-800">{committeePacket.confidence_score || 0}%</p>
                </div>
            </div>
        </div>
    );
};

// Main Candidate Dashboard Component
export const CandidateDashboard = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDetailModal, setShowDetailModal] = useState(false);
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
        } catch (err) {
            setError('Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const openDetail = async (app) => {
        setShowDetailModal(true);
        setDetailLoading(true);
        setActiveTab('overview');
        try {
            const res = await apiClient.get(`/applications/status/${app._id}`);
            setDetailApp(res.data);
        } catch (e) {
            setDetailApp(app);
        } finally {
            setDetailLoading(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navigation userRole="candidate" />
                <div className="min-h-screen bg-slate-50 py-8 px-4">
                    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <Skeleton className="h-8 w-64 mb-2" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="dashboard-widget">
                                    <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                                    <Skeleton className="h-8 w-24 mb-2" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            ))}
                        </div>

                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <Card key={i} className="h-40 flex items-center gap-6">
                                    <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                                    <div className="flex-1">
                                        <Skeleton className="h-6 w-48 mb-2" />
                                        <Skeleton className="h-4 w-32 mb-4" />
                                        <div className="flex gap-2">
                                            <Skeleton className="h-6 w-24 rounded-full" />
                                            <Skeleton className="h-6 w-24 rounded-full" />
                                        </div>
                                    </div>
                                    <Skeleton className="w-20 h-20 rounded-full" circle />
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const processed = applications.filter(a => a.status === 'processed');
    const avgScore = processed.length ? Math.round(processed.reduce((s, a) => s + (a.match_score || 0), 0) / processed.length) : 0;

    const agentTabs = [
        { key: 'overview', icon: <FileText size={16} />, label: 'Overview' },
        { key: 'resume', icon: <Target size={16} />, label: 'Resume Analyzer' },
        { key: 'insights', icon: <Lightbulb size={16} />, label: 'Career Insights' },
        { key: 'coach', icon: <GraduationCap size={16} />, label: 'AI Coach' },
        { key: 'interview', icon: <Mic2 size={16} />, label: 'Interview Prep' },
        { key: 'risk', icon: <Shield size={16} />, label: 'Risk Check' },
        { key: 'committee', icon: <Scale size={16} />, label: 'Committee Review' },
    ];

    const statusConfig = {
        uploaded: { variant: 'default', icon: Clock, text: 'Uploaded' },
        processing: { variant: 'warning', icon: Zap, text: 'Processing' },
        processed: { variant: 'success', icon: CheckCircle, text: 'Analyzed' },
        failed: { variant: 'danger', icon: AlertCircle, text: 'Failed' },
        interview_pending: { variant: 'warning', icon: Mic2, text: 'Interview Pending' },
        interview_completed: { variant: 'success', icon: CheckCircle, text: 'Interview Done' },
        hired: { variant: 'success', icon: Award, text: 'HIRED' },
        rejected: { variant: 'danger', icon: Shield, text: 'Not Selected' },
    };

    return (
        <>
            <Navigation userRole="candidate" />
            <div className="min-h-screen bg-slate-50 py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <SectionHeader
                        title="My Applications"
                        subtitle={`You have ${applications.length} active application${applications.length !== 1 ? 's' : ''}`}
                        icon={Briefcase}
                        action={applications.some(a => a.status === 'processing') && (
                            <Badge variant="primary">
                                <Zap size={12} className="mr-1" />
                                Live Updates
                            </Badge>
                        )}
                    />

                    {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

                    {processed.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <StatWidget value={applications.length} label="Total Applications" icon={FileText} color="blue" />
                            <StatWidget value={processed.length} label="Analyzed" icon={CheckCircle} color="emerald" />
                            <StatWidget value={`${avgScore}%`} label="Average Score" icon={TrendingUpIcon} color="violet" />
                            <StatWidget value={`${Math.max(...processed.map(a => a.match_score || 0))}%`} label="Best Match" icon={Award} color="amber" />
                        </div>
                    )}

                    {applications.length === 0 ? (
                        <EmptyState
                            icon={Search}
                            title="No applications yet"
                            description="Start your job search by browsing available positions and submitting your resume."
                            action={<Button onClick={() => window.location.href = '/jobs'} icon={Search}>Browse Jobs</Button>}
                        />
                    ) : (
                        <div className="space-y-6">
                            {applications.map(app => {
                                const status = statusConfig[app.status] || statusConfig.uploaded;
                                const StatusIcon = status.icon;

                                return (
                                    <Card key={app._id} className="relative overflow-hidden">
                                        {(app.status === 'hired') && (
                                            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2 px-6 text-center">
                                                <span className="font-semibold flex items-center justify-center gap-2">
                                                    <Award size={16} /> Congratulations! You have been hired!
                                                </span>
                                            </div>
                                        )}

                                        <div className={`${app.status === 'hired' ? 'pt-12' : ''}`}>
                                            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                                                <div className="flex-1">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                            <Briefcase size={24} className="text-blue-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                <h3 className="text-lg font-bold text-slate-800">{app.job_title || 'Application'}</h3>
                                                                <span className="text-slate-500">@ {app.company_name || 'Unknown'}</span>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <Badge variant={status.variant}>
                                                                    <StatusIcon size={12} className="mr-1" />
                                                                    {status.text}
                                                                </Badge>
                                                                {app.decision && app.decision !== 'rejected' && (
                                                                    <Badge variant={app.decision === 'hired' ? 'success' : 'primary'}>
                                                                        {app.decision === 'hired' ? <Award size={12} className="mr-1" /> : <Star size={12} className="mr-1" />}
                                                                        {app.decision === 'hired' ? 'HIRED' : 'SHORTLISTED'}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-slate-500 mt-2">
                                                                Applied {new Date(app.created_at).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {app.status === 'processed' && (
                                                        <div className="mt-4 flex flex-wrap gap-4">
                                                            {app.candidate_coaching?.short_message && (
                                                                <div className="flex items-start gap-2 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2">
                                                                    <GraduationCap size={14} className="text-violet-600 mt-0.5" />
                                                                    <p className="text-xs text-violet-700 italic">"{app.candidate_coaching.short_message.slice(0, 100)}..."</p>
                                                                </div>
                                                            )}
                                                            {app.key_strengths?.slice(0, 2).map((s, i) => (
                                                                <div key={i} className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                                                                    <CheckCircle size={12} /> {s}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                                    {app.status === 'processed' && (
                                                        <>
                                                            <ScoreRing score={app.match_score || 0} size={70} label="Match Score" />
                                                            <Badge variant={
                                                                (app.recommendation || '').includes('Strong') ? 'excellent' :
                                                                    (app.recommendation || '').includes('Good') ? 'good' :
                                                                        (app.recommendation || '').includes('Fair') ? 'fair' : 'default'
                                                            }>
                                                                {app.recommendation || 'Pending'}
                                                            </Badge>
                                                        </>
                                                    )}

                                                    {app.status === 'processing' && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                                                            <span className="text-sm text-blue-600 font-medium">{app.processing_step || 'Analyzing...'}</span>
                                                        </div>
                                                    )}

                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => openDetail(app)}
                                                        icon={app.status === 'processed' ? BrainCircuit : FileText}
                                                    >
                                                        {app.status === 'processed' ? 'AI Analysis' : 'View Status'}
                                                    </Button>
                                                </div>
                                            </div>

                                            {(app.status === 'interview_pending' || app.decision === 'shortlisted') && !app.interview_completed && (
                                                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200">
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center animate-pulse">
                                                                <Mic2 size={24} className="text-emerald-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-800">You are Shortlisted for an AI Interview!</p>
                                                                <p className="text-sm text-slate-500">Take your interview anytime - it is AI-powered and available 24/7</p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            onClick={() => window.location.href = `/interview/${app._id}`}
                                                            icon={Rocket}
                                                        >
                                                            Take Interview
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {app.status === 'processing' && (
                                                <div className="mt-4">
                                                    <AgentPipelineVisualizer status={app.status} agentOutputs={app.agent_outputs} />
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar Overlay */}
            <div className={`sidebar-overlay ${showDetailModal ? 'open' : ''}`} onClick={() => setShowDetailModal(false)} />

            {/* Sidebar Panel */}
            <div className={`sidebar-panel ${showDetailModal ? 'open' : ''}`}>
                {detailLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-sm text-slate-500">Loading AI analysis...</p>
                        </div>
                    </div>
                ) : detailApp ? (
                    <div className="flex h-full">
                        {/* Vertical Agent Nav — centered */}
                        <div className="w-[72px] flex-shrink-0 bg-gradient-to-b from-slate-50 to-slate-100/80 border-r border-slate-200 flex flex-col items-center justify-center gap-1.5">
                            {agentTabs.map(tab => {
                                const isActive = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        title={tab.label}
                                        className={`group relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${isActive
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                                                : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                                            }`}
                                    >
                                        {tab.icon}
                                        <span className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                                            {tab.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 overflow-y-auto">
                            {/* Header */}
                            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 py-4 z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <ScoreRing score={detailApp.match_score || 0} size={52} strokeWidth={5} />
                                        <div>
                                            <h3 className="text-base font-bold text-slate-800">{detailApp.job_title || 'Application'}</h3>
                                            <p className="text-xs text-slate-500">{detailApp.company_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={
                                            (detailApp.recommendation || '').includes('Strong') ? 'excellent' :
                                                (detailApp.recommendation || '').includes('Good') ? 'good' :
                                                    (detailApp.recommendation || '').includes('Fair') ? 'fair' : 'default'
                                        }>
                                            {detailApp.recommendation || 'Pending'}
                                        </Badge>
                                        <button onClick={() => setShowDetailModal(false)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Pipeline */}
                            <div className="px-6 py-4">
                                <AgentPipelineVisualizer status={detailApp.status} agentOutputs={detailApp.agent_outputs} />
                            </div>

                            {/* Tab Content */}
                            <div className="px-6 pb-8">
                                {activeTab === 'overview' && (
                                    <div className="grid gap-5 animate-fade-in">
                                        <AgentCard icon={Target} title="Resume Analysis" accentColor="brand">
                                            <div className="space-y-3">
                                                <ScoreBar score={detailApp.skill_match || 0} label="Skill Match" />
                                                <ScoreBar score={detailApp.experience_match || 0} label="Experience" />
                                                <ScoreBar score={detailApp.education_match || 0} label="Education" />
                                            </div>
                                        </AgentCard>

                                        <AgentCard icon={Lightbulb} title="Key Insights" accentColor="emerald">
                                            {detailApp.key_strengths?.length > 0 ? (
                                                <ul className="space-y-2">
                                                    {detailApp.key_strengths.slice(0, 4).map((s, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm">
                                                            <CheckCircle size={14} className="text-emerald-500 mt-0.5" />
                                                            <span className="text-slate-600">{s}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-slate-500">No highlights yet</p>
                                            )}
                                        </AgentCard>

                                        {detailApp.skill_gaps?.length > 0 && (
                                            <AgentCard icon={AlertCircle} title="Development Areas" accentColor="amber">
                                                <ul className="space-y-2">
                                                    {detailApp.skill_gaps.slice(0, 4).map((g, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm">
                                                            <Target size={14} className="text-amber-500 mt-0.5" />
                                                            <span className="text-slate-600">{g}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </AgentCard>
                                        )}

                                        {detailApp.growth_potential && (
                                            <AgentCard icon={TrendingUpIcon} title="Growth Potential" accentColor="brand">
                                                <p className="text-sm text-slate-600">{detailApp.growth_potential}</p>
                                            </AgentCard>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'resume' && (
                                    <div className="animate-fade-in">
                                        <ResumeAnalyzer application={detailApp} />
                                    </div>
                                )}

                                {activeTab === 'insights' && (
                                    <div className="animate-fade-in">
                                        <CareerInsights application={detailApp} />
                                    </div>
                                )}

                                {activeTab === 'coach' && (
                                    <div className="animate-fade-in">
                                        <AgentCard icon={GraduationCap} title="AI Career Coach" accentColor="purple">
                                            <AICoachChat
                                                coaching={detailApp.candidate_coaching}
                                                application={detailApp}
                                            />
                                        </AgentCard>
                                    </div>
                                )}

                                {activeTab === 'interview' && (
                                    <div className="animate-fade-in">
                                        <AgentCard icon={Mic2} title="Interview Practice" accentColor="amber">
                                            <InterviewPractice application={detailApp} />
                                        </AgentCard>
                                    </div>
                                )}

                                {activeTab === 'risk' && (
                                    <div className="animate-fade-in">
                                        <AgentCard icon={Shield} title="Risk Assessment" accentColor="rose">
                                            <RiskAssessment application={detailApp} />
                                        </AgentCard>
                                    </div>
                                )}

                                {activeTab === 'committee' && (
                                    <div className="animate-fade-in">
                                        <AgentCard icon={Scale} title="Hiring Committee" accentColor="cyan">
                                            <CommitteeDecision committeePacket={detailApp.committee_packet} />
                                        </AgentCard>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <Alert type="warning" message="No data available" />
                    </div>
                )}
            </div>
        </>
    );
};