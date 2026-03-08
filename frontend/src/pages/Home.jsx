import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import {
  Zap, FileText, ClipboardList, Target, BarChart, Lightbulb,
  Shield, Mic, GraduationCap, Scale, FileEdit, Upload,
  Trophy, CheckCircle, Monitor, Palette, ArrowRight
} from 'lucide-react';

const AGENTS_SHOWCASE = [
  { icon: <FileText className="w-6 h-6 text-blue-600" />, name: 'Resume Parser', desc: 'Extracts skills, experience, education, and projects from resumes using NLP' },
  { icon: <ClipboardList className="w-6 h-6 text-emerald-600" />, name: 'JD Analyzer', desc: 'Parses job descriptions to identify required skills and qualifications' },
  { icon: <Target className="w-6 h-6 text-blue-600" />, name: 'Skill Normalizer', desc: 'Standardizes skill names across resumes and job descriptions' },
  { icon: <BarChart className="w-6 h-6 text-indigo-600" />, name: 'Scoring Agent', desc: 'Calculates comprehensive match scores based on requirements' },
  { icon: <Lightbulb className="w-6 h-6 text-amber-500" />, name: 'Insight Agent', desc: 'Generates nuanced hiring insights, strengths, and gap analysis' },
  { icon: <Shield className="w-6 h-6 text-rose-600" />, name: 'Risk Agent', desc: 'Identifies potential inconsistencies and generates verification questions' },
  { icon: <Mic className="w-6 h-6 text-violet-600" />, name: 'Interview Agent', desc: 'Creates tailored interview plans & conducts AI conversations' },
  { icon: <GraduationCap className="w-6 h-6 text-cyan-600" />, name: 'Coach Agent', desc: 'Provides actionable career coaching and resume improvements' },
  { icon: <Scale className="w-6 h-6 text-slate-700" />, name: 'Committee Agent', desc: 'Synthesizes all outputs into a final hiring recommendation' },
];

const WORKFLOW_STEPS = [
  { num: '01', title: 'Post a Job', desc: 'Recruiter posts a job — AI auto-extracts skills from the description.', icon: <FileEdit className="w-8 h-8 text-blue-600" /> },
  { num: '02', title: 'Candidates Apply', desc: 'Candidates upload their resume. 9 AI agents process it instantly.', icon: <Upload className="w-8 h-8 text-blue-600" /> },
  { num: '03', title: 'AI Ranks & Scores', desc: 'Ranking agents compare all candidates and recommend the best.', icon: <Trophy className="w-8 h-8 text-blue-600" /> },
  { num: '04', title: 'Accept or Reject', desc: 'Recruiter reviews insights and selects/rejects. Emails are sent.', icon: <CheckCircle className="w-8 h-8 text-blue-600" /> },
  { num: '05', title: 'AI Interview', desc: 'Selected candidates take an AI interview at any time.', icon: <Mic className="w-8 h-8 text-blue-600" /> },
];

