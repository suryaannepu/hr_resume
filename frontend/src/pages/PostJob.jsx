import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import { Navigation } from '../components/Navigation';
import { Alert } from '../components/Common';

export const PostJob = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ job_title: '', company_name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm({ ...form, [k]: v });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await apiClient.post('/jobs/create', {
        ...form,
        required_skills: [],
      });
      navigate('/recruiter-dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create job');
    } finally { setLoading(false); }
  };

  return (
    <>
      <Navigation userRole="recruiter" />
      <div className="min-h-screen bg-slate-925 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="glass-card-static">
            <h2 className="text-2xl font-bold text-white mb-1">➕ Post New Job</h2>
            <p className="text-slate-400 mb-8 text-sm">AI will automatically extract skills from your description</p>

            {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Job Title</label>
                <input className="input-field" placeholder="e.g. Senior Software Engineer" value={form.job_title} onChange={e => update('job_title', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Company Name</label>
                <input className="input-field" placeholder="e.g. Acme Inc." value={form.company_name} onChange={e => update('company_name', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Job Description</label>
                <textarea className="input-field min-h-[180px] resize-y" placeholder="Describe the role, responsibilities, requirements..." value={form.description} onChange={e => update('description', e.target.value)} required />
                <p className="text-xs text-slate-500 mt-1">💡 AI will auto-extract technical and soft skills from this description</p>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full text-center">
                {loading ? '⏳ Creating...' : '🚀 Post Job'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
