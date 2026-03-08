import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import apiClient from '../utils/api';
import { Zap, ArrowRight, Loader2, User, Briefcase } from 'lucide-react';

export const Register = () => {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '', company_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.role) { setError('Please select a role'); return; }
    if (form.role === 'recruiter' && !form.company_name) { setError('Company name required for recruiters'); return; }
    setLoading(true); setError('');
    try {
      const res = await apiClient.post('/auth/register', form);
      if (res.data.error) { setError(res.data.error); setLoading(false); return; }
      // Auto-login
      const loginRes = await apiClient.post('/auth/login', { email: form.email, password: form.password });
      if (loginRes.data.token) {
        setToken(loginRes.data.token);
        setUser({ name: loginRes.data.name, email: loginRes.data.email, role: loginRes.data.role, company_name: loginRes.data.company_name });
        navigate(loginRes.data.role === 'recruiter' ? '/recruiter-dashboard' : '/jobs');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500 rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-700 rounded-full blur-3xl opacity-50 -translate-x-1/3 translate-y-1/3" />
        <div className="relative text-center z-10">
          <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-900/20">
            <Zap className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Join the Future</h1>
          <p className="text-lg text-indigo-100 max-w-md font-medium">Create your account and experience AI-powered hiring like never before.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white lg:bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Zap className="w-7 h-7 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Agentic AI Hiring</h1>
          </div>

          <div className="bg-white lg:border lg:border-slate-200 lg:rounded-3xl lg:p-10 lg:shadow-sm">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Create Account</h2>
            <p className="text-slate-600 mb-6 font-medium">Get started in less than a minute</p>

            {error && <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-semibold mb-4 shadow-sm">{error}</div>}

            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { value: 'candidate', icon: <User className="w-6 h-6 mb-2" />, label: 'Candidate', subtitle: 'Find your dream job' },
                { value: 'recruiter', icon: <Briefcase className="w-6 h-6 mb-2" />, label: 'Recruiter', subtitle: 'Hire top talent' },
              ].map(r => (
                <button key={r.value} type="button" onClick={() => update('role', r.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-300
                    ${form.role === r.value ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'}`}>
                  <div className={form.role === r.value ? 'text-indigo-600' : 'text-slate-500'}>
                    {r.icon}
                  </div>
                  <div className={`font-bold text-sm ${form.role === r.value ? 'text-indigo-900' : 'text-slate-700'}`}>{r.label}</div>
                  <div className={`text-xs font-medium mt-1 ${form.role === r.value ? 'text-indigo-600' : 'text-slate-500'}`}>{r.subtitle}</div>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
                <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium" placeholder="John Doe" value={form.name} onChange={e => update('name', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
                <input type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
                <input type="password" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium" placeholder="••••••••" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} />
              </div>
              {form.role === 'recruiter' && (
                <div className="animate-fade-in-up">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Company Name</label>
                  <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium" placeholder="Acme Inc." value={form.company_name} onChange={e => update('company_name', e.target.value)} />
                </div>
              )}
              <button type="submit" disabled={loading || !form.role} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 mt-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>

            <p className="text-center text-sm text-slate-600 font-medium mt-6">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">Sign In &rarr;</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
