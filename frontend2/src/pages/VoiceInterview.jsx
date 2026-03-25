import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { Alert, Badge, ScoreRing } from '../components/Common';
import apiClient from '../utils/api';

// ═══════════════════════════════════════════════════════════════
// Voice Interview — Live conversational AI interview
// Uses Web Speech API for real-time transcription & auto-submission
// ═══════════════════════════════════════════════════════════════

const ROLES = [
    'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
    'Data Scientist', 'Machine Learning Engineer', 'DevOps Engineer',
    'Mobile Developer', 'Cloud Architect', 'QA Engineer',
    'Cybersecurity Analyst', 'Product Manager', 'UI/UX Designer',
];

const DIFFICULTIES = [
    { value: 'easy', label: 'Easy', desc: 'Entry-level / Fresher', icon: '🌱', color: 'emerald' },
    { value: 'medium', label: 'Medium', desc: '2-4 years experience', icon: '⚡', color: 'amber' },
    { value: 'hard', label: 'Hard', desc: '5+ years / Senior', icon: '🔥', color: 'red' },
];

const SILENCE_MS = 2500; // 2.5 seconds of silence = automatic submission

export const VoiceInterview = () => {
    const navigate = useNavigate();

    // ── State ──
    const [phase, setPhase] = useState('setup');   // setup | interview | results
    const [role, setRole] = useState('');
    const [difficulty, setDifficulty] = useState('medium');
    const [sessionId, setSessionId] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Interview state
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [questionType, setQuestionType] = useState('');
    const [questionNumber, setQuestionNumber] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(5);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);

    // Recognition State
    const [isRecording, setIsRecording] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');

    const [isProcessing, setIsProcessing] = useState(false);
    const [interviewStatus, setInterviewStatus] = useState(''); // UI status text
    const [lastFeedback, setLastFeedback] = useState(null);

    // History
    const [history, setHistory] = useState([]);

    // Results
    const [results, setResults] = useState(null);

    const [silenceWarning, setSilenceWarning] = useState(0); // 0 = no warning, 1 = first warning, 2 = final warning

    // Refs
    const audioRef = useRef(null);
    const videoRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const warningTimer1Ref = useRef(null);
    const warningTimer2Ref = useRef(null);
    const isRecordingRef = useRef(false);
    const recognitionRef = useRef(null);
    const transcriptRef = useRef(''); // To keep track of the latest text

    // ── Initialize Speech Recognition ──
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                isRecordingRef.current = true;
                setIsRecording(true);
            };

            recognition.onresult = (event) => {
                let currentText = '';
                for (let i = 0; i < event.results.length; i++) {
                    currentText += event.results[i][0].transcript;
                }

                setLiveTranscript(currentText);
                transcriptRef.current = currentText;

                // Reset silence timer every time we get new speech results
                resetSilenceTimer();
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    setError('Microphone access is required for the interview.');
                    stopRecording();
                }
            };

            recognition.onend = () => {
                // If the API stops itself but we STILL want to be recording, restart it
                // Unless we've already manually stopped it (isRecordingRef is false)
                if (isRecordingRef.current) {
                    try {
                        recognition.start();
                    } catch (e) {
                        // Might throw if already started
                    }
                }
            };

            recognitionRef.current = recognition;
        } else {
            setError('Your browser does not support Speech Recognition. Please use Google Chrome or Microsoft Edge.');
        }

        return () => {
            stopRecording();
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        };
    }, []);


    const resetSilenceTimer = () => {
        // Clear all existing timers
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (warningTimer1Ref.current) clearTimeout(warningTimer1Ref.current);
        if (warningTimer2Ref.current) clearTimeout(warningTimer2Ref.current);

        // Reset warning UI state
        setSilenceWarning(0);

        if (!isRecordingRef.current) return;

        // Stage 1: First Warning after 2.5s
        warningTimer1Ref.current = setTimeout(() => {
            if (isRecordingRef.current) setSilenceWarning(1);
        }, 2500);

        // Stage 2: Final Warning after 5.0s
        warningTimer2Ref.current = setTimeout(() => {
            if (isRecordingRef.current) setSilenceWarning(2);
        }, 5000);

        // Stage 3: Auto-Submit after 7.5s
        silenceTimerRef.current = setTimeout(() => {
            if (isRecordingRef.current) {
                handleSilenceSubmission();
            }
        }, 7500);
    };

    const handleSilenceSubmission = () => {
        stopRecording();
        const finalAnswer = transcriptRef.current.trim();
        if (finalAnswer.length > 0) {
            submitAnswer(finalAnswer);
        } else {
            setInterviewStatus("I didn't catch that. Could you try speaking a bit louder?");
            // Briefly pause before restarting to allow the user to read the message
            setTimeout(() => {
                startRecording();
            }, 2000);
        }
    };

    const startRecording = () => {
        if (!recognitionRef.current) return;
        setLiveTranscript('');
        transcriptRef.current = '';
        isRecordingRef.current = true;
        setIsRecording(true);
        setSilenceWarning(0);

        resetSilenceTimer(); // Start the silence countdown immediately when entering recording state

        try {
            recognitionRef.current.start();
        } catch (e) {
            console.error('Recognition already started', e);
        }
    };

    const stopRecording = () => {
        isRecordingRef.current = false;
        setIsRecording(false);
        setSilenceWarning(0);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (warningTimer1Ref.current) clearTimeout(warningTimer1Ref.current);
        if (warningTimer2Ref.current) clearTimeout(warningTimer2Ref.current);
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) { }
        }
    };


    // ═══════════════════════════════════════════════════════
    // WEBCAM STREAM CONTROLS
    // ═══════════════════════════════════════════════════════

    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Webcam access denied or unavailable:", err);
        }
    };

    const stopWebcam = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    // Auto-cleanup on unmount
    useEffect(() => {
        return () => {
            stopRecording();
            stopWebcam();
        };
    }, []);

    // ═══════════════════════════════════════════════════════
    // START INTERVIEW
    // ═══════════════════════════════════════════════════════

    const startInterview = async () => {
        if (!role) {
            setError('Please select a job role');
            return;
        }
        if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
            setError('Your browser does not support Speech Recognition. Please use Chrome or Edge.');
            return;
        }

        setLoading(true);
        setError('');
        setInterviewStatus('Starting your interview...');

        try {
            // Pre-request mic permission by starting & immediately stopping
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                    setTimeout(() => recognitionRef.current.stop(), 100);
                } catch (e) { }
            }

            const res = await apiClient.post('/voice-interview/start', { role, difficulty });
            setSessionId(res.data.session_id);
            setPhase('interview');
            setInterviewStatus('Alex is preparing your first question...');

            // Start webcam right as interview phase triggers
            setTimeout(() => {
                startWebcam();
            }, 100);

            await fetchNextQuestion(res.data.session_id);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to start interview');
        } finally {
            setLoading(false);
        }
    };


    // ═══════════════════════════════════════════════════════
    // FETCH NEXT QUESTION
    // ═══════════════════════════════════════════════════════

    const fetchNextQuestion = async (sid) => {
        const id = sid || sessionId;
        setLoading(true);
        setLiveTranscript('');
        transcriptRef.current = '';
        setLastFeedback(null);
        setInterviewStatus('Alex is thinking...');

        try {
            const res = await apiClient.get(`/voice-interview/${id}/question`);
            const data = res.data;

            if (data.done) {
                await endInterview(id);
                return;
            }

            setCurrentQuestion(data.question);
            setQuestionType(data.type);
            setQuestionNumber(data.question_number);
            setTotalQuestions(data.total_questions);
            setLoading(false);

            if (data.audio) {
                playQuestionAudio(data.audio);
            } else {
                setInterviewStatus('Your turn! Speak now...');
                startRecording();
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch question');
            setLoading(false);
        }
    };

    const playQuestionAudio = (base64Audio) => {
        try {
            const audioBytes = atob(base64Audio);
            const arrayBuffer = new ArrayBuffer(audioBytes.length);
            const view = new Uint8Array(arrayBuffer);
            for (let i = 0; i < audioBytes.length; i++) {
                view[i] = audioBytes.charCodeAt(i);
            }
            const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);

            if (audioRef.current) {
                audioRef.current.src = url;
                setIsAiSpeaking(true);
                setInterviewStatus('Alex is speaking...');
                audioRef.current.play().catch(() => {
                    // Autoplay blocked fallback
                    setIsAiSpeaking(false);
                    setInterviewStatus('Your turn! Speak now...');
                    startRecording();
                });
                audioRef.current.onended = () => {
                    setIsAiSpeaking(false);
                    URL.revokeObjectURL(url);
                    setInterviewStatus('Your turn! Speak now...');
                    setTimeout(() => startRecording(), 300); // slight pause
                };
            }
        } catch (e) {
            console.error('Audio playback error:', e);
            setIsAiSpeaking(false);
            setInterviewStatus('Your turn! Speak now...');
            startRecording();
        }
    };


    // ═══════════════════════════════════════════════════════
    // SUBMIT ANSWER
    // ═══════════════════════════════════════════════════════

    const submitAnswer = async (textToSubmit) => {
        setIsProcessing(true);
        setInterviewStatus('Evaluating your response...');

        try {
            // We pass the plain text transcript via JSON payload! No audio file required.
            const payload = {
                transcript: textToSubmit,
                question: currentQuestion
            };

            const res = await apiClient.post(`/voice-interview/${sessionId}/answer`, payload);

            const data = res.data;
            setLastFeedback(data);

            // Add to history
            setHistory(prev => [...prev, {
                question: currentQuestion,
                type: questionType,
                answer: data.transcript,
                score: data.score,
                feedback: data.feedback,
                strengths: data.strengths,
                improvement: data.improvement,
            }]);

            setInterviewStatus(`Score: ${data.score}/10 — Moving to next question...`);

            // Wait 4s so candidate can read the feedback
            setTimeout(() => {
                fetchNextQuestion();
            }, 4000);

        } catch (err) {
            const errMsg = err.response?.data?.error || 'Failed to evaluate your answer';
            setError(errMsg);
            setInterviewStatus('Error processing answer. Please try speaking again.');

            setTimeout(() => {
                setError('');
                setInterviewStatus('Your turn! Speak now...');
                startRecording();
            }, 3000);
        } finally {
            setIsProcessing(false);
        }
    };

    // Manual Overrides
    const manualSubmit = () => {
        if (transcriptRef.current.trim().length > 0) {
            handleSilenceSubmission();
        } else {
            setError("Please say something before submitting.");
        }
    };


    // ═══════════════════════════════════════════════════════
    // END INTERVIEW
    // ═══════════════════════════════════════════════════════

    const endInterview = async (sid) => {
        const id = sid || sessionId;
        setLoading(true);
        setInterviewStatus('Generating your final report...');
        stopRecording();

        try {
            const res = await apiClient.post(`/voice-interview/${id}/end`);
            setResults(res.data);
            setPhase('results');
            stopWebcam();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to end interview');
        } finally {
            setLoading(false);
        }
    };

    const scoreColor = (s) => {
        if (s >= 8) return 'text-emerald-400';
        if (s >= 6) return 'text-amber-400';
        if (s >= 4) return 'text-orange-400';
        return 'text-red-400';
    };

    const scoreBg = (s) => {
        if (s >= 8) return 'bg-emerald-500/20 border-emerald-500/30';
        if (s >= 6) return 'bg-amber-500/20 border-amber-500/30';
        if (s >= 4) return 'bg-orange-500/20 border-orange-500/30';
        return 'bg-red-500/20 border-red-500/30';
    };


    // ═══════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════

    return (
        <>
            <Navigation userRole="candidate" />
            <audio ref={audioRef} style={{ display: 'none' }} />

            <div className="min-h-screen bg-slate-50 py-8 px-4 flex flex-col">
                <div className={`mx-auto ${phase === 'interview' ? 'w-full max-w-7xl flex-1 flex flex-col' : 'max-w-4xl'}`}>

                    {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

                    {/* ─── Header ─── */}
                    <div className="flex items-center gap-4 mb-8">
                        <button className="btn-ghost !p-2" onClick={() => navigate('/candidate-dashboard')}>← Back</button>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                                🎤 AI Voice Interview
                                {phase === 'interview' && <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />}
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">
                                {phase === 'interview' ? 'Live interview in progress' : 'Practice with an AI interviewer that speaks and listens'}
                            </p>
                        </div>
                    </div>


                    {/* ════════════════════════════════════════════════ */}
                    {/* SETUP PHASE */}
                    {/* ════════════════════════════════════════════════ */}
                    {phase === 'setup' && (
                        <div className="space-y-6">
                            {/* Role Selection */}
                            <div className="glass-card">
                                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-sm text-blue-700">1</span>
                                    Select Job Role
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {ROLES.map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setRole(r)}
                                            className={`p-3 rounded-xl text-sm font-medium border transition-all duration-200 text-left
                                                ${role === r
                                                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md shadow-blue-500/10'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-slate-50'
                                                }`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Difficulty Selection */}
                            <div className="glass-card">
                                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-sm text-blue-700">2</span>
                                    Select Difficulty
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {DIFFICULTIES.map(d => (
                                        <button
                                            key={d.value}
                                            onClick={() => setDifficulty(d.value)}
                                            className={`p-5 rounded-xl border transition-all duration-200 text-left
                                                ${difficulty === d.value
                                                    ? `bg-${d.color}-50 border-${d.color}-500 shadow-md shadow-${d.color}-500/10`
                                                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="text-2xl mb-2">{d.icon}</div>
                                            <p className={`font-bold text-slate-800`}>{d.label}</p>
                                            <p className="text-xs text-slate-500 mt-1">{d.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Start Button */}
                            <div className="glass-card text-center py-8">
                                <div className="text-5xl mb-4">🎙️</div>
                                <p className="text-slate-600 mb-2 max-w-md mx-auto">
                                    Meet <strong className="text-slate-900">Alex</strong>, your AI interviewer.
                                </p>
                                <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                                    Alex will ask {totalQuestions} questions conversationally. The mic will automatically start
                                    recording when Alex finishes speaking and stop when you pause — like a real conversation.
                                </p>
                                <button
                                    className="btn-primary text-lg px-10 py-4 disabled:opacity-50"
                                    onClick={startInterview}
                                    disabled={loading || !role}
                                >
                                    {loading ? '⏳ Connecting...' : '🚀 Start Interview'}
                                </button>
                                {!role && <p className="text-xs text-red-400 mt-3">⚠ Please select a role first</p>}
                            </div>
                        </div>
                    )}


                    {/* ════════════════════════════════════════════════ */}
                    {/* INTERVIEW PHASE — Live Conversation Mode */}
                    {/* ════════════════════════════════════════════════ */}
                    {phase === 'interview' && (
                        <div className="flex-1 flex flex-col lg:flex-row gap-6 h-full min-h-[700px]">

                            {/* LEFT PANEL: webcam + controls */}
                            <div className="flex-1 flex flex-col gap-4">
                                {/* Top info bar */}
                                <div className="glass-card !p-4 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-3 h-3 rounded-full shadow-sm ${isAiSpeaking ? 'bg-blue-500 animate-pulse shadow-blue-500/50' : isRecording ? 'bg-rose-500 animate-pulse shadow-rose-500/50' : 'bg-emerald-500'}`} />
                                        <div>
                                            <span className="text-sm font-bold text-slate-800 block">Live Interview</span>
                                            <span className="text-xs font-medium text-slate-500 block">{interviewStatus}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <span className="text-xs text-slate-500 font-medium block uppercase tracking-wider">Question</span>
                                            <span className="text-sm font-bold text-slate-800">{questionNumber} / {totalQuestions}</span>
                                        </div>
                                        <Badge variant={
                                            questionType === 'Introduction' ? 'default' :
                                                questionType === 'Technical' ? 'primary' :
                                                    questionType === 'Behavioral' ? 'success' : 'warning'
                                        }>
                                            {questionType}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Video Container */}
                                <div className="flex-1 relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 shadow-inner min-h-[400px]">
                                    {/* Video Element */}
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover transform scale-x-[-1]"
                                    />

                                    {/* Frame Overlay */}
                                    <div className="absolute inset-0 pointer-events-none rounded-2xl border-4 border-slate-900/10 mix-blend-overlay" />

                                    {/* Recording Overlay Indicator */}
                                    {isRecording && (
                                        <div className="absolute top-4 right-4 bg-rose-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-sm animate-pulse">
                                            <span className="w-2 h-2 rounded-full bg-white" />
                                            REC
                                        </div>
                                    )}

                                    {/* Manual Done Button hovering over video */}
                                    {isRecording && (
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
                                            <button
                                                onClick={manualSubmit}
                                                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-full shadow-xl shadow-rose-600/30 transition-all flex items-center gap-2 hover:scale-105 active:scale-95 border-2 border-white/20"
                                            >
                                                <div className="w-3 h-3 bg-white rounded-sm" />
                                                Finish Answer
                                            </button>
                                        </div>
                                    )}

                                    {/* Evaluation Overlay */}
                                    {isProcessing && (
                                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
                                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-xl">
                                                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                                            </div>
                                            <p className="text-white font-semibold text-lg drop-shadow-md">Evaluating Answer...</p>
                                        </div>
                                    )}
                                </div>

                                {/* End Interview Button */}
                                <div className="flex justify-between items-center text-sm px-2">
                                    <span className="text-slate-400 font-medium">Interview Session #{sessionId?.substring(0, 8)}</span>
                                    <button
                                        className="text-rose-500 font-medium hover:text-rose-600 transition-colors flex items-center gap-1"
                                        onClick={() => endInterview()}
                                        disabled={loading || isProcessing}
                                    >
                                        End Early
                                    </button>
                                </div>
                            </div>


                            {/* RIGHT PANEL: Chat Context */}
                            <div className="w-full lg:w-[450px] xl:w-[500px] flex flex-col gap-4">
                                <div className="glass-card flex-1 flex flex-col p-0 overflow-hidden shadow-sm">
                                    {/* Chat Header */}
                                    <div className="p-4 border-b border-slate-100 bg-white flex items-center gap-3 z-10">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl shadow-inner">
                                            🤖
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 leading-tight">Alex</h3>
                                            <p className="text-xs text-slate-500 font-medium">AI Hiring Manager</p>
                                        </div>
                                    </div>

                                    {/* Chat Messages Area */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">

                                        {/* History */}
                                        {history.map((h, i) => (
                                            <div key={i} className="space-y-6">
                                                {/* AI Chat Bubble */}
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm">🤖</div>
                                                    <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-sm shadow-sm max-w-[90%]">
                                                        <p className="text-slate-800 text-sm">{h.question}</p>
                                                    </div>
                                                </div>

                                                {/* User Chat Bubble */}
                                                <div className="flex items-start gap-3 flex-row-reverse">
                                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm">👤</div>
                                                    <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-sm shadow-md max-w-[90%]">
                                                        <p className="text-sm font-medium">{h.answer}</p>
                                                    </div>
                                                </div>

                                                {/* Score Inline feedback */}
                                                <div className="flex justify-center">
                                                    <div className="bg-white border border-slate-100 rounded-full px-4 py-1.5 shadow-sm text-xs flex items-center gap-2">
                                                        <span className={`font-bold ${scoreColor(h.score)}`}>Score: {h.score}/10</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Current Active Question (AI) */}
                                        <div className="flex items-start gap-3 animate-slide-up-fade">
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 ${isAiSpeaking ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-blue-100'} flex items-center justify-center text-sm transition-colors`}>
                                                🤖
                                            </div>
                                            <div className={`bg-white border ${isAiSpeaking ? 'border-blue-300 shadow-blue-500/10' : 'border-slate-200'} p-4 rounded-2xl rounded-tl-sm shadow-sm max-w-[90%] transition-all`}>
                                                <p className="text-slate-800 text-sm font-medium leading-relaxed">
                                                    {loading ? (
                                                        <span className="flex items-center gap-1.5 h-5 px-1">
                                                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                                                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                                                        </span>
                                                    ) : currentQuestion}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Current Live Answer (User) */}
                                        {(isRecording || isProcessing || liveTranscript || silenceWarning > 0) && (
                                            <div className="flex items-start gap-3 flex-row-reverse animate-fade-in">
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 ${isRecording ? 'border-rose-500 bg-rose-50' : 'border-transparent bg-slate-200'} flex items-center justify-center text-sm transition-colors`}>
                                                    👤
                                                </div>
                                                <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-sm shadow-md max-w-[90%] min-w-[120px]">
                                                    {liveTranscript ? (
                                                        <p className="text-sm font-medium leading-relaxed">{liveTranscript}</p>
                                                    ) : isRecording ? (
                                                        <span className="flex items-center gap-2 opacity-80 h-5">
                                                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                                            <span className="text-xs italic">Listening...</span>
                                                        </span>
                                                    ) : null}

                                                    {/* Warning states when candidate pauses */}
                                                    {isRecording && silenceWarning > 0 && liveTranscript.length > 0 && (
                                                        <div className={`mt-3 text-xs flex items-center gap-2 font-medium border-t pt-2 transition-colors ${silenceWarning === 2 ? 'text-amber-200 border-amber-500/50' : 'text-blue-100 border-blue-500/50'
                                                            }`}>
                                                            {silenceWarning === 1 ? '⚠️ Are you done? Submitting soon...' : '🚨 Auto-submitting in 2 seconds...'}
                                                        </div>
                                                    )}

                                                    {/* Submitting indicator injected right inside the user chat bubble */}
                                                    {isProcessing && (
                                                        <div className="mt-3 text-xs text-blue-100 flex items-center gap-2 font-medium border-t border-blue-500/50 pt-2">
                                                            <div className="w-3 h-3 border-2 border-blue-100 border-t-transparent rounded-full animate-spin" />
                                                            Submitting...
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Spacer to push content up smoothly */}
                                        <div className="h-4"></div>
                                    </div>

                                    {/* Bottom Info Bar for Sidebar */}
                                    {lastFeedback && !isProcessing && (
                                        <div className={`p-4 border-t ${lastFeedback.score >= 7 ? 'bg-emerald-50 border-emerald-100' :
                                            lastFeedback.score >= 5 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'
                                            }`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg bg-white border ${scoreBg(lastFeedback.score)} ${scoreColor(lastFeedback.score)}`}>
                                                    {lastFeedback.score}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Latest Feedback</p>
                                                    <p className="text-sm text-slate-700 font-medium leading-tight">{lastFeedback.feedback}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    )}


                    {/* ════════════════════════════════════════════════ */}
                    {/* RESULTS PHASE */}
                    {/* ════════════════════════════════════════════════ */}
                    {phase === 'results' && results && (
                        <div className="space-y-6">
                            {/* Overall Score */}
                            <div className="glass-card text-center py-10">
                                <div className="text-5xl mb-4">🏆</div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Interview Complete!</h2>
                                <p className="text-slate-500 mb-8">Here's how you performed as a {role}</p>

                                <div className="flex justify-center mb-8">
                                    <ScoreRing score={Math.round((results.overall_score || 0) * 10)} size={120} label="Overall" />
                                </div>

                                <Badge variant={results.overall_score >= 7 ? 'success' : results.overall_score >= 5 ? 'warning' : 'danger'}>
                                    {results.overall_score >= 8 ? '🌟 Excellent' :
                                        results.overall_score >= 6 ? '✅ Good' :
                                            results.overall_score >= 4 ? '⚡ Average' : '📚 Needs Improvement'}
                                </Badge>
                            </div>

                            {/* Overall Feedback */}
                            {results.overall_feedback && (
                                <div className="glass-card border-l-4 border-l-brand-500">
                                    <h3 className="text-lg font-bold text-slate-900 mb-3">📝 Overall Feedback</h3>
                                    <p className="text-slate-700 leading-relaxed">{results.overall_feedback}</p>
                                </div>
                            )}

                            {/* Per-Question Breakdown */}
                            <div className="glass-card">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">📊 Question-by-Question Breakdown</h3>
                                <div className="space-y-4">
                                    {(results.questions || []).map((q, i) => {
                                        const a = (results.answers || [])[i] || 'No answer';
                                        const s = (results.scores || [])[i] || {};
                                        return (
                                            <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                                <div className="flex items-start justify-between gap-4 mb-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-blue-600 font-semibold mb-1">Question {i + 1}</p>
                                                        <p className="text-sm text-slate-800 font-medium">{q}</p>
                                                    </div>
                                                    <div className={`text-2xl font-bold ${scoreColor(s.score || 0)} flex-shrink-0`}>
                                                        {s.score || 0}<span className="text-sm text-slate-500">/10</span>
                                                    </div>
                                                </div>
                                                <div className="pl-3 border-l-2 border-slate-200">
                                                    <p className="text-xs text-slate-500 mb-1">Your Answer</p>
                                                    <p className="text-sm text-slate-600 mb-2">{a}</p>
                                                    {s.feedback && (
                                                        <p className="text-xs text-slate-500 italic">💬 {s.feedback}</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    className="btn-primary px-8 py-3"
                                    onClick={() => {
                                        setPhase('setup');
                                        setSessionId(null);
                                        setHistory([]);
                                        setResults(null);
                                        setCurrentQuestion('');
                                        setLiveTranscript('');
                                        setLastFeedback(null);
                                    }}
                                >
                                    🔄 Start New Interview
                                </button>
                                <button
                                    className="btn-ghost px-8 py-3"
                                    onClick={() => navigate('/candidate-dashboard')}
                                >
                                    ← Back to Dashboard
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Inline CSS for animations */}
            <style>{`
                @keyframes soundwave {
                    0%, 100% { transform: scaleY(0.5); }
                    50% { transform: scaleY(1.5); }
                }
                .animate-soundwave {
                    animation: soundwave 0.6s ease-in-out infinite;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 200% 50%; }
                }
                .animate-gradient {
                    background-size: 200% 100%;
                    animation: gradient 2s linear infinite;
                }
            `}</style>
        </>
    );
};
