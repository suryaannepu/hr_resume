import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import { Navigation } from '../components/Navigation';
import { Alert, Card, Button, Input } from '../components/Common';
import { PlusCircle, Lightbulb, Send, Loader2, Briefcase, Building, FileText } from 'lucide-react';

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
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card padding="large">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <PlusCircle className="text-blue-600" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Post New Job</h2>
            </div>
            <p className="text-slate-500 mb-8 text-sm flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-500" />
              AI will automatically extract skills from your description
            </p>

            {error && <Alert type="danger" message={error} onClose={() => setError('')} />}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Job Title"
                placeholder="e.g. Senior Software Engineer"
                value={form.job_title}
                onChange={e => update('job_title', e.target.value)}
                icon={Briefcase}
                required
              />
              <Input
                label="Company Name"
                placeholder="e.g. Acme Inc."
                value={form.company_name}
                onChange={e => update('company_name', e.target.value)}
                icon={Building}
                required
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Job Description</label>
                <div className="relative">
                  <FileText size={18} className="absolute left-3 top-3 text-slate-400" />
                  <textarea
                    className="input-field pl-10 min-h-[180px] resize-y"
                    placeholder="Describe the role, responsibilities, requirements..."
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                    required
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 bg-blue-50 text-blue-700 p-2 rounded-lg border border-blue-100">
                  <Lightbulb size={14} /> AI will auto-extract technical and soft skills from this description
                </p>
              </div>
              <Button type="submit" disabled={loading} className="w-full justify-center" size="lg" icon={loading ? Loader2 : Send}>
                {loading ? 'Creating...' : 'Post Job'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
};
