import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../context/authStore';
import apiClient from '../utils/api';
import { Zap, ArrowRight, Loader2 } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/google', { 
        credential: credentialResponse.credential 
      });

      if (res.data.error) {
        setError(res.data.error);
        return;
      }

      if (res.data.needs_role) {
        // Redirect to register with Google info to select role
        navigate('/register', { 
          state: { 
            credential: credentialResponse.credential,
            email: res.data.email,
            name: res.data.name
          } 
        });
        return;
      }

      // Successful login for existing user
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
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
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
            <p className="text-slate-600 mb-8 font-medium">Use your Google account to continue</p>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-semibold mb-6 shadow-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col items-center justify-center py-4">
              {loading ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-slate-500 font-medium">Authenticating...</p>
                </div>
              ) : (
                <div className="w-full flex justify-center">
                  <GoogleLogin 
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google sign-in failed. Please try again.')}
                    useOneTap
                    shape="pill"
                    theme="filled_blue"
                    size="large"
                    width="100%"
                  />
                </div>
              )}
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-bold">New to the platform?</span>
              </div>
            </div>

            <p className="text-center text-sm text-slate-600 font-medium">
              Join the future of hiring today{' '}
              <button onClick={() => navigate('/register')} className="text-blue-600 hover:text-blue-700 font-bold transition-colors">Create account &rarr;</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
