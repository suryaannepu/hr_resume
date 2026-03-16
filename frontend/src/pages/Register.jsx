import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../context/authStore';
import apiClient from '../utils/api';
import { Zap, ArrowRight, Loader2, User, Briefcase } from 'lucide-react';

export const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken, setUser } = useAuthStore();
  
  // States
  const [googleData, setGoogleData] = useState(location.state || null);
  const [role, setRole] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If redirected from login with state, we already have google credential
  const credential = googleData?.credential;

  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleData({
      credential: credentialResponse.credential
    });
    setError('');
  };

  const handleFinalizeRegistration = async (e) => {
    e.preventDefault();
    if (!role) { setError('Please select a role'); return; }
    if (role === 'recruiter' && !companyName) { setError('Company name required for recruiters'); return; }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await apiClient.post('/auth/google', { 
        credential,
        role,
        company_name: companyName 
      });

      if (res.data.error) {
        setError(res.data.error);
        setLoading(false);
        return;
      }

      // Successful registration
      setToken(res.data.token);
      setUser({ 
        name: res.data.name, 
        email: res.data.email, 
        role: res.data.role, 
        company_name: res.data.company_name,
        picture: res.data.picture
      });
      
      navigate(res.data.role === 'recruiter' ? '/recruiter-dashboard' : '/jobs');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
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
            <p className="text-slate-600 mb-6 font-medium">Get started with your Google account</p>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-semibold mb-6 shadow-sm">
                {error}
              </div>
            )}

            {!credential ? (
              <div className="flex flex-col items-center justify-center py-6">
                <p className="text-slate-500 font-medium mb-6">Authenticate first to select your role</p>
                <div className="w-full flex justify-center">
                  <GoogleLogin 
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google verification failed')}
                    useOneTap
                    shape="pill"
                    theme="filled_black"
                    size="large"
                    width="100%"
                  />
                </div>
                <p className="text-center text-sm text-slate-600 font-medium mt-10">
                  Already have an account?{' '}
                  <button onClick={() => navigate('/login')} className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">Sign In &rarr;</button>
                </p>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl mb-8">
                  {googleData.picture && <img src={googleData.picture} alt="" className="w-8 h-8 rounded-full" />}
                  <div>
                    <p className="text-xs font-bold text-indigo-900">Signed in as</p>
                    <p className="text-xs text-indigo-700 font-medium">{googleData.email}</p>
                  </div>
                  <button 
                    onClick={() => setGoogleData(null)}
                    className="ml-auto text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Change Account
                  </button>
                </div>

                <p className="text-sm font-bold text-slate-700 mb-4">Select your role to complete registration</p>
                
                {/* Role Selection */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { value: 'candidate', icon: <User className="w-6 h-6 mb-2" />, label: 'Candidate', subtitle: 'Find your dream job' },
                    { value: 'recruiter', icon: <Briefcase className="w-6 h-6 mb-2" />, label: 'Recruiter', subtitle: 'Hire top talent' },
                  ].map(r => (
                    <button key={r.value} type="button" onClick={() => setRole(r.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-300
                        ${role === r.value ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'}`}>
                      <div className={role === r.value ? 'text-indigo-600' : 'text-slate-500'}>
                        {r.icon}
                      </div>
                      <div className={`font-bold text-sm ${role === r.value ? 'text-indigo-900' : 'text-slate-700'}`}>{r.label}</div>
                      <div className={`text-xs font-medium mt-1 ${role === r.value ? 'text-indigo-600' : 'text-slate-500'}`}>{r.subtitle}</div>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleFinalizeRegistration} className="space-y-4">
                  {role === 'recruiter' && (
                    <div className="animate-fade-in-up">
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Company Name</label>
                      <input 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium" 
                        placeholder="Acme Inc." 
                        value={companyName} 
                        onChange={e => setCompanyName(e.target.value)} 
                        required
                      />
                    </div>
                  )}
                  <button 
                    type="submit" 
                    disabled={loading || !role} 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Complete Setup <ArrowRight className="w-5 h-5" /></>}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
