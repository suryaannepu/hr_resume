import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';

const AGENTS_SHOWCASE = [
  { icon: '📄', name: 'Resume Parser', desc: 'Extracts skills, experience, education, and projects from resumes using NLP' },
  { icon: '📋', name: 'JD Analyzer', desc: 'Parses job descriptions to identify required skills and qualifications' },
  { icon: '🎯', name: 'Skill Normalizer', desc: 'Standardizes skill names across resumes and job descriptions for accurate matching' },
  { icon: '📊', name: 'Scoring Agent', desc: 'Calculates comprehensive match scores based on skills, experience, and education' },
  { icon: '💡', name: 'Insight Agent', desc: 'Generates nuanced hiring insights, strengths, gaps, and growth potential analysis' },
  { icon: '🛡️', name: 'Risk Agent', desc: 'Identifies potential inconsistencies and generates verification questions' },
  { icon: '🎤', name: 'Interview Agent', desc: 'Creates tailored interview plans & conducts AI-powered conversations' },
  { icon: '🎓', name: 'Coach Agent', desc: 'Provides actionable career coaching: resume improvements and upskilling plans' },
  { icon: '⚖️', name: 'Committee Agent', desc: 'Synthesizes all agent outputs into a final hiring recommendation' },
];

const WORKFLOW_STEPS = [
  { num: '01', title: 'Post a Job', desc: 'Recruiter posts a job — AI auto-extracts skills from the description.', icon: '📝' },
  { num: '02', title: 'Candidates Apply', desc: 'Candidates upload their resume. 9 AI agents process it instantly.', icon: '📤' },
  { num: '03', title: 'AI Ranks & Scores', desc: 'Ranking and Shortlisting agents compare all candidates and recommend the best.', icon: '🏆' },
  { num: '04', title: 'Accept or Reject', desc: 'Recruiter reviews insights and selects/rejects. Emails are sent automatically.', icon: '✅' },
  { num: '05', title: 'AI Interview', desc: 'Selected candidates take an AI-powered interview at any time — no scheduling needed.', icon: '🎤' },
];

