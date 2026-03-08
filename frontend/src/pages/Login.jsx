import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import apiClient from '../utils/api';
import { Zap, ArrowRight, Loader2 } from 'lucide-react';

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
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-700 rounded-full blur-3xl opacity-50 -translate-x-1/2 translate-y-1/2" />
        <div className="relative text-center z-10">
          <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-800/20">
            <Zap className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Welcome Back</h1>
          <p className="text-lg text-blue-100 max-w-md font-medium">Sign in to access your Agentic AI Hiring dashboard and manage your hiring pipeline.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white lg:bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Zap className="w-7 h-7 text-blue-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Agentic AI Hiring</h1>
          </div>

          <div className="bg-white lg:border lg:border-slate-200 lg:rounded-3xl lg:p-10 lg:shadow-sm">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Sign In</h2>
            <p className="text-slate-600 mb-8 font-medium">Enter your credentials to continue</p>

            {error && <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-semibold mb-6 shadow-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                <input type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                <input type="password" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-5 h-5" /></>}
              </button>
            </form>

            <p className="text-center text-sm text-slate-600 font-medium mt-8">
              Don't have an account?{' '}
              <button onClick={() => navigate('/register')} className="text-blue-600 hover:text-blue-700 font-bold transition-colors">Create one &rarr;</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
