import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import useAuthStore from '../context/authStore';
import { Navigation } from '../components/Navigation';
import { Button, Alert, Loading, Card, Badge } from '../components/Common';
import './Dashboard.css';

export const ApplyJob = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const response = await apiClient.get(`/jobs/${jobId}`);
      setJob(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load job details');
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
      setError('');
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!resumeFile) {
      setError('Please select a resume file');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result.split(',')[1];
          
          const response = await apiClient.post('/applications/apply', {
            job_id: jobId,
            resume_base64: base64,
            resume_filename: resumeFile.name
          });

          setSuccess(true);
          setTimeout(() => navigate('/candidate-dashboard'), 2000);
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to submit application');
          setSubmitting(false);
        }
      };
      reader.readAsDataURL(resumeFile);
    } catch (err) {
      setError('Error processing file');
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      <Navigation userRole="candidate" />
      <div className="apply-container">
        <div className="apply-wrapper">
          {/* Job Details Section */}
          {job && (
            <Card className="job-details-card">
              <div className="job-header">
                <div className="job-info">
                  <h2 className="job-title">📋 {job.job_title}</h2>
                  <p className="company-name">🏢 {job.company_name}</p>
                </div>
              </div>

              <div className="job-description-full">
                <h4>Job Description</h4>
                <p>{job.description}</p>
              </div>

              {job.required_skills && job.required_skills.length > 0 && (
                <div className="job-skills">
                  <h4>Required Skills</h4>
                  <div className="skills-flex">
                    {job.required_skills.map(skill => (
                      <Badge key={skill} variant="primary">🎯 {skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Application Form Section */}
          <Card className="apply-form-card">
            <h3>📤 Submit Your Application</h3>
            <p className="form-subtitle">Upload your resume to apply for this position</p>

            {error && <Alert type="danger" message={error} />}
            {success && <Alert type="success" message="✅ Application submitted successfully! Redirecting..." />}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">📄 Upload Resume (PDF)</label>
                <div className="file-input-wrapper">
                  <input 
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="file-input"
                    id="resume-upload"
                    required
                    disabled={submitting}
                  />
                  <label htmlFor="resume-upload" className="file-label">
                    {resumeFile ? `✅ ${resumeFile.name}` : '📎 Click to select PDF'}
                  </label>
                </div>
              </div>

              {user && (
                <div className="applicant-info">
                  <p><strong>📧 Applying as:</strong> {user.email}</p>
                  <p><strong>👤 Name:</strong> {user.name}</p>
                </div>
              )}

              <Button 
                type="submit"
                variant="primary"
                className="btn-block btn-submit"
                disabled={submitting || !resumeFile}
              >
                {submitting ? '⏳ Submitting...' : '✨ Submit Application'}
              </Button>
            </form>

            <p className="form-note">Your resume will be analyzed by our AI agents to assess your fit for this role.</p>
          </Card>
        </div>
      </div>
    </>
  );
};