export const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold text-slate-900">Agentic AI Hiring</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#agents" className="hover:text-blue-600 transition-colors">AI Agents</a>
            <a href="#workflow" className="hover:text-blue-600 transition-colors">How it Works</a>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button className="btn-primary" onClick={() => navigate(user?.role === 'recruiter' ? '/recruiter-dashboard' : '/jobs')}>Go to Dashboard <ArrowRight className="w-4 h-4 inline ml-1" /></button>
            ) : (
              <>
                <button className="btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
                <button className="btn-primary" onClick={() => navigate('/register')}>Get Started Free</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-blue-50/50 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold mb-8 shadow-sm">
                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                Powered by 9 Specialized AI Agents
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-tight mb-6 tracking-tight">
                AI-Powered <span className="text-blue-600">Interview Assistant</span> for Modern Recruiters
              </h1>
              <p className="text-xl text-slate-600 mb-10 max-w-xl leading-relaxed font-medium">
                Let our AI voice agent conduct candidate interviews while you focus on finding the perfect match. Save time, reduce bias, and improve your hiring process.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="btn-primary text-lg px-8 py-4 flex items-center gap-2" onClick={() => navigate('/register')}>
                  <Zap className="w-5 h-5" /> Create Interview
                </button>
                <button className="btn-secondary text-lg px-8 py-4" onClick={() => navigate('/login')}>
                  Watch Demo
                </button>
              </div>
            </div>
            {/* Right side — Dashboard Preview Card */}
            <div className="hidden lg:block animate-fade-in-up">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-slate-200/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Welcome back, User!</p>
                    <p className="text-xs text-slate-500 font-medium">AI-Powered Recruiter • Active Hiring</p>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-4">
                  <p className="text-xs text-slate-500 mb-3 font-bold uppercase tracking-wider">Quick Actions</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-4 text-center border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                      <FileEdit className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">Create New Interview</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 text-center border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                      <Mic className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">Create Phone Screening</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 mt-6">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Roles</p>
                  {[
                    { role: 'Full Stack Developer', icon: <Monitor className="w-4 h-4 text-slate-500" /> },
                    { role: 'UI/UX Designer', icon: <Palette className="w-4 h-4 text-slate-500" /> },
                    { role: 'Data Engineer', icon: <BarChart className="w-4 h-4 text-slate-500" /> }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span className="text-sm font-bold text-slate-800">{item.role}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer">Copy Link</span>
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded cursor-pointer hover:bg-blue-100">AI Send</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[{ num: '9', label: 'AI Agents' }, { num: '<30s', label: 'Processing Time' }, { num: '100%', label: 'Automated' }, { num: '24/7', label: 'AI Interviews' }].map((s, i) => (
            <div key={i} className="text-center group">
              <div className="text-4xl font-black text-blue-600 mb-2">{s.num}</div>
              <div className="text-sm font-bold text-slate-600 uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section id="workflow" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4 tracking-tight">Streamline Your Hiring Process</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">From job posting to AI interview — fully automated in 5 simple steps</p>
        </div>
        <div className="grid md:grid-cols-5 gap-6">
          {WORKFLOW_STEPS.map((step, i) => (
            <div key={i} className="relative group">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center h-full hover:shadow-md transition-all duration-300">
                <div className="flex justify-center mb-4 bg-blue-50 w-16 h-16 mx-auto rounded-full items-center">{step.icon}</div>
                <div className="text-xs font-black tracking-widest text-blue-600 mb-2">STEP {step.num}</div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">{step.desc}</p>
              </div>
              {i < WORKFLOW_STEPS.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 text-slate-300 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-6 h-6" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* AI Agent Showcase */}
      <section id="agents" className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4 tracking-tight">Meet the AI Hiring Committee</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">9 specialized agents work together to analyze every candidate from multiple angles</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AGENTS_SHOWCASE.map((agent, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm group hover:shadow-md transition-all duration-300 flex flex-col justify-start">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 transition-colors duration-300">
                    {agent.icon}
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">{agent.name}</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">{agent.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 bg-white">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><Shield className="w-5 h-5 text-blue-600" /></div> For Recruiters
            </h2>
            <div className="space-y-4 font-medium">
              {['Post jobs and extract skills from JD automatically', 'Auto-process all applications in background', 'View AI-ranked candidates with detailed scores', 'Run AI Ranking & get executive pool insights', 'Select or reject with one click — emails sent automatically', 'Interview plans and risk assessments for every candidate'].map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700">{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-8 rounded-3xl bg-blue-50 border border-blue-100 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"><Zap className="w-5 h-5 text-blue-600" /></div> For Candidates
            </h2>
            <div className="space-y-4 font-medium">
              {['Upload resume once, apply in seconds', 'Get instant AI feedback on your match score', 'View personalized AI coaching and improvement tips', 'Take AI-powered interviews anytime — 24/7 availability', 'See interview focus areas to prepare', 'Receive styled email notifications for decisions'].map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-slate-800">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 border-t border-slate-800 text-white rounded-t-[3rem] mx-4 lg:mx-12 mb-0 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-6 py-24 text-center relative z-10">
          <h2 className="text-3xl lg:text-5xl font-black mb-6 tracking-tight">Ready to Transform Your Hiring?</h2>
          <p className="text-xl text-slate-300 mb-10 font-medium">Join the future of intelligent, AI-powered recruitment</p>
          <button className="bg-white text-slate-900 hover:bg-slate-100 hover:shadow-lg transition-all text-xl font-bold px-10 py-5 rounded-2xl shadow-xl shadow-black/20 flex items-center gap-3 mx-auto" onClick={() => navigate(isAuthenticated ? (user?.role === 'recruiter' ? '/recruiter-dashboard' : '/jobs') : '/register')}>
            {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'} <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 mt-0">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center md:flex md:justify-between md:text-left items-center">
          <div>
            <div className="flex items-center gap-2 justify-center md:justify-start mb-2 md:mb-0">
              <Zap className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-slate-900">Agentic AI Hiring Platform</span>
            </div>
            <p className="text-sm text-slate-500 mt-2">© 2026 Agentic AI Hiring Platform. All rights reserved.</p>
          </div>
          <div className="text-sm font-medium text-slate-600 mt-4 md:mt-0">
            Powered by 9 AI agents • Built for modern hiring
          </div>
        </div>
      </footer>
    </div>
  );
};
