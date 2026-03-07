import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './context/authStore';

// Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { JobCandidates } from './pages/JobCandidates';
import { PostJob } from './pages/PostJob';
import { JobsMarketplace } from './pages/JobsMarketplace';
import { ApplyJob } from './pages/ApplyJob';
import { CandidateDashboard } from './pages/CandidateDashboard';

// Styles
import './styles.css';

function PrivateRoute({ children, requiredRole = null }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={user?.role === 'recruiter' ? '/recruiter-dashboard' : '/jobs'} />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'recruiter' ? '/recruiter-dashboard' : '/jobs'} />;
  }

  return children;
}

export default function App() {
  const { isAuthenticated, user, initializeAuth } = useAuthStore();

  // Initialize auth from localStorage on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Home/Landing Page */}
        <Route 
          path="/" 
          element={<Home />} 
        />

        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />

        {/* Recruiter Routes */}
        <Route 
          path="/recruiter-dashboard" 
          element={
            <PrivateRoute requiredRole="recruiter">
              <RecruiterDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/job/:jobId/candidates" 
          element={
            <PrivateRoute requiredRole="recruiter">
              <JobCandidates />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/post-job" 
          element={
            <PrivateRoute requiredRole="recruiter">
              <PostJob />
            </PrivateRoute>
          } 
        />

        {/* Candidate Routes */}
        <Route 
          path="/jobs" 
          element={
            <PrivateRoute requiredRole="candidate">
              <JobsMarketplace />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/apply/:jobId" 
          element={
            <PrivateRoute requiredRole="candidate">
              <ApplyJob />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/candidate-dashboard" 
          element={
            <PrivateRoute requiredRole="candidate">
              <CandidateDashboard />
            </PrivateRoute>
          } 
        />

        {/* Default redirect */}
        <Route 
          path="*" 
          element={
            isAuthenticated ? (
              <Navigate to={user?.role === 'recruiter' ? '/recruiter-dashboard' : '/jobs'} />
            ) : (
              <Navigate to="/" />
            )
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
