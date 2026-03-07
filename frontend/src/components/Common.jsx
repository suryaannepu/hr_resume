import React from 'react';
import '../styles.css';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick,
  disabled = false,
  type = 'button',
  ...props 
}) => {
  return (
    <button 
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
};

export const Card = ({ children, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
};

export const Badge = ({ children, variant = 'default' }) => {
  return <span className={`badge badge-${variant}`}>{children}</span>;
};

export const Input = ({ 
  label, 
  type = 'text', 
  placeholder, 
  value,
  onChange,
  error,
  ...props 
}) => {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input
        type={type}
        className={`form-input ${error ? 'error' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

export const Select = ({ 
  label, 
  options, 
  value,
  onChange,
  ...props 
}) => {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select 
        className="form-input"
        value={value}
        onChange={onChange}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export const Modal = ({ isOpen, title, children, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Alert = ({ type = 'info', message, onClose }) => {
  return (
    <div className={`alert alert-${type}`}>
      <div>{message}</div>
      {onClose && (
        <button className="alert-close" onClick={onClose}>×</button>
      )}
    </div>
  );
};

export const Loading = () => {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );
};

export const ScoreBar = ({ score, max = 100 }) => {
  const percentage = (score / max) * 100;
  let color = '#ef4444';
  if (percentage >= 70) color = '#22c55e';
  else if (percentage >= 50) color = '#f59e0b';
  
  return (
    <div className="score-bar">
      <div className="score-bar-fill" style={{ width: `${percentage}%`, backgroundColor: color }}></div>
      <span className="score-text">{score}</span>
    </div>
  );
};
