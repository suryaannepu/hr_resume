import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import './Navigation.css';

export const Navigation = ({ userRole }) => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <span className="logo-icon">⚡</span>
          <span>Agentic AI Hiring</span>
        </div>

        <div className="navbar-menu">
          {userRole === 'recruiter' ? (
            <>
              <button className="nav-link" onClick={() => navigate('/recruiter-dashboard')}>
                Dashboard
              </button>
              <button className="nav-link" onClick={() => navigate('/post-job')}>
                Post Job
              </button>
            </>
          ) : (
            <>
              <button className="nav-link" onClick={() => navigate('/jobs')}>
                Browse Jobs
              </button>
              <button className="nav-link" onClick={() => navigate('/candidate-dashboard')}>
                My Applications
              </button>
            </>
          )}
          
          <button className="nav-link nav-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};
