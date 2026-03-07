import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import useAuthStore from '../context/authStore';
import { Input, Button, Alert } from '../components/Common';
import './Auth.css';

export const Login = () => {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token, role, user_id } = response.data;

      setToken(token);
      setUser(response.data);

      if (role === 'recruiter') {
        navigate('/recruiter-dashboard');
      } else {
        navigate('/jobs');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your account</p>
        </div>

        {error && <Alert type="danger" message={error} />}

        <form onSubmit={handleLogin}>
          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button 
            type="submit" 
            variant="primary" 
            className="btn-block"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <a href="/register">Register here</a></p>
        </div>
      </div>
    </div>
  );
};
