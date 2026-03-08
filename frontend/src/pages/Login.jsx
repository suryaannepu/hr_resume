import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import apiClient from '../utils/api';

export const Login = () => {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.data.error) { setError(res.data.error); return; }
      setToken(res.data.token);
      setUser({ name: res.data.name, email: res.data.email, role: res.data.role, company_name: res.data.company_name });
      navigate(res.data.role === 'recruiter' ? '/recruiter-dashboard' : '/jobs');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-800 via-brand-900 to-slate-925 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="relative text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-4xl mx-auto mb-8 shadow-2xl shadow-brand-500/30">⚡</div>
          <h1 className="text-4xl font-extrabold text-white mb-4">Welcome Back</h1>
          <p className="text-lg text-brand-200/80 max-w-md">Sign in to access your Agentic AI Hiring dashboard and manage your hiring pipeline.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-925">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg shadow-brand-500/20">⚡</div>
            <h1 className="text-2xl font-bold text-white">Agentic AI Hiring</h1>
          </div>

          <div className="glass-card-static">
            <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
            <p className="text-slate-400 mb-8">Enter your credentials to continue</p>

            {error && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl text-sm mb-6">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input type="email" className="input-field" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full text-center">
                {loading ? '⏳ Signing In...' : '→ Sign In'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Don't have an account?{' '}
              <button onClick={() => navigate('/register')} className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">Create one →</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
