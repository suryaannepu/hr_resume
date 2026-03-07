import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import { Navigation } from '../components/Navigation';
import { Card, Button, Badge, Alert } from '../components/Common';
import './Dashboard.css';

export const JobsMarketplace = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredJobId, setHoveredJobId] = useState(null);
  const [hoveredContent, setHoveredContent] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await apiClient.get('/jobs/list');
      setJobs(response.data.jobs || []);
    } catch (err) {
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleJobHover = (job) => {
    setHoveredJobId(job._id);
    setHoveredContent(job);
  };

  const handleJobLeave = () => {
    setHoveredJobId(null);
    setHoveredContent(null);
  };

  const handleApply = (jobId) => {
    navigate(`/apply/${jobId}`);
  };

  if (loading) {
    return (
      <>
        <Navigation userRole="candidate" />
        <div className="marketplace-container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading available jobs...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation userRole="candidate" />
      <div className="marketplace-container">
        <div className="container p-4">
          <div style={{ marginBottom: '2rem' }}>
            <h1>📋 Available Jobs</h1>
            <p style={{ color: '#6c7680', marginTop: '0.5rem' }}>
              {jobs.length} {jobs.length === 1 ? 'position' : 'positions'} available
            </p>
          </div>

          {error && <Alert type="danger" message={error} />}

          {jobs.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>No jobs available at the moment.</p>
              <p>Check back soon for new opportunities!</p>
            </div>
          ) : (
            <div className="jobs-grid">
              {jobs.map(job => (
                <Card 
                  key={job._id} 
                  className="job-card-marketplace"
                  onMouseEnter={() => handleJobHover(job)}
                  onMouseLeave={handleJobLeave}
                >
                  {hoveredJobId === job._id && hoveredContent ? (
                    // Hover state - show full description
                    <div className="job-hover-content">
                      <div style={{ marginBottom: '1rem' }}>
                        <h3 style={{ color: '#0077b5', marginBottom: '0.25rem' }}>
                          📋 {hoveredContent.job_title}
                        </h3>
                        <p style={{ color: '#6c7680', fontWeight: 600, fontSize: '0.9rem' }}>
                          🏢 {hoveredContent.company_name}
                        </p>
                      </div>

                      <div style={{ marginBottom: '1rem', maxHeight: '120px', overflow: 'auto' }}>
                        <h5 style={{ marginBottom: '0.5rem', color: '#1f2937' }}>Description</h5>
                        <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: '#4a5460' }}>
                          {hoveredContent.description}
                        </p>
                      </div>

                      {hoveredContent.technical_requirements && hoveredContent.technical_requirements.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          <h5 style={{ marginBottom: '0.5rem', color: '#1f2937', fontSize: '0.9rem' }}>
                            Technical Skills Required
                          </h5>
                          <div className="skills-flex">
                            {hoveredContent.technical_requirements.slice(0, 5).map(skill => (
                              <Badge key={skill} variant="primary">💻 {skill}</Badge>
                            ))}
                            {hoveredContent.technical_requirements.length > 5 && (
                              <Badge variant="default">+{hoveredContent.technical_requirements.length - 5}</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <Button 
                        variant="primary"
                        onClick={() => handleApply(job._id)}
                        style={{ width: '100%' }}
                      >
                        Apply Now →
                      </Button>
                    </div>
                  ) : (
                    // Normal state - compact view
                    <div className="job-card-body">
                      <h3 style={{ color: '#0077b5', marginBottom: '0.5rem' }}>
                        📋 {job.job_title}
                      </h3>
                      <p className="company-name">🏢 {job.company_name}</p>
                      
                      <div className="job-description">
                        {job.description.substring(0, 150)}...
                      </div>

                      <div className="skills-list" style={{ marginBottom: '1.5rem' }}>
                        {job.required_skills?.slice(0, 4).map((skill, idx) => (
                          <Badge key={idx} variant="primary">🎯 {skill}</Badge>
                        ))}
                        {job.required_skills?.length > 4 && (
                          <Badge variant="default">+{job.required_skills.length - 4}</Badge>
                        )}
                      </div>

                      <p style={{ fontSize: '0.8rem', color: '#a0aab5', marginBottom: '1rem' }}>
                        👆 Hover to see full details
                      </p>

                      <Button 
                        variant="primary"
                        onClick={() => handleApply(job._id)}
                        style={{ width: '100%' }}
                      >
                        ✨ Apply
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
