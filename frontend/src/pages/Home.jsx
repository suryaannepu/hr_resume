import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import { Button } from '../components/Common';
import './Dashboard.css';

export const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate(user?.role === 'recruiter' ? '/recruiter-dashboard' : '/jobs');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-logo">
            <span className="logo-icon">⚡</span>
            <span>Agentic AI Hiring</span>
          </div>
          <div className="navbar-menu">
            {isAuthenticated ? (
              <>
                <button 
                  className="nav-link"
                  onClick={() => navigate(user?.role === 'recruiter' ? '/recruiter-dashboard' : '/jobs')}
                >
                  {user?.role === 'recruiter' ? 'Dashboard' : 'Browse Jobs'}
                </button>
                <button 
                  className="nav-link nav-logout"
                  onClick={() => {
                    // logout
                    navigate('/login');
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="nav-link" onClick={() => navigate('/login')}>
                  Login
                </button>
                <button className="nav-link" onClick={() => navigate('/register')}>
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="hero-section">
        <div className="hero-content">
          <h1>🚀 Find Your Perfect Job Match</h1>
          <p>
            Powered by AI agents that understand your skills and match you with the best opportunities. 
            Experience intelligent hiring like never before.
          </p>
          <div className="hero-buttons">
            <Button 
              className="btn-hero-primary"
              onClick={() => navigate('/register')}
            >
              Get Started Free
            </Button>
            <Button 
              className="btn-hero-secondary"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </div>
        </div>
        <div className="hero-image">
          🎯
        </div>
      </div>

      <div className="features-section">
        <div className="feature-card">
          <div className="feature-icon">🤖</div>
          <h3>AI-Powered Matching</h3>
          <p>
            Our advanced AI agents analyze your resume and job descriptions to find the perfect match 
            based on skills and experience.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Lightning Fast Applications</h3>
          <p>
            Apply to jobs in seconds. Upload your resume once and let our AI handle the rest. 
            No tedious forms to fill.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Smart Insights</h3>
          <p>
            Get detailed insights about your match score for each position and understand how your 
            skills align with job requirements.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🎓</div>
          <h3>Skill Recognition</h3>
          <p>
            Our AI extracts and recognizes all your skills from your resume, even the ones you might 
            have forgotten to mention.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">💼</div>
          <h3>For Recruiters</h3>
          <p>
            Post jobs, review AI-ranked candidates, and make data-driven hiring decisions. 
            Find the best talent in minutes.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Secure & Private</h3>
          <p>
            Your data is secure and private. We use enterprise-grade security and never share your 
            information without consent.
          </p>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#f3f5f7', 
        padding: '4rem 2rem', 
        textAlign: 'center' 
      }}>
        <h2 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>
          Ready to Transform Your Hiring Experience?
        </h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: '#6c7680' }}>
          Join thousands of candidates and recruiters using Agentic AI Hiring Platform
        </p>
        <Button 
          className="btn-primary btn-lg"
          onClick={handleGetStarted}
        >
          {isAuthenticated ? '✨ Go to Dashboard' : '🚀 Start Now'}
        </Button>
      </div>

      <footer style={{
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '2rem',
        textAlign: 'center',
        fontSize: '0.9rem'
      }}>
        <p>© 2026 Agentic AI Hiring Platform. All rights reserved.</p>
        <p style={{ marginTop: '1rem', opacity: 0.8 }}>
          Powered by advanced AI agents • Built for modern hiring
        </p>
      </footer>
    </div>
  );
};
