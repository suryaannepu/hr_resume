// Auth context using Zustand for global state management
import { create } from 'zustand';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper to safely get data from localStorage
const getStoredToken = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('token');
    }
  } catch (error) {
    console.warn('localStorage not available:', error);
  }
  return null;
};

const getStoredUser = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const user = window.localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
  } catch (error) {
    console.warn('Failed to parse stored user:', error);
  }
  return null;
};

const useAuthStore = create((set) => {
  // Initialize synchronously from localStorage so auth is available on first render
  const initialToken = getStoredToken();
  const initialUser = getStoredUser();
  const initiallyAuthenticated = !!(initialToken && initialUser);

  return {
    user: initialUser,
    token: initialToken,
    isAuthenticated: initiallyAuthenticated,
    dashboardData: null,
    candidateApplications: [],
    allJobs: [],
    atsHistory: [],
    jobCandidates: {}, // {jobId: [candidates]}

    // Initialize auth from localStorage (call this on app mount)
    initializeAuth: () => {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();
      if (storedToken && storedUser) {
        set({ token: storedToken, user: storedUser, isAuthenticated: true });
      }
    },

    setToken: (token) => {
      try {
        if (window.localStorage) {
          window.localStorage.setItem('token', token);
        }
      } catch (error) {
        console.error('Failed to save token:', error);
      }
      set({ token, isAuthenticated: true });
    },

    setUser: (user) => {
      try {
        if (window.localStorage) {
          window.localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (error) {
        console.error('Failed to save user:', error);
      }
      set({ user });
    },

    logout: () => {
      try {
        if (window.localStorage) {
          window.localStorage.removeItem('token');
          window.localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Failed to remove auth data:', error);
      }
      set({ 
        token: null, user: null, isAuthenticated: false, 
        dashboardData: null, candidateApplications: [], 
        allJobs: [], atsHistory: [], jobCandidates: {} 
      });
    },

    setDashboardData: (data) => set({ dashboardData: data }),
    setCandidateApplications: (data) => set({ candidateApplications: data }),
    setAllJobs: (data) => set({ allJobs: data }),
    setAtsHistory: (data) => set({ atsHistory: data }),
    setJobCandidates: (jobId, candidates) => set((state) => ({
      jobCandidates: { ...state.jobCandidates, [jobId]: candidates }
    })),
  };
});

export default useAuthStore;
