import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import useAuthStore from '../context/authStore';
import { Input, Select, Button, Alert } from '../components/Common';
import './Auth.css';

export const Register = () => {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'candidate',
    company_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.role === 'recruiter' && !formData.company_name) {
      setError('Company name required for recruiters');
      return;
    }

    setLoading(true);

    try {
      const data = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === 'recruiter') {
        data.company_name = formData.company_name;
      }

      const response = await apiClient.post('/auth/register', data);
      
      // Auto-login after registration
      const loginResponse = await apiClient.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      const { token, role } = loginResponse.data;
      setToken(token);
      setUser(loginResponse.data);

      if (role === 'recruiter') {
        navigate('/recruiter-dashboard');
      } else {
        navigate('/jobs');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join our hiring platform</p>
        </div>

        {error && <Alert type="danger" message={error} />}

        <form onSubmit={handleRegister}>
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <Select
            label="Account Type"
            name="role"
            value={formData.role}
            onChange={handleChange}
            options={[
              { value: 'candidate', label: 'Job Candidate' },
              { value: 'recruiter', label: 'Recruiter' }
            ]}
          />

          {formData.role === 'recruiter' && (
            <Input
              label="Company Name"
              type="text"
              placeholder="Your Company"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              required={formData.role === 'recruiter'}
            />
          )}

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <Button 
            type="submit" 
            variant="primary" 
            className="btn-block"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <a href="/login">Sign in</a></p>
        </div>
      </div>
    </div>
  );
};
