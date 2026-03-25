import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import useAuthStore from '../context/authStore';
import { Alert, Card, Button, Input } from '../components/Common';
import { PlusCircle, Lightbulb, Send, Loader2, Briefcase, Building, FileText, Clock, MapPin } from 'lucide-react';

export const PostJob = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [form, setForm] = useState({ 
    job_title: '', 
    company_name: user?.company_name || '', 
    domain: 'Machine Learning',
    deadline: '',
    description: '',
    location: '',
    job_type: 'Onsite',
    employment_type: 'Full-time',
    resume_template: {
      about: '', education: '', skills: '', projects: '', experience: '', certifications: ''
    }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm({ ...form, [k]: v });
  
  const updateTemplate = (k, v) => setForm({
    ...form,
    resume_template: { ...form.resume_template, [k]: v }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await apiClient.post('/jobs/create', {
        ...form,
        location: { city: form.location, country: '' },
        required_skills: [],
      });
      navigate('/recruiter-dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create job');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] py-12 px-4">
      <div className="max-w-2xl mx-auto">
          <Card padding="large">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#009688]/10 rounded-xl flex items-center justify-center">
                <PlusCircle className="text-[#009688]" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Post New Job</h2>
            </div>
            <p className="text-slate-500 mb-8 text-sm flex items-center gap-2">
              <Lightbulb size={16} className="text-[#009688]" />
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
              <Input
                label="Location (City)"
                placeholder="e.g. Bangalore, Remote"
                value={form.location}
                onChange={e => update('location', e.target.value)}
                icon={MapPin}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Job Type</label>
                  <select
                    className="input-field w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#009688]"
                    value={form.job_type}
                    onChange={e => update('job_type', e.target.value)}
                  >
                    <option value="Onsite">Onsite</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Employment Type</label>
                  <select
                    className="input-field w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#009688]"
                    value={form.employment_type}
                    onChange={e => update('employment_type', e.target.value)}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Job Domain</label>
                  <select
                    className="input-field w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#009688]"
                    value={form.domain}
                    onChange={e => update('domain', e.target.value)}
                    required
                  >
                    <option value="Machine Learning">Machine Learning</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Backend">Backend</option>
                    <option value="Frontend">Frontend</option>
                    <option value="Fullstack">Fullstack</option>
                    <option value="Mobile">Mobile</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <Input
                  label="Application Deadline"
                  type="date"
                  value={form.deadline}
                  onChange={e => update('deadline', e.target.value)}
                  icon={Clock}
                  required
                />
              </div>
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
                <p className="text-xs font-medium mt-2 flex items-center gap-1.5 bg-[#009688]/5 text-[#009688] p-2 rounded-lg border border-[#009688]/20">
                  <Lightbulb size={14} /> AI will auto-extract technical and soft skills from this description
                </p>
              </div>

              {/* Template Requirements */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <FileText size={20} className="text-[#009688]" />
                  Resume Template Guidelines
                </h3>
                <p className="text-sm text-slate-500 mb-5">Define exactly what candidates should include in their tailored AI resumes.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input label="About / Summary" placeholder="e.g. Highlight backend APIs..." value={form.resume_template.about} onChange={e => updateTemplate('about', e.target.value)} />
                  <Input label="Education" placeholder="e.g. Include degree, university..." value={form.resume_template.education} onChange={e => updateTemplate('education', e.target.value)} />
                  <Input label="Skills" placeholder="e.g. Mention Python, React..." value={form.resume_template.skills} onChange={e => updateTemplate('skills', e.target.value)} />
                  <Input label="Projects" placeholder="e.g. Include ML models..." value={form.resume_template.projects} onChange={e => updateTemplate('projects', e.target.value)} />
                  <Input label="Experience" placeholder="e.g. Focus on web development..." value={form.resume_template.experience} onChange={e => updateTemplate('experience', e.target.value)} />
                  <Input label="Certifications" placeholder="e.g. AWS Certified..." value={form.resume_template.certifications} onChange={e => updateTemplate('certifications', e.target.value)} />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full justify-center" size="lg" icon={loading ? Loader2 : Send}>
                {loading ? 'Creating...' : 'Post Job'}
              </Button>
            </form>
          </Card>
        </div>
    </div>
  );
};
