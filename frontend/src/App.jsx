import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
import { AIInterview } from './pages/AIInterview';
import { VoiceInterview } from './pages/VoiceInterview';
import ATSChecker from './pages/ATSChecker';
import { DashboardSidebar, DashboardTopNav } from './components/Common';
import { LayoutDashboard, Briefcase, User } from 'lucide-react';
import apiClient from './utils/api';

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

function RecruiterLayout({ children }) {
  const { user, setUser, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(user?.picture || null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Fetch profile photo on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/auth/profile');
        if (res.data?.profile_photo) {
          setProfilePhoto(res.data.profile_photo);
        } else if (res.data?.picture) {
          setProfilePhoto(res.data.picture);
        }
      } catch (err) {
        // Silently fail — use Google picture or initials
      }
    };
    fetchProfile();
  }, []);

  const handlePhotoUpload = async (file) => {
    try {
      setIsUploadingPhoto(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result.split(',')[1];
        try {
          const res = await apiClient.put('/auth/profile/photo', { photo_base64: base64Data });
          if (res.data?.photo_url) {
            const url = res.data.photo_url;
            setProfilePhoto(url);
            setUser({ ...user, picture: url });
          }
        } catch (err) {
          console.error("Failed to upload photo:", err);
          alert("Failed to upload photo. Please try again.");
        } finally {
          setIsUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsUploadingPhoto(false);
      console.error("FileReader error:", err);
    }
  };

  const handleCompanyUpdate = async (newName) => {
    try {
      await apiClient.put('/auth/profile/company', { company_name: newName });
      setUser({ ...user, company_name: newName });
    } catch (error) {
      console.error('Failed to update company name:', error);
      alert('Failed to update company name.');
    }
  };

  const navItems = [
    { path: '/recruiter-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/post-job', label: 'Post Job', icon: Briefcase },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => setCollapsed(prev => !prev);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <DashboardSidebar
        activePath={location.pathname}
        navItems={navItems}
        userName={user?.name || 'Recruiter'}
        userCompany={user?.company_name || ''}
        profilePhoto={profilePhoto}
        isUploadingPhoto={isUploadingPhoto}
        onPhotoUpload={handlePhotoUpload}
        onCompanyUpdate={handleCompanyUpdate}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        onLogout={handleLogout}
      />
      <div className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-[70px]' : 'ml-[260px]'}`}>
        <DashboardTopNav
          userName={user?.name}
          profilePhoto={profilePhoto}
          onToggleSidebar={toggleSidebar}
        />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
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
              <RecruiterLayout>
                <RecruiterDashboard />
              </RecruiterLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/job/:jobId/candidates"
          element={
            <PrivateRoute requiredRole="recruiter">
              <RecruiterLayout>
                <JobCandidates />
              </RecruiterLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/post-job"
          element={
            <PrivateRoute requiredRole="recruiter">
              <RecruiterLayout>
                <PostJob />
              </RecruiterLayout>
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
        <Route
          path="/interview/:applicationId"
          element={
            <PrivateRoute requiredRole="candidate">
              <AIInterview />
            </PrivateRoute>
          }
        />
        <Route
          path="/voice-interview"
          element={
            <PrivateRoute requiredRole="candidate">
              <VoiceInterview />
            </PrivateRoute>
          }
        />
        <Route
          path="/ats-checker"
          element={
            <PrivateRoute requiredRole="candidate">
              <ATSChecker />
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
