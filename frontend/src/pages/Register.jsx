import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import apiClient from '../utils/api';

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
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-900 via-brand-900 to-slate-925 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-56 h-56 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="relative text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-4xl mx-auto mb-8 shadow-2xl shadow-purple-500/30">⚡</div>
          <h1 className="text-4xl font-extrabold text-white mb-4">Join the Future</h1>
          <p className="text-lg text-purple-200/80 max-w-md">Create your account and experience AI-powered hiring like never before.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-925">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg">⚡</div>
          </div>

          <div className="glass-card-static">
            <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-slate-400 mb-6">Get started in less than a minute</p>

            {error && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>}

            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { value: 'candidate', icon: '👤', label: 'Candidate', subtitle: 'Find your dream job' },
                { value: 'recruiter', icon: '💼', label: 'Recruiter', subtitle: 'Hire top talent' },
              ].map(r => (
                <button key={r.value} type="button" onClick={() => update('role', r.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-300
                    ${form.role === r.value ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10' : 'border-white/10 hover:border-white/20 bg-white/5'}`}>
                  <div className="text-2xl mb-2">{r.icon}</div>
                  <div className="font-semibold text-white text-sm">{r.label}</div>
                  <div className="text-xs text-slate-400">{r.subtitle}</div>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <input className="input-field" placeholder="John Doe" value={form.name} onChange={e => update('name', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input type="email" className="input-field" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <input type="password" className="input-field" placeholder="••••••••" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} />
              </div>
              {form.role === 'recruiter' && (
                <div className="animate-slide-up">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Company Name</label>
                  <input className="input-field" placeholder="Acme Inc." value={form.company_name} onChange={e => update('company_name', e.target.value)} />
                </div>
              )}
              <button type="submit" disabled={loading || !form.role} className="btn-primary w-full text-center">
                {loading ? '⏳ Creating...' : '🚀 Create Account'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">Sign In →</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
