import React, { useState, useRef, useEffect } from 'react';
import useAuthStore from '../context/authStore';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import { Navigation } from '../components/Navigation';
import { Button, Alert, Loading, Card, Skeleton } from '../components/Common';
import {
    Upload,
    FileText,
    Check,
    AlertTriangle,
    Lightbulb,
    Eye,
    Download,
    Clock,
    BookOpen,
    Loader
} from 'lucide-react';

const ATSChecker = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const { cachedHistory, setCachedHistory } = useAuthStore(state => ({
        cachedHistory: state.atsHistory,
        setCachedHistory: state.setAtsHistory
    }));
    const [dragOver, setDragOver] = useState(false);
    const [resumeFile, setResumeFile] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(!cachedHistory || cachedHistory.length === 0);
    const [error, setError] = useState('');
    const [history, setHistory] = useState(cachedHistory);
    const [cloudinaryUrl, setCloudinaryUrl] = useState('');

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const res = await apiClient.get('/ats/history');
                if (res.data.success) {
                    setHistory(res.data.history);
                    setCachedHistory(res.data.history);
                }
            } catch (err) {
                console.error('Failed to load history:', err);
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, []);

    const handleFileSelect = (file) => {
        if (file && file.type === 'application/pdf') {
            setResumeFile(file);
            setError('');
        } else {
            setError('Please select a valid PDF file');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleFileSelect(e.dataTransfer.files[0]);
    };

    const handleAnalyze = async () => {
        if (!resumeFile) {
            setError('Please select a resume');
            return;
        }

        setAnalyzing(true);
        setError('');

        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const base64 = reader.result.split(',')[1];
                    const res = await apiClient.post('/ats/analyze', {
                        resume_base64: base64,
                        resume_filename: resumeFile.name,
                        job_description: ''
                    });

                    if (res.data.success) {
                        setAnalysis(res.data);
                        setCloudinaryUrl(res.data.cloudinary_url);
                        if (res.data.ats_check_id) {
                            setHistory([{ _id: res.data.ats_check_id, ...res.data }, ...history]);
                        }
                    }
                } catch (err) {
                    setError(err.response?.data?.error || 'Failed to analyze resume');
                }
            };
            reader.readAsDataURL(resumeFile);
        } catch (err) {
            setError('Error processing file');
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading && (!history || history.length === 0)) {
        return (
            <>
                <Navigation userRole="candidate" />
                <div className="min-h-screen bg-white">
                    <div className="border-b border-gray-200 bg-white">
                        <div className="max-w-6xl mx-auto px-6 py-8">
                            <Skeleton className="h-10 w-64 mb-2" />
                            <Skeleton className="h-4 w-96" />
                        </div>
                    </div>
                    <div className="max-w-6xl mx-auto px-6 py-8">
                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <Card padding="large" className="h-96 flex flex-col items-center justify-center border-none bg-slate-50">
                                    <Skeleton className="w-16 h-16 rounded-full mb-6" />
                                    <Skeleton className="h-6 w-64 mb-2" />
                                    <Skeleton className="h-4 w-48" />
                                </Card>
                            </div>
                            <div className="space-y-4">
                                <Skeleton className="h-6 w-32 mb-4" />
                                {[1, 2, 3].map(i => (
                                    <Card key={i} padding="compact" className="border-none shadow-sm h-24">
                                        <div className="flex gap-4">
                                            <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                                            <div className="flex-1">
                                                <Skeleton className="h-4 w-3/4 mb-2" />
                                                <Skeleton className="h-3 w-1/2" />
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navigation userRole="candidate" />
            <div className="min-h-screen bg-white">
                {/* Header */}
                <div className="border-b border-gray-200 bg-white">
                    <div className="max-w-6xl mx-auto px-6 py-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume ATS Checker</h1>
                        <p className="text-gray-600">Analyze your resume's compatibility with Applicant Tracking Systems</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Left Column - Upload & Results */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Upload Section */}
                            {!analysis && (
                                <div className="border border-gray-200 rounded-lg p-8 bg-white">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Resume</h2>

                                    {error && (
                                        <Alert
                                            type="danger"
                                            message={error}
                                            onClose={() => setError('')}
                                        />
                                    )}

                                    {/* Drag and Drop Area */}
                                    <div
                                        className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer mb-6 ${
                                            dragOver
                                                ? 'border-blue-500 bg-blue-50'
                                                : resumeFile
                                                    ? 'border-green-300 bg-green-50'
                                                    : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                                        }`}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setDragOver(true);
                                        }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".pdf"
                                            className="hidden"
                                            onChange={(e) => handleFileSelect(e.target.files[0])}
                                            disabled={analyzing}
                                        />

                                        {resumeFile ? (
                                            <div>
                                                <FileText size={48} className="mx-auto text-green-600 mb-3" />
                                                <p className="text-gray-900 font-semibold text-lg mb-1">{resumeFile.name}</p>
                                                <p className="text-gray-600 text-sm">
                                                    {(resumeFile.size / 1024).toFixed(0)} KB
                                                </p>
                                            </div>
                                        ) : (
                                            <div>
                                                <Upload size={48} className="mx-auto text-gray-400 mb-3" />
                                                <p className="text-gray-900 font-semibold mb-1">
                                                    Drag and drop your resume here
                                                </p>
                                                <p className="text-gray-600 text-sm">or click to browse (PDF only)</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Analyze Button */}
                                    <Button
                                        size="lg"
                                        onClick={handleAnalyze}
                                        disabled={analyzing || !resumeFile}
                                        className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white"
                                        icon={analyzing ? Loader : Check}
                                    >
                                        {analyzing ? 'Analyzing...' : 'Analyze Resume'}
                                    </Button>
                                </div>
                            )}

                            {/* Results Section */}
                            {analysis && (
                                <div className="space-y-6">
                                    {/* ATS Score Card */}
                                    <div className="border border-gray-200 rounded-lg p-8 bg-white">
                                        <div className="flex items-end justify-between mb-6">
                                            <div>
                                                <p className="text-gray-600 text-sm font-semibold mb-2">
                                                    ATS COMPATIBILITY SCORE
                                                </p>
                                                <div className="flex items-baseline gap-3">
                                                    <span className="text-5xl font-bold text-gray-900">
                                                        {analysis.ats_score}
                                                    </span>
                                                    <span className="text-gray-600 text-lg">/100</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div
                                                    className={`px-4 py-2 rounded font-semibold text-sm ${
                                                        analysis.ats_score >= 80
                                                            ? 'bg-green-100 text-green-800'
                                                            : analysis.ats_score >= 60
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {analysis.ats_score >= 80
                                                        ? 'Excellent'
                                                        : analysis.ats_score >= 60
                                                            ? 'Good'
                                                            : 'Needs Work'}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-gray-600">
                                            {analysis.ats_compatibility} compatibility with ATS systems
                                        </p>
                                    </div>

                                    {/* Strengths & Weaknesses */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Strengths */}
                                        {analysis.analysis?.strengths &&
                                            analysis.analysis.strengths.length > 0 && (
                                                <div className="border border-gray-200 rounded-lg p-6 bg-white">
                                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                        <Check size={20} className="text-green-600" />
                                                        Strengths
                                                    </h3>
                                                    <ul className="space-y-2">
                                                        {analysis.analysis.strengths
                                                            .slice(0, 5)
                                                            .map((s, i) => (
                                                                <li
                                                                    key={i}
                                                                    className="flex items-start gap-2 text-sm text-gray-700"
                                                                >
                                                                    <span className="text-green-600 font-bold mt-0.5">
                                                                        •
                                                                    </span>
                                                                    <span>{s}</span>
                                                                </li>
                                                            ))}
                                                    </ul>
                                                </div>
                                            )}

                                        {/* Weaknesses */}
                                        {analysis.analysis?.weaknesses &&
                                            analysis.analysis.weaknesses.length > 0 && (
                                                <div className="border border-gray-200 rounded-lg p-6 bg-white">
                                                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                        <AlertTriangle size={20} className="text-orange-600" />
                                                        Areas to Improve
                                                    </h3>
                                                    <ul className="space-y-2">
                                                        {analysis.analysis.weaknesses
                                                            .slice(0, 5)
                                                            .map((w, i) => (
                                                                <li
                                                                    key={i}
                                                                    className="flex items-start gap-2 text-sm text-gray-700"
                                                                >
                                                                    <span className="text-orange-600 font-bold mt-0.5">
                                                                        •
                                                                    </span>
                                                                    <span>{w}</span>
                                                                </li>
                                                            ))}
                                                    </ul>
                                                </div>
                                            )}
                                    </div>

                                    {/* Improvements */}
                                    {analysis.improvements?.priority_fixes &&
                                        analysis.improvements.priority_fixes.length > 0 && (
                                            <div className="border border-gray-200 rounded-lg p-6 bg-blue-50">
                                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                    <Lightbulb size={20} className="text-blue-600" />
                                                    Recommended Actions
                                                </h3>
                                                <ol className="space-y-2">
                                                    {analysis.improvements.priority_fixes.map((rec, i) => (
                                                        <li
                                                            key={i}
                                                            className="flex items-start gap-2 text-sm text-gray-700"
                                                        >
                                                            <span className="font-semibold text-blue-600 min-w-5 mt-0.5">
                                                                {i + 1}.
                                                            </span>
                                                            <span>{rec}</span>
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>
                                        )}

                                    {/* Resume Sections */}
                                    {analysis.analysis?.section_completeness && (
                                        <div className="border border-gray-200 rounded-lg p-6 bg-white">
                                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <BookOpen size={20} className="text-gray-600" />
                                                Resume Sections
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {Object.entries(
                                                    analysis.analysis.section_completeness
                                                ).map(([section, present]) => (
                                                    <div
                                                        key={section}
                                                        className={`p-3 rounded flex items-center gap-2 text-sm ${
                                                            present
                                                                ? 'bg-green-50 text-green-800'
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}
                                                    >
                                                        {present ? (
                                                            <Check size={16} />
                                                        ) : (
                                                            <AlertTriangle size={16} />
                                                        )}
                                                        <span className="font-medium">
                                                            {section
                                                                .replace('_', ' ')
                                                                .substring(0, 12)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Download Resume */}
                                    {cloudinaryUrl && (
                                        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-gray-700">
                                                    Resume stored securely in cloud
                                                </p>
                                                <Button
                                                    size="sm"
                                                    icon={Download}
                                                    onClick={() => window.open(cloudinaryUrl, '_blank')}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                                >
                                                    Download
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right Column - Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* History */}
                            <div className="border border-gray-200 rounded-lg p-6 bg-white">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Clock size={20} className="text-gray-600" />
                                    Analysis History
                                </h3>

                                {history.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-6">
                                        No analyses yet
                                    </p>
                                ) : (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {history.map((item) => (
                                            <div
                                                key={item._id}
                                                className="p-3 rounded text-sm bg-white hover:bg-gray-50 border border-gray-200 cursor-pointer"
                                            >
                                                <p className="font-medium text-gray-900 truncate mb-1">
                                                    {item.resume_filename}
                                                </p>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span
                                                        className={`font-bold ${
                                                            item.ats_score >= 80
                                                                ? 'text-green-600'
                                                                : item.ats_score >= 60
                                                                    ? 'text-amber-600'
                                                                    : 'text-red-600'
                                                        }`}
                                                    >
                                                        {item.ats_score}
                                                    </span>
                                                    <span className="text-gray-500">
                                                        {item.analyzed_at
                                                            ? new Date(item.analyzed_at).toLocaleDateString(
                                                                'en-US',
                                                                {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric'
                                                                }
                                                            )
                                                            : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Applications Link */}
                            <div className="border border-gray-200 rounded-lg p-6 bg-white">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Eye size={20} className="text-gray-600" />
                                    Applications
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    View resumes from your job applications
                                </p>
                                <Button
                                    size="sm"
                                    onClick={() => navigate('/candidate-dashboard')}
                                    className="w-full text-center"
                                >
                                    View All
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ATSChecker;