export const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-925">
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-slate-925/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-lg shadow-lg shadow-brand-500/20">⚡</div>
            <span className="text-lg font-bold gradient-text">Agentic AI Hiring</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#agents" className="hover:text-white transition-colors">AI Agents</a>
            <a href="#workflow" className="hover:text-white transition-colors">How it Works</a>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button className="btn-primary" onClick={() => navigate(user?.role === 'recruiter' ? '/recruiter-dashboard' : '/jobs')}>Go to Dashboard →</button>
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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950/50 via-slate-925 to-purple-950/30" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-40 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-36">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium mb-8 animate-slide-up">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Powered by 9 Specialized AI Agents
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-tight mb-6 animate-slide-up">
                AI-Powered <span className="gradient-text">Interview Assistant</span> for Modern Recruiters
              </h1>
              <p className="text-xl text-slate-400 mb-10 max-w-xl animate-slide-up leading-relaxed">
                Let our AI voice agent conduct candidate interviews while you focus on finding the perfect match. Save time, reduce bias, and improve your hiring process.
              </p>
              <div className="flex flex-wrap gap-4 animate-slide-up">
                <button className="btn-primary text-lg px-8 py-4 shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30 transition-shadow" onClick={() => navigate('/register')}>
                  🚀 Create Interview →
                </button>
                <button className="btn-secondary text-lg px-8 py-4" onClick={() => navigate('/login')}>
                  Watch Demo
                </button>
              </div>
            </div>
            {/* Right side — Dashboard Preview Card */}
            <div className="hidden lg:block animate-slide-up">
              <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-lg">⚡</div>
                  <div>
                    <p className="text-sm font-semibold text-white">Welcome back, User!</p>
                    <p className="text-xs text-slate-500">AI-Powered Recruiter • Active Hiring</p>
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 mb-4">
                  <p className="text-xs text-slate-500 mb-3 font-semibold uppercase tracking-wider">Dashboard</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5 hover:border-brand-500/30 transition-colors cursor-pointer">
                      <p className="text-xl font-bold text-white">📄</p>
                      <p className="text-xs text-slate-400 mt-1">Create New Interview</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5 hover:border-brand-500/30 transition-colors cursor-pointer">
                      <p className="text-xl font-bold text-white">📞</p>
                      <p className="text-xs text-slate-400 mt-1">Create Phone Screening</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {['Full Stack Developer', 'UI/UX Designer', 'Data Engineer'].map((role, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{['💻', '🎨', '📊'][i]}</span>
                        <span className="text-sm text-white">{role}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Copy Link</span>
                        <span className="text-xs text-white bg-brand-500/20 px-2 py-0.5 rounded">AI Send</span>
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
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[{ num: '9', label: 'AI Agents' }, { num: '<30s', label: 'Processing Time' }, { num: '100%', label: 'Automated' }, { num: '24/7', label: 'AI Interviews' }].map((s, i) => (
            <div key={i} className="text-center group">
              <div className="text-3xl font-extrabold gradient-text mb-1 group-hover:scale-110 transition-transform">{s.num}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section id="workflow" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Streamline Your Hiring Process</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">From job posting to AI interview — fully automated in 5 simple steps</p>
        </div>
        <div className="grid md:grid-cols-5 gap-4">
          {WORKFLOW_STEPS.map((step, i) => (
            <div key={i} className="relative group">
              <div className="glass-card text-center h-full hover:border-brand-500/30 transition-all duration-300 hover:-translate-y-1">
                <div className="text-3xl mb-3">{step.icon}</div>
                <div className="text-xs font-bold text-brand-500 mb-1">STEP {step.num}</div>
                <h3 className="text-sm font-bold text-white mb-2">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
              {i < WORKFLOW_STEPS.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 text-slate-600 text-lg z-10">→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* AI Agent Showcase */}
      <section id="agents" className="border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Meet the AI Hiring Committee</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">9 specialized agents work together to analyze every candidate from multiple angles</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AGENTS_SHOWCASE.map((agent, i) => (
              <div key={i} className="glass-card group hover:border-brand-500/30 transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">{agent.icon}</div>
                  <h3 className="font-semibold text-white">{agent.name}</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{agent.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">For Recruiters</h2>
            <div className="space-y-4">
              {['Post jobs and extract skills from JD automatically', 'Auto-process all applications in background', 'View AI-ranked candidates with detailed scores', 'Run AI Ranking & get executive pool insights', 'Select or reject with one click — emails sent automatically', 'Interview plans and risk assessments for every candidate'].map((f, i) => (
                <div key={i} className="flex items-start gap-3 group">
                  <span className="text-emerald-400 mt-0.5 group-hover:scale-125 transition-transform">✓</span>
                  <span className="text-slate-300">{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">For Candidates</h2>
            <div className="space-y-4">
              {['Upload resume once, apply in seconds', 'Get instant AI feedback on your match score', 'View personalized AI coaching and improvement tips', 'Take AI-powered interviews anytime — 24/7 availability', 'See interview focus areas to prepare', 'Receive styled email notifications for decisions'].map((f, i) => (
                <div key={i} className="flex items-start gap-3 group">
                  <span className="text-brand-400 mt-0.5 group-hover:scale-125 transition-transform">✓</span>
                  <span className="text-slate-300">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to Transform Your Hiring?</h2>
          <p className="text-lg text-slate-400 mb-8">Join the future of intelligent, AI-powered recruitment</p>
          <button className="btn-primary text-lg px-10 py-4 shadow-lg shadow-brand-500/25" onClick={() => navigate(isAuthenticated ? (user?.role === 'recruiter' ? '/recruiter-dashboard' : '/jobs') : '/register')}>
            {isAuthenticated ? '✨ Go to Dashboard' : '🚀 Get Started Free'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-925">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <p className="text-sm text-slate-500">© 2026 Agentic AI Hiring Platform. All rights reserved.</p>
          <p className="text-xs text-slate-600 mt-2">Powered by 9 AI agents • AI Interviews • Built for modern hiring</p>
        </div>
      </footer>
    </div>
  );
};
