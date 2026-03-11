import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import { Navigation } from '../components/Navigation';
import { Loading, Alert, Badge, ScoreRing } from '../components/Common';

export const AIInterview = () => {
    const { applicationId } = useParams();
    const navigate = useNavigate();

    // ── State ──
    const [status, setStatus] = useState(null); // not_started | not_invited | in_progress | completed | evaluated
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Interview state
    const [sessionId, setSessionId] = useState(null);
    const [conversation, setConversation] = useState([]);
    const [questionInfo, setQuestionInfo] = useState({ current: 0, total: 0 });
    const [evaluation, setEvaluation] = useState(null);

    // Voice & Video State
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [liveTranscript, setLiveTranscript] = useState('');
    const [interviewStatus, setInterviewStatus] = useState(''); // UI textual status
    const [silenceWarning, setSilenceWarning] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0); // in seconds
    const [cheatingFlags, setCheatingFlags] = useState([]);
    const [needsResume, setNeedsResume] = useState(false);
    const [cheatData, setCheatData] = useState(null);

    // Refs
    const audioRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const recognitionRef = useRef(null);
    const isRecordingRef = useRef(false);
    const transcriptRef = useRef('');
    const silenceTimerRef = useRef(null);
    const warningTimer1Ref = useRef(null);
    const warningTimer2Ref = useRef(null);
    const chatEndRef = useRef(null);

    const finalTranscriptRef = useRef('');
    const isProcessingFrameRef = useRef(false);

    // Speakers for Panel
    const PANEL_MEMBERS = [
        { name: "Alex", role: "Hiring Manager", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80", color: "blue" },
        { name: "Sarah", role: "Technical Lead", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80", color: "emerald" },
        { name: "David", role: "Culture & Fit", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80", color: "purple" }
    ];
    const [activeSpeaker, setActiveSpeaker] = useState(0);


    // ── Initial Fetch ──
    useEffect(() => { checkStatus(); }, [applicationId]);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conversation]);

    // Ensure webcam attaches when video element mounts
    useEffect(() => {
        if (status === 'in_progress' && videoRef.current && !videoRef.current.srcObject) {
            startWebcam();
        }
    }, [status]);

    const checkStatus = async () => {
        try {
            const res = await apiClient.get(`/interview/${applicationId}/status`);
            const d = res.data;
            setStatus(d.status);
            setSessionId(d.session_id || null);
            setConversation(d.conversation || []);
            setQuestionInfo({ current: d.current_question || 0, total: d.total_questions || 0 });
            setEvaluation(d.evaluation || null);

            // If it's already in progress, start webcam
            if (d.status === 'in_progress') {
                startWebcam();
                setInterviewStatus('Interview resumed. Click "Resume Interview" below to continue.');
                setNeedsResume(true);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load interview status');
        } finally {
            setLoading(false);
        }
    };

    const resumeInterview = () => {
        setNeedsResume(false);
        setInterviewStatus('Your turn! Speak now...');
        startRecording();
    };

    useEffect(() => {
        let timer;
        if (status === 'in_progress') {
            timer = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [status]);

    const formatTimer = (seconds) => {
        const remaining = Math.max(0, 45 * 60 - seconds);
        const m = Math.floor(remaining / 60).toString().padStart(2, '0');
        const s = (remaining % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // ── Cheating Detection Loop ──
    useEffect(() => {
        let frameInterval;
        if (status === 'in_progress' && videoRef.current) {
            frameInterval = setInterval(async () => {
                captureAndAnalyzeFrame();
            }, 1000); // 1 FPS to save backend load
        }
        return () => clearInterval(frameInterval);
    }, [status]);

    const captureAndAnalyzeFrame = async () => {
        if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== 4) return;
        if (isProcessingFrameRef.current) return;

        const video = videoRef.current;
        if (video.videoWidth === 0 || video.videoHeight === 0) return;

        isProcessingFrameRef.current = true;

        const overlayCanvas = canvasRef.current;
        const overlayCtx = overlayCanvas.getContext('2d');

        // Ensure the overlay strictly matches the native video resolution
        if (overlayCanvas.width !== video.videoWidth || overlayCanvas.height !== video.videoHeight) {
            overlayCanvas.width = video.videoWidth;
            overlayCanvas.height = video.videoHeight;
        }

        // Downscale image to max 640px wide to prevent backend CPU overload
        const MAX_WIDTH = 640;
        const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
        const targetWidth = video.videoWidth * scale;
        const targetHeight = video.videoHeight * scale;

        // Extract frame using an isolated offscreen canvas so we don't paint the proxy frame to the screen
        const offCanvas = document.createElement('canvas');
        offCanvas.width = targetWidth;
        offCanvas.height = targetHeight;
        const offCtx = offCanvas.getContext('2d');
        offCtx.drawImage(video, 0, 0, targetWidth, targetHeight);

        const base64Image = offCanvas.toDataURL('image/jpeg', 0.5);

        try {
            const res = await apiClient.post(`/interview/${applicationId}/frame`, { image: base64Image });
            const data = res.data;

            // Clear visual overlay
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

            // Draw boxes scaled back up mathematically
            if (data.boxes && data.boxes.length > 0) {
                const invScale = 1 / scale;
                data.boxes.forEach(box => {
                    const x = box.x * invScale;
                    const y = box.y * invScale;
                    const w = box.w * invScale;
                    const h = box.h * invScale;

                    overlayCtx.strokeStyle = box.label === 'Phone' ? '#ef4444' : '#3b82f6';
                    overlayCtx.lineWidth = 4;
                    overlayCtx.strokeRect(x, y, w, h);

                    overlayCtx.fillStyle = box.label === 'Phone' ? '#ef4444' : '#3b82f6';
                    overlayCtx.font = "bold 24px Arial";
                    overlayCtx.fillText(`${box.label} ${(box.confidence * 100).toFixed(0)}%`, x, y > 30 ? y - 10 : y + 30);
                });
            }

            // Handle Flags
            if (data.flags && data.flags.length > 0) {
                const newFlags = data.flags;
                setCheatingFlags(newFlags);

                // If critical cheating flag triggers, immediately terminate the interview
                if (newFlags.includes('Mobile phone detected') || newFlags.includes('Multiple persons detected')) {
                    setCheatData({ screenshot: base64Image, flags: newFlags });
                    setStatus('cheated');
                    stopRecording();
                    stopWebcam();
                    
                    // Post cheat violation to backend
                    apiClient.post(`/interview/${applicationId}/cheat`, { screenshot: base64Image, flags: newFlags })
                        .catch(err => console.error("Failed to submit cheat report:", err));
                }
            } else {
                setCheatingFlags([]);
            }

        } catch (e) {
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        } finally {
            isProcessingFrameRef.current = false;
        }
    };


    // ── Tab Switching Detection ──
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && status === 'in_progress') {
                // User switched tabs during an active interview
                let screenshot = '';
                if (videoRef.current && videoRef.current.readyState >= 2) {
                    try {
                        const off = document.createElement('canvas');
                        off.width = videoRef.current.videoWidth || 640;
                        off.height = videoRef.current.videoHeight || 480;
                        off.getContext('2d').drawImage(videoRef.current, 0, 0, off.width, off.height);
                        screenshot = off.toDataURL('image/jpeg', 0.5);
                    } catch (e) { }
                }
                const flags = ['Tab switching (navigated away)'];
                setCheatData({ screenshot, flags });
                setStatus('cheated');
                stopRecording();
                stopWebcam();
                apiClient.post(`/interview/${applicationId}/cheat`, { screenshot, flags })
                    .catch(err => console.error("Failed to submit tab switch cheat report:", err));
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [status, applicationId]);

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
                let interim = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscriptRef.current += event.results[i][0].transcript + ' ';
                    } else {
                        interim += event.results[i][0].transcript;
                    }
                }
                const currentText = (finalTranscriptRef.current + interim).trim();
                setLiveTranscript(currentText);
                transcriptRef.current = currentText;
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
                if (isRecordingRef.current) {
                    try { recognition.start(); } catch (e) { }
                }
            };

            recognitionRef.current = recognition;
        }

        return () => {
            stopRecording();
            stopWebcam();
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        };
    }, []);

    const resetSilenceTimer = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (warningTimer1Ref.current) clearTimeout(warningTimer1Ref.current);
        if (warningTimer2Ref.current) clearTimeout(warningTimer2Ref.current);

        setSilenceWarning(0);
        if (!isRecordingRef.current) return;

        warningTimer1Ref.current = setTimeout(() => { if (isRecordingRef.current) setSilenceWarning(1); }, 6000);
        warningTimer2Ref.current = setTimeout(() => { if (isRecordingRef.current) setSilenceWarning(2); }, 10000);
        silenceTimerRef.current = setTimeout(() => { if (isRecordingRef.current) handleSilenceSubmission(); }, 15000);
    };

    const handleSilenceSubmission = () => {
        stopRecording();
        const finalAnswer = transcriptRef.current.trim();
        if (finalAnswer.length > 0) {
            sendMessage(finalAnswer);
        } else {
            setInterviewStatus("We didn't catch that. Could you try speaking louder?");
            setTimeout(() => { startRecording(); setInterviewStatus('Your turn! Speak now...'); }, 3000);
        }
    };

    const startRecording = () => {
        if (!recognitionRef.current) return;
        setLiveTranscript('');
        transcriptRef.current = '';
        finalTranscriptRef.current = '';
        isRecordingRef.current = true;
        setIsRecording(true);
        setSilenceWarning(0);
        resetSilenceTimer();
        try { recognitionRef.current.start(); } catch (e) { }
    };

    const stopRecording = () => {
        isRecordingRef.current = false;
        setIsRecording(false);
        setSilenceWarning(0);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (warningTimer1Ref.current) clearTimeout(warningTimer1Ref.current);
        if (warningTimer2Ref.current) clearTimeout(warningTimer2Ref.current);
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) { }
        }
    };

    // ── Webcam ──
    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Webcam access denied:", err);
            // Non-fatal, they can continue without video
        }
    };

    const stopWebcam = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };


    // ── Actions ──
    const startInterview = async () => {
        if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
            setError('Your browser does not support Speech Recognition. Please use Chrome or Edge.');
            return;
        }

        setSending(true);
        setError('');
        setInterviewStatus('Setting up your Official Panel Interview...');

        try {
            // Explicitly request mic and camera to ensure permissions are granted before starting
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                stream.getAudioTracks().forEach(t => t.stop());
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (mediaErr) {
                setError('Microphone and Camera access are required to start the interview.');
                setSending(false);
                return;
            }
            startWebcam();

            const res = await apiClient.post(`/interview/${applicationId}/start`);
            const d = res.data;
            setSessionId(d.session_id);
            setStatus('in_progress');
            setQuestionInfo({ current: d.question_number || 1, total: d.total_questions || 5 });

            if (d.dialogues && d.dialogues.length > 0) {
                const newMessages = d.dialogues.map(dx => ({
                    role: 'interviewer',
                    content: dx.message,
                    speaker_index: dx.speaker_index || 0
                }));
                setConversation(prev => [...prev, ...newMessages]);
                playDialogues(d.dialogues);
            }

        } catch (err) {
            setError(err.response?.data?.error || 'Failed to start interview');
            stopWebcam();
        } finally {
            setSending(false);
        }
    };

    const sendMessage = async (msgText) => {
        if (!msgText.trim() || sending) return;

        stopRecording();
        setSending(true);
        setInterviewStatus('Panel is evaluating your response...');
        setConversation(prev => [...prev, { role: 'candidate', content: msgText }]);

        try {
            const res = await apiClient.post(`/interview/${applicationId}/chat`, { message: msgText });
            const d = res.data;

            if (d.dialogues && d.dialogues.length > 0) {
                const newMessages = d.dialogues.map(dx => ({
                    role: 'interviewer',
                    content: dx.message,
                    speaker_index: dx.speaker_index || 0
                }));
                setConversation(prev => [...prev, ...newMessages]);
                playDialogues(d.dialogues);
            } else if (d.message) {
                setConversation(prev => [...prev, { role: 'interviewer', content: d.message, speaker_index: d.speaker_index || 0 }]);
                if (d.audio) playDialogues([{ audio: d.audio, speaker_index: d.speaker_index || 0 }]);
                else { setInterviewStatus('Your turn! Speak now...'); startRecording(); }
            }

            setQuestionInfo({ current: d.question_number || questionInfo.current, total: d.total_questions || questionInfo.total });

            if (d.status === 'completed') {
                handleCompletion();
            }

        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send message');
            setInterviewStatus('Error. Please try speaking again.');
            setTimeout(() => { setError(''); startRecording(); setInterviewStatus('Your turn! Speak now...'); }, 3000);
        } finally {
            setSending(false);
        }
    };

    const manualSubmit = () => {
        if (transcriptRef.current.trim().length > 0) {
            handleSilenceSubmission();
        } else {
            setError("Please say something before submitting.");
        }
    };

    const handleCompletion = () => {
        setStatus('completed');
        stopRecording();
        stopWebcam();
        setInterviewStatus('Interview Complete. Generating report...');

        // Poll for evaluation
        const poll = setInterval(async () => {
            try {
                const evalRes = await apiClient.get(`/interview/${applicationId}/status`);
                if (evalRes.data.evaluation) {
                    setEvaluation(evalRes.data.evaluation);
                    setStatus('evaluated');
                    clearInterval(poll);
                }
            } catch (e) { }
        }, 3000);
    };

    const playDialogues = (dialogues) => {
        if (!dialogues || dialogues.length === 0) {
            setInterviewStatus('Your turn! Speak now...');
            startRecording();
            return;
        }

        const current = dialogues[0];
        setActiveSpeaker(current.speaker_index || 0);

        if (current.audio) {
            try {
                const audioBytes = atob(current.audio);
                const arrayBuffer = new ArrayBuffer(audioBytes.length);
                const view = new Uint8Array(arrayBuffer);
                for (let i = 0; i < audioBytes.length; i++) view[i] = audioBytes.charCodeAt(i);
                const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
                const url = URL.createObjectURL(blob);

                if (audioRef.current) {
                    audioRef.current.src = url;
                    setIsAiSpeaking(true);
                    setInterviewStatus(`${PANEL_MEMBERS[current.speaker_index || 0].name} is speaking...`);

                    audioRef.current.play().catch(() => {
                        URL.revokeObjectURL(url);
                        playDialogues(dialogues.slice(1));
                    });

                    audioRef.current.onended = () => {
                        setIsAiSpeaking(false);
                        URL.revokeObjectURL(url);
                        playDialogues(dialogues.slice(1));
                    };
                }
            } catch (e) {
                console.error('Audio playback error:', e);
                playDialogues(dialogues.slice(1));
            }
        } else {
            // skip if no audio
            playDialogues(dialogues.slice(1));
        }
    };


    if (loading) return <><Navigation userRole="candidate" /><Loading text="Loading interview..." /></>;

    return (
        <>
            <Navigation userRole="candidate" />
            <audio ref={audioRef} style={{ display: 'none' }} />

            <div className="min-h-screen bg-slate-50 py-8 px-4 flex flex-col">
                <div className={`mx-auto ${status === 'in_progress' ? 'w-full max-w-7xl flex-1 flex flex-col' : 'max-w-4xl'}`}>

                    {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <button className="btn-ghost !p-2" onClick={() => navigate('/candidate-dashboard')}>← Back</button>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                                🏢 Official Panel Interview
                                {status === 'in_progress' && <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-md shadow-red-500/50" />}
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">
                                {status === 'in_progress' ? 'Live Official Assessment in progress' : 'AI-Powered Hiring Panel'}
                            </p>
                        </div>
                    </div>


                    {/* ════════════════════════════════════════════════ */}
                    {/* NOT STARTED */}
                    {/* ════════════════════════════════════════════════ */}
                    {status === 'not_started' && (
                        <div className="glass-card text-center py-16 mt-10">
                            <div className="text-6xl mb-6">💼</div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-3">Your Interview Panel is Ready</h2>
                            <p className="text-slate-500 mb-8 max-w-xl mx-auto leading-relaxed">
                                You will be interviewed by our AI Hiring Panel. Ensure your webcam and microphone are working properly.
                                The interview will consist of {questionInfo.total || 5} questions and is conducted conversationally via voice.
                            </p>
                            <div className="p-4 bg-amber-50 rounded-xl max-w-md mx-auto mb-8 border border-amber-200">
                                <p className="text-sm text-amber-800 font-medium flex items-center gap-2 justify-center">
                                    <span>⚠️</span> Find a quiet room and speak clearly.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <button className="btn-primary text-lg px-12 py-4" onClick={startInterview} disabled={sending}>
                                    {sending ? '⏳ Preparing Panel...' : '🎥 Join Interview Room'}
                                </button>
                            </div>
                        </div>
                    )}

                    {status === 'not_invited' && (
                        <div className="glass-card text-center py-16 mt-10">
                            <div className="text-6xl mb-6">📋</div>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">No Interview Scheduled</h2>
                            <p className="text-slate-500">You haven't been invited for an interview for this application yet.</p>
                        </div>
                    )}

                    {/* ════════════════════════════════════════════════ */}
                    {/* CHEATED */}
                    {/* ════════════════════════════════════════════════ */}
                    {status === 'cheated' && cheatData && (
                        <div className="glass-card mt-10 max-w-2xl mx-auto py-10 px-8 text-center border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                            <div className="text-6xl mb-6">🛑</div>
                            <h2 className="text-3xl font-bold text-red-600 mb-2">Interview Terminated</h2>
                            <p className="text-slate-800 font-bold mb-4 text-xl">Policy Violation Detected: {cheatData.flags.join(', ')}</p>
                            <p className="text-slate-500 mb-8 mx-auto">
                                The automatic cheating detection system has flagged policy violations. The interview has been immediately stopped.
                            </p>
                            <div className="bg-slate-900 p-2 rounded-xl inline-block border-2 border-red-500/50 mb-6 w-full">
                                <img src={cheatData.screenshot} alt="Violation Proof" className="rounded-lg w-full h-auto object-contain max-h-[400px]" />
                            </div>
                            <div>
                                <button className="btn-solid bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-md" onClick={() => navigate('/candidate-dashboard')}>
                                    Return to Dashboard
                                </button>
                            </div>
                        </div>
                    )}


                    {/* ════════════════════════════════════════════════ */}
                    {/* IN PROGRESS */}
                    {/* ════════════════════════════════════════════════ */}
                    {status === 'in_progress' && (
                        <div className="flex-1 flex flex-col lg:flex-row gap-6 h-[85vh] min-h-[700px] max-h-[900px]">

                            {/* LEFT: Video & Panel */}
                            <div className="flex-1 flex flex-col gap-4">

                                {/* Top Stats */}
                                <div className="glass-card !p-4 flex flex-wrap items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-3 h-3 rounded-full ${isAiSpeaking ? 'bg-blue-500 animate-pulse' : isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
                                        <div>
                                            <span className="text-sm font-bold text-slate-800 block">Live Session</span>
                                            <span className="text-xs font-medium text-slate-500 block">{interviewStatus}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Time Remaining</span>
                                            <span className={`text-xl font-bold font-mono tracking-tight block ${elapsedTime > 40 * 60 ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
                                                {formatTimer(elapsedTime)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Video Grid */}
                                <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4">

                                    {/* Candidate Video */}
                                    <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 shadow-sm group min-h-0">
                                        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                                        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10" />

                                        <div className="absolute inset-0 border-4 border-slate-900/10 pointer-events-none rounded-2xl mix-blend-overlay z-20" />

                                        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                                            {cheatingFlags.map((flag, i) => (
                                                <div key={i} className="bg-red-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 animate-pulse shadow-lg backdrop-blur-sm border border-red-400">
                                                    ⚠️ {flag}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="absolute bottom-4 left-4 z-20 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-white font-medium text-sm border border-white/10 flex items-center gap-2">
                                            <span>👤</span> You
                                        </div>
                                        {isRecording && (
                                            <div className="absolute top-4 right-4 bg-red-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 animate-pulse shadow-lg backdrop-blur-sm">
                                                <span className="w-2 h-2 rounded-full bg-white" /> REC
                                            </div>
                                        )}
                                        {isRecording && (
                                            <div className="absolute bottom-6 right-4">
                                                <button onClick={manualSubmit} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xl transition-all border border-white/20 text-sm">
                                                    Finish Answer
                                                </button>
                                            </div>
                                        )}
                                        {needsResume && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                                                <button onClick={resumeInterview} className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-2xl transition-all border border-white/20 text-lg flex items-center gap-3 animate-bounce">
                                                    <span className="text-2xl">▶️</span> Resume Interview
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Panel Members */}
                                    {PANEL_MEMBERS.map((member, idx) => (
                                        <div key={idx} className={`relative bg-slate-900 rounded-2xl overflow-hidden border-2 transition-colors duration-300 flex items-center justify-center min-h-0 ${activeSpeaker === idx && isAiSpeaking ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)]' : 'border-slate-800'}`}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />

                                            {/* Abstract Avatar Graphic */}
                                            <div className="relative z-10 flex flex-col items-center">
                                                <div className={`w-40 h-40 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 flex items-center justify-center transition-transform duration-500 ${activeSpeaker === idx && isAiSpeaking ? 'border-blue-500 scale-105 shadow-[0_0_40px_rgba(59,130,246,0.3)]' : 'border-slate-700 opacity-60'}`}>
                                                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                                </div>
                                                {/* Audio Visualizer rings if speaking */}
                                                {activeSpeaker === idx && isAiSpeaking && (
                                                    <div className="absolute inset-0 flex items-center justify-center -z-10">
                                                        <div className="w-48 h-48 absolute border border-blue-400 rounded-full animate-[ping_2s_ease-out_infinite] opacity-40" />
                                                        <div className="w-56 h-56 absolute border border-blue-300 rounded-full animate-[ping_2.5s_ease-out_infinite] opacity-20" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-20">
                                                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                                                    <p className="text-white font-bold text-sm leading-none">{member.name}</p>
                                                    <p className="text-slate-400 text-xs font-medium mt-1">{member.role}</p>
                                                </div>
                                                {activeSpeaker === idx && isAiSpeaking && (
                                                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg animate-pulse">
                                                        <span className="w-2 h-2 bg-white rounded-full" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                </div>
                            </div>

                            {/* RIGHT: Live Transcript */}
                            <div className="w-full lg:w-[450px] xl:w-[450px] flex flex-col gap-4">
                                <div className="glass-card flex-1 flex flex-col p-0 shadow-sm overflow-hidden">
                                    <div className="p-4 border-b border-slate-100 bg-white">
                                        <h3 className="font-bold text-slate-800">Live Transcript</h3>
                                        <p className="text-xs text-slate-500">Official interview logs</p>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/50">
                                        {conversation.map((msg, i) => (
                                            msg.role === 'interviewer' ? (
                                                <div key={i} className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm overflow-hidden border border-slate-300 shadow-sm">
                                                        <img src={PANEL_MEMBERS[msg.speaker_index || 0].avatar} alt={PANEL_MEMBERS[msg.speaker_index || 0].name} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-sm shadow-sm max-w-[90%]">
                                                        <p className="text-xs font-bold text-slate-500 mb-1">{PANEL_MEMBERS[msg.speaker_index || 0].name}</p>
                                                        <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div key={i} className="flex items-start gap-3 flex-row-reverse">
                                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm">👤</div>
                                                    <div className="bg-slate-800 text-white p-4 rounded-2xl rounded-tr-sm shadow-md max-w-[90%]">
                                                        <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                                                    </div>
                                                </div>
                                            )
                                        ))}

                                        {/* Live transcription bubble */}
                                        {(isRecording || sending || liveTranscript || silenceWarning > 0) && (
                                            <div className="flex items-start gap-3 flex-row-reverse animate-fade-in">
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${isRecording ? 'bg-red-100 border-2 border-red-500' : 'bg-slate-200'} flex items-center justify-center text-sm`}>👤</div>
                                                <div className="bg-slate-800 text-white p-4 rounded-2xl rounded-tr-sm shadow-md max-w-[90%] min-w-[120px]">
                                                    {liveTranscript ? (
                                                        <p className="text-sm font-medium leading-relaxed">{liveTranscript}</p>
                                                    ) : isRecording ? (
                                                        <span className="flex items-center gap-2 opacity-80 h-5">
                                                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                                            <span className="text-xs italic">Listening...</span>
                                                        </span>
                                                    ) : null}

                                                    {isRecording && silenceWarning > 0 && liveTranscript.length > 0 && (
                                                        <div className={`mt-3 text-xs flex items-center gap-2 font-medium border-t pt-2 transition-colors ${silenceWarning === 2 ? 'text-amber-300 border-amber-500/50' : 'text-slate-400 border-slate-600'}`}>
                                                            {silenceWarning === 1 ? '⚠️ Are you done? Submitting soon...' : '🚨 Auto-submitting...'}
                                                        </div>
                                                    )}

                                                    {sending && (
                                                        <div className="mt-3 text-xs text-blue-300 flex items-center gap-2 font-medium border-t border-slate-600 pt-2">
                                                            <div className="w-3 h-3 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                                                            Submitting to Panel...
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* ════════════════════════════════════════════════ */}
                    {/* EVALUATED / COMPLETED */}
                    {/* ════════════════════════════════════════════════ */}
                    {(status === 'completed' || status === 'evaluated') && (
                        <div className="glass-card mt-10 max-w-4xl mx-auto py-10 px-8 text-center">
                            <div className="text-6xl mb-6">🏆</div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Panel Interview Complete</h2>
                            <p className="text-slate-500 mb-8 max-w-md mx-auto">
                                Thank you for your time. Your responses have been recorded and sent to the recruiter.
                            </p>

                            {!evaluation ? (
                                <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center">
                                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                                    <p className="font-bold text-slate-700">Generating Official Report...</p>
                                    <p className="text-sm text-slate-500 mt-2">The AI Panel is discussing your performance.</p>
                                </div>
                            ) : (
                                <div className="text-left bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mt-8 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-2xl font-bold text-slate-800">Official Evaluation</h3>
                                        <Badge variant={
                                            evaluation.hire_recommendation?.includes('Strong') ? 'success' :
                                                evaluation.hire_recommendation?.includes('Hire') ? 'primary' : 'warning'
                                        }>
                                            {evaluation.hire_recommendation || 'Pending Review'}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-10">
                                        {[
                                            { label: 'Overall', score: evaluation.overall_score, color: 'text-blue-600' },
                                            { label: 'Communication', score: evaluation.communication_score, color: 'text-emerald-500' },
                                            { label: 'Technical', score: evaluation.technical_score, color: 'text-amber-500' },
                                            { label: 'Problem Solving', score: evaluation.problem_solving_score, color: 'text-purple-500' },
                                            { label: 'Culture Fit', score: evaluation.cultural_fit_score, color: 'text-rose-500' },
                                        ].map((item, i) => (
                                            <div key={i} className="flex flex-col items-center">
                                                <ScoreRing score={item.score || 0} size={70} />
                                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-3 text-center">{item.label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {evaluation.detailed_feedback && (
                                        <div>
                                            <h4 className="font-bold text-slate-800 mb-3 uppercase tracking-wider text-sm">Panel Feedback</h4>
                                            <p className="text-slate-600 leading-relaxed bg-slate-50 p-5 rounded-xl border border-slate-100">
                                                {evaluation.detailed_feedback}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
