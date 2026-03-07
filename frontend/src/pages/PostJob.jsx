import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import { Navigation } from '../components/Navigation';
import { Input, Button, Alert } from '../components/Common';
import './Dashboard.css';

export const PostJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    job_title: '',
    description: '',
    required_skills: '',
    company_name: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const skills = formData.required_skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s);

      await apiClient.post('/jobs/create', {
        job_title: formData.job_title,
        description: formData.description,
        required_skills: skills,
        company_name: formData.company_name
      });

      navigate('/recruiter-dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation userRole="recruiter" />
      <div className="apply-container">
        <div className="apply-box">
          <h1>Post New Job</h1>
          <p>Create a job posting</p>

          {error && <Alert type="danger" message={error} />}

          <form onSubmit={handleSubmit}>
            <Input
              label="Company Name"
              type="text"
              placeholder="Your Company"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              required
            />

            <Input
              label="Job Title"
              type="text"
              placeholder="Senior Software Engineer"
              name="job_title"
              value={formData.job_title}
              onChange={handleChange}
              required
            />

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Job description..."
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              label="Required Skills (comma-separated)"
              type="text"
              placeholder="Python, React, SQL, Docker"
              name="required_skills"
              value={formData.required_skills}
              onChange={handleChange}
              required
            />

            <Button 
              type="submit"
              variant="primary"
              className="btn-block"
              disabled={loading}
            >
              {loading ? 'Posting...' : 'Post Job'}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};
