import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingUp, Shield, Lightbulb, GraduationCap, Mic2, Scale, FileText, Target, Users, BarChart3, Bell, MessageSquare, PlusCircle, User, Search, LogOut, ChevronLeft, ChevronRight, Camera, Menu, LayoutDashboard, Loader2, Edit2, Check, X } from 'lucide-react';
import apiClient from '../utils/api';

/* ────────────── Button ────────────── */
export const Button = ({ children, variant = 'primary', size = 'md', onClick, disabled = false, type = 'button', className = '', icon: Icon, ...props }) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    danger: 'btn-danger',
    warning: 'btn-warning',
    ghost: 'btn-ghost',
  };
  const sizes = { sm: 'btn-sm text-sm', md: '', lg: 'px-8 py-4 text-lg' };
  return (
    <button className={`${variants[variant] || variants.primary} ${sizes[size] || ''} ${className} flex items-center gap-2`}
      onClick={onClick} disabled={disabled} type={type} {...props}>
      {Icon && <Icon size={size === 'sm' ? 14 : 18} />}
      {children}
    </button>
  );
};

/* ────────────── Card ────────────── */
export const Card = ({ children, className = '', hover = true, padding = 'normal', variant = 'light', ...props }) => {
  const paddingClasses = { normal: 'p-6', compact: 'p-4', large: 'p-8', none: 'p-0' };
  const variants = {
    light: 'glass-card',
    dark: 'bg-[#1a2234] text-white border-none shadow-xl shadow-slate-900/10',
    ghost: 'bg-transparent border border-slate-200 shadow-none'
  };
  const staticVariants = {
    light: 'glass-card-static',
    dark: 'bg-[#1a2234] text-white border-none shadow-xl shadow-slate-900/10',
    ghost: 'bg-transparent border border-slate-200 shadow-none'
  };
  
  const baseClass = hover ? variants[variant] : staticVariants[variant];
  
  return (
    <div className={`${baseClass} ${paddingClasses[padding] || paddingClasses.normal} ${className}`} {...props}>
      {children}
    </div>
  );
};

/* ────────────── Badge ────────────── */
export const Badge = ({ children, variant = 'default', className = '', size = 'md' }) => {
  const sizeClasses = { sm: 'px-2 py-0.5 text-[10px]', md: 'px-3 py-1 text-xs', lg: 'px-4 py-1.5 text-sm' };
  const map = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    default: 'badge-default',
    excellent: 'badge-excellent',
    good: 'badge-good',
    fair: 'badge-fair',
    poor: 'badge-poor',
  };
  return <span className={`${map[variant] || map.default} ${sizeClasses[size]} ${className}`}>{children}</span>;
};

/* ────────────── ScoreRing ────────────── */
export const ScoreRing = ({ score, size = 80, strokeWidth = 6, label, showValue = true }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const getColor = (s) => {
    if (s >= 80) return '#10b981';
    if (s >= 60) return '#3b82f6';
    if (s >= 40) return '#f59e0b';
    return '#f43f5e';
  };
  const color = getColor(score);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-1000 ease-out" />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-slate-800">{score ?? '—'}</span>
          </div>
        )}
      </div>
      {label && <span className="text-xs text-slate-500 font-medium">{label}</span>}
    </div>
  );
};

/* ────────────── ScoreBar ────────────── */
export const ScoreBar = ({ score, max = 100, label, showPercentage = true }) => {
  const pct = Math.min((score / max) * 100, 100);
  const getColor = (p) => {
    if (p >= 70) return 'from-emerald-500 to-emerald-400';
    if (p >= 50) return 'from-blue-500 to-blue-400';
    if (p >= 30) return 'from-amber-500 to-amber-400';
    return 'from-rose-500 to-rose-400';
  };
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-600 font-medium">{label}</span>
          {showPercentage && <span className="text-slate-800 font-semibold">{score}%</span>}
        </div>
      )}
      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${getColor(pct)} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

/* ────────────── Loading ────────────── */
export const Loading = ({ text = 'Loading...', fullScreen = false }) => (
  <div className={`flex flex-col items-center justify-center gap-4 ${fullScreen ? 'min-h-screen' : 'min-h-[60vh]'}`}>
    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-slate-500 font-medium animate-pulse">{text}</p>
  </div>
);

/* ────────────── Skeleton ────────────── */
export const Skeleton = ({ className = '', circle = false }) => (
  <div className={`skeleton-shimmer ${circle ? 'rounded-full' : 'rounded-lg'} ${className}`} />
);

/* ────────────── Alert ────────────── */
export const Alert = ({ type = 'info', message, onClose, title }) => {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    danger: 'bg-rose-50 border-rose-200 text-rose-800',
  };
  const icons = {
    info: <Lightbulb size={18} className="text-blue-600" />,
    success: <TrendingUp size={18} className="text-emerald-600" />,
    warning: <Shield size={18} className="text-amber-600" />,
    danger: <Scale size={18} className="text-rose-600" />,
  };
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${styles[type] || styles.info} animate-slide-up mb-4`}>
      {icons[type]}
      <div className="flex-1">
        {title && <p className="font-semibold text-sm mb-0.5">{title}</p>}
        <p className={`text-sm ${title ? 'text-slate-600' : 'font-medium'}`}>{message}</p>
      </div>
      {onClose && <button onClick={onClose} className="ml-3 text-lg opacity-60 hover:opacity-100 transition-opacity">×</button>}
    </div>
  );
};

/* ────────────── Modal ────────────── */
export const Modal = ({ isOpen, title, children, onClose, size = 'lg', icon: Icon }) => {
  if (!isOpen) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl', full: 'max-w-7xl' };
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className={`bg-white w-full ${widths[size]} max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl border border-slate-200`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 bg-slate-50/50 rounded-t-2xl">
          {Icon && <Icon size={20} className="text-blue-600" />}
          <h2 className="text-lg font-semibold text-slate-800 flex-1">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all">
            <span className="text-lg">×</span>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

/* ────────────── Input ────────────── */
export const Input = ({ label, error, className = '', icon: Icon, ...props }) => (
  <div className={`mb-4 ${className}`}>
    {label && <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
    <div className="relative">
      {Icon && <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />}
      <input className={`input-field ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''} ${Icon ? 'pl-10' : ''}`} {...props} />
    </div>
    {error && <span className="text-xs text-rose-600 mt-1 flex items-center gap-1"><Scale size={12} /> {error}</span>}
  </div>
);

/* ────────────── Select ────────────── */
export const Select = ({ label, options, icon: Icon, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
    <div className="relative">
      {Icon && <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />}
      <select className={`input-field ${Icon ? 'pl-10' : ''}`} {...props}>
        <option value="">Select an option</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  </div>
);

/* ────────────── Modern AgentCard ────────────── */
export const AgentCard = ({ icon: Icon, title, status, children, accentColor = 'brand', className = '' }) => {
  const accentColors = {
    brand: 'border-l-blue-500 bg-blue-50/30',
    emerald: 'border-l-emerald-500 bg-emerald-50/30',
    amber: 'border-l-amber-500 bg-amber-50/30',
    rose: 'border-l-rose-500 bg-rose-50/30',
    purple: 'border-l-violet-500 bg-violet-50/30',
    cyan: 'border-l-cyan-500 bg-cyan-50/30',
  };
  const iconColors = {
    brand: 'text-blue-600 bg-blue-100',
    emerald: 'text-emerald-600 bg-emerald-100',
    amber: 'text-amber-600 bg-amber-100',
    rose: 'text-rose-600 bg-rose-100',
    purple: 'text-violet-600 bg-violet-100',
    cyan: 'text-cyan-600 bg-cyan-100',
  };
  const statusColors = { active: 'bg-emerald-500', processing: 'bg-amber-500 animate-pulse', pending: 'bg-slate-400', error: 'bg-rose-500' };
  return (
    <div className={`glass-card-static border-l-4 ${accentColors[accentColor] || accentColors.brand} ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColors[accentColor]}`}>
            <Icon size={20} />
          </div>
        )}
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        </div>
        {status && <div className={`w-2.5 h-2.5 rounded-full ${statusColors[status] || statusColors.pending}`} />}
      </div>
      {children}
    </div>
  );
};

/* ────────────── AgentPipelineVisualizer ────────────── */
const AGENTS = [
  { key: 'resume', icon: FileText, name: 'Resume Parser' },
  { key: 'jd', icon: FileText, name: 'JD Analyzer' },
  { key: 'skills', icon: Target, name: 'Skill Match' },
  { key: 'scoring', icon: BarChart3, name: 'Scoring' },
  { key: 'insights', icon: Lightbulb, name: 'Insights' },
  { key: 'risk', icon: Shield, name: 'Risk' },
  { key: 'interview', icon: Mic2, name: 'Interview' },
  { key: 'coach', icon: GraduationCap, name: 'Coach' },
  { key: 'committee', icon: Scale, name: 'Committee' },
];

export const AgentPipelineVisualizer = ({ status = 'pending', agentOutputs = {} }) => {
  const getAgentStatus = (key, idx) => {
    if (status === 'processed') return 'done';
    if (status === 'failed') return 'error';
    if (agentOutputs && agentOutputs[key]) return 'done';
    if (status === 'processing') {
      const doneCount = Object.keys(agentOutputs || {}).length;
      if (idx === doneCount) return 'active';
      if (idx < doneCount) return 'done';
    }
    return 'pending';
  };

  const stepColor = (s) => {
    if (s === 'done') return { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600', dot: 'bg-emerald-500' };
    if (s === 'active') return { bg: 'bg-blue-50', border: 'border-blue-300', icon: 'text-blue-600', dot: 'bg-blue-500' };
    if (s === 'error') return { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'text-rose-600', dot: 'bg-rose-500' };
    return { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'text-slate-400', dot: 'bg-slate-300' };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <Sparkles size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-slate-800">AI Agent Pipeline</h4>
          <p className="text-xs text-slate-500">
            {status === 'processed' ? 'All agents completed' : status === 'processing' ? 'Agents are running...' : status === 'failed' ? 'Pipeline failed' : 'Waiting to start'}
          </p>
        </div>
        <Badge variant={status === 'processed' ? 'success' : status === 'processing' ? 'warning' : status === 'failed' ? 'danger' : 'default'}>
          {status === 'processed' ? 'Complete' : status === 'processing' ? 'Running' : status === 'failed' ? 'Failed' : 'Pending'}
        </Badge>
      </div>

      <div className="flex items-center gap-0 overflow-x-auto pb-1">
        {AGENTS.map((agent, i) => {
          const s = getAgentStatus(agent.key, i);
          const colors = stepColor(s);
          return (
            <React.Fragment key={agent.key}>
              <div
                className={`flex flex-col items-center min-w-[62px] pipeline-step-enter ${s === 'active' ? 'pipeline-step-active' : ''}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-500 ${colors.bg} ${colors.border}`}>
                  {s === 'done' ? (
                    <TrendingUp size={16} className="text-emerald-600" />
                  ) : (
                    <agent.icon size={16} className={colors.icon} />
                  )}
                </div>
                <span className={`text-[10px] mt-1.5 text-center leading-tight font-medium ${s === 'done' ? 'text-emerald-600' : s === 'active' ? 'text-blue-600' : 'text-slate-400'}`}>
                  {agent.name}
                </span>
              </div>
              {i < AGENTS.length - 1 && (
                <div className="w-4 h-[2px] bg-slate-200 rounded-full mb-4 mx-0.5 relative overflow-hidden flex-shrink-0">
                  {(s === 'done') && (
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full pipeline-connector-fill" />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/* ────────────── SkillBadge ────────────── */
export const SkillBadge = ({ skill, matched = false, missing = false }) => {
  if (matched) return <span className="badge bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium">✓ {skill}</span>;
  if (missing) return <span className="badge bg-rose-100 text-rose-700 border border-rose-200 font-medium">{skill}</span>;
  return <span className="badge bg-slate-100 text-slate-700 border border-slate-200 font-medium">{skill}</span>;
};

/* ────────────── Tabs ────────────── */
export const Tabs = ({ tabs, activeTab, onChange }) => (
  <div className="flex gap-1 p-1.5 bg-slate-100 rounded-xl overflow-x-auto">
    {tabs.map(tab => (
      <button key={tab.key} onClick={() => onChange(tab.key)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200
          ${activeTab === tab.key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}>
        {tab.icon && <span>{tab.icon}</span>}
        {tab.label}
      </button>
    ))}
  </div>
);

/* ────────────── Section Header ────────────── */
export const SectionHeader = ({ title, subtitle, icon: Icon, action }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      {Icon && <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><Icon size={20} className="text-blue-600" /></div>}
      <div>
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

/* ────────────── StatWidget ────────────── */
export const StatWidget = ({ value, label, trend, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  return (
    <div className="dashboard-widget flex items-center gap-4">
      {Icon && <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center`}><Icon size={24} /></div>}
      <div className="flex-1">
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      {trend && (
        <div className={`text-sm font-medium ${trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
  );
};

/* ────────────── EmptyState ────────────── */
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
    {Icon && <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4"><Icon size={32} className="text-slate-400" /></div>}
    <p className="text-lg font-semibold text-slate-700 mb-2">{title}</p>
    <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">{description}</p>
    {action}
  </div>
);

/* ────────────── ProgressBar ────────────── */
export const ProgressBar = ({ progress, label, size = 'md' }) => {
  const heightClasses = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
  return (
    <div className="w-full">
      {label && <div className="flex justify-between text-sm mb-1"><span className="text-slate-600">{label}</span><span className="text-slate-800 font-medium">{progress}%</span></div>}
      <div className={`w-full ${heightClasses[size]} bg-slate-200 rounded-full overflow-hidden`}>
        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

/* ────────────── InfoBox ────────────── */
export const InfoBox = ({ type = 'info', title, children }) => {
  const styles = {
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-emerald-50 border-emerald-200',
    warning: 'bg-amber-50 border-amber-200',
    error: 'bg-rose-50 border-rose-200',
  };
  const icons = {
    info: <Lightbulb size={16} className="text-blue-600" />,
    success: <TrendingUp size={16} className="text-emerald-600" />,
    warning: <Shield size={16} className="text-amber-600" />,
    error: <Scale size={16} className="text-rose-600" />,
  };
  return (
    <div className={`p-4 rounded-xl border ${styles[type]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icons[type]}
        {title && <p className="font-semibold text-sm text-slate-800">{title}</p>}
      </div>
      <div className="text-sm text-slate-600">{children}</div>
    </div>
  );
};

/* ────────────── Recruiter Components ────────────── */
export const DashboardSidebar = ({ activePath, navItems, userName = "User", userCompany = "Recruiter", profilePhoto, isUploadingPhoto, onPhotoUpload, onCompanyUpdate, collapsed, onToggle, onLogout }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyInput, setCompanyInput] = useState(userCompany);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const handlePhotoClick = () => {
    setIsPhotoModalOpen(true);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current && !isUploadingPhoto) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onPhotoUpload) {
      setIsPhotoModalOpen(false);
      onPhotoUpload(file);
    }
    if (e.target) e.target.value = '';
  };

  const saveCompany = () => {
    if (companyInput !== userCompany && onCompanyUpdate) {
      onCompanyUpdate(companyInput);
    }
    setIsEditingCompany(false);
  };

  const handleCompanyKeyDown = (e) => {
    if (e.key === 'Enter') saveCompany();
    if (e.key === 'Escape') {
      setCompanyInput(userCompany);
      setIsEditingCompany(false);
    }
  };

  return (
    <div
      className={`bg-[#0f172a] h-screen fixed left-0 top-0 text-slate-300 flex flex-col z-[100] transition-all duration-300 ${
        collapsed ? 'w-[70px]' : 'w-[260px]'
      }`}
    >
      {/* Logo + Toggle */}
      <div className={`flex items-center ${collapsed ? 'justify-center p-4' : 'justify-between px-6 py-5'}`}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/recruiter-dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-[#009688] flex items-center justify-center flex-shrink-0">
            <Sparkles className="text-white" size={20} />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-white font-bold text-base leading-tight">AI Resume Pro</h1>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Recruiter</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="mx-auto mt-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* Profile Section */}
      <div className={`${collapsed ? 'px-2 py-4' : 'px-5 py-4'} border-b border-slate-800`}>
        <div className={`flex ${collapsed ? 'justify-center' : 'items-center gap-3'}`}>
          <div 
            className={`${collapsed ? 'w-10 h-10' : 'w-12 h-12'} rounded-full overflow-hidden border-2 border-[#009688]/40 flex-shrink-0 cursor-pointer relative group`}
            onClick={handlePhotoClick}
            title="Update Profile Photo"
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            {profilePhoto ? (
              <img src={profilePhoto} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#009688] to-[#00796b] flex items-center justify-center text-white font-bold text-sm">
                {(userName || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className={`absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all`}>
              {isUploadingPhoto ? <Loader2 size={16} className="text-white animate-spin" /> : <Camera size={16} className="text-white" />}
            </div>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 group/company">
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
              {isEditingCompany ? (
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="text"
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    onKeyDown={handleCompanyKeyDown}
                    onBlur={saveCompany}
                    autoFocus
                    className="w-full bg-slate-800 text-white text-[10px] font-medium px-1.5 py-0.5 rounded border border-slate-600 focus:outline-none focus:border-[#009688]"
                  />
                  <button onClick={saveCompany} className="text-[#009688] hover:text-emerald-400">
                    <Check size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 mt-0.5">
                  <p className="text-[10px] text-slate-500 font-medium truncate flex-1">{userCompany || 'Recruiter'}</p>
                  <button 
                    onClick={() => setIsEditingCompany(true)}
                    className="opacity-0 group-hover/company:opacity-100 transition-opacity text-slate-500 hover:text-white p-0.5"
                    title="Edit Company Name"
                  >
                    <Edit2 size={10} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-3'} mt-4 space-y-1`}>
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            title={collapsed ? item.label : undefined}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 ${collapsed ? 'px-2' : 'px-4'} py-3 rounded-xl transition-all duration-200 group ${
              activePath === item.path
                ? 'bg-[#009688] text-white shadow-lg shadow-[#009688]/20'
                : 'hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <item.icon size={20} className={activePath === item.path ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
            {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Logout at bottom */}
      <div className={`${collapsed ? 'px-2 pb-4' : 'px-4 pb-4'} mt-auto space-y-2`}>
        <button
          onClick={onLogout}
          title={collapsed ? 'Logout' : undefined}
          className={`w-full ${collapsed ? 'p-3 justify-center' : 'py-3 px-4'} rounded-xl hover:bg-rose-500/10 transition-all flex items-center gap-3 group`}
        >
          <LogOut size={18} className="text-slate-500 group-hover:text-rose-400 flex-shrink-0" />
          {!collapsed && <span className="font-medium text-sm text-slate-500 group-hover:text-rose-400">Logout</span>}
        </button>
      </div>

      {/* Profile Photo Modal */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in" onClick={() => setIsPhotoModalOpen(false)}>
          <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl relative max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setIsPhotoModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 bg-slate-700 hover:bg-slate-600 rounded-full"
            >
              <X size={20} />
            </button>
            <h3 className="text-white text-lg font-semibold mb-6 text-center">Profile Photo</h3>
            
            <div className="flex justify-center mb-8">
              <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-[#009688]/40 bg-slate-700 shadow-xl relative">
                {profilePhoto ? (
                  <img src={profilePhoto} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#009688] to-[#00796b] flex items-center justify-center text-white font-bold text-5xl">
                    {(userName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            
            <Button
              variant="primary"
              className="w-full justify-center bg-gradient-to-r from-[#009688] to-[#00796b] hover:from-[#00796b] hover:to-[#004d40] border-none shadow-lg"
              onClick={handleUploadClick}
              disabled={isUploadingPhoto}
              icon={Camera}
            >
              {isUploadingPhoto ? 'Uploading...' : 'Upload New Photo'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const DashboardTopNav = ({ userName, profilePhoto, onToggleSidebar }) => (
  <div className="h-16 flex items-center justify-between px-8 border-b border-slate-100 bg-white">
    <div className="flex items-center gap-4">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        title="Toggle sidebar"
      >
        <Menu size={20} />
      </button>
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search candidates, jobs..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#009688]/20 focus:border-[#009688]/30 transition-all"
        />
      </div>
    </div>

    <div className="flex items-center gap-4">
      <button className="relative p-2 text-slate-400 hover:text-[#009688] transition-colors">
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
      </button>
      <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
        <span className="text-sm font-semibold text-slate-700">{userName}</span>
        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#009688]/20">
          {profilePhoto ? (
            <img src={profilePhoto} alt={userName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#009688] to-[#00796b] flex items-center justify-center text-white font-bold text-xs">
              {(userName || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const RecruiterStatCard = ({ label, value, trend, icon: Icon, color = 'blue' }) => {
  const configs = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-500', trendBg: 'bg-emerald-50', trendText: 'text-emerald-600' },
    purple: { bg: 'bg-indigo-50', icon: 'text-indigo-500', trendBg: 'bg-emerald-50', trendText: 'text-emerald-600' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-500', trendBg: 'bg-emerald-50', trendText: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-500', trendBg: 'bg-rose-50', trendText: 'text-rose-600' },
  };
  const c = configs[color] || configs.blue;
  
  return (
    <Card padding="compact" hover={false} className="border-none shadow-sm h-full">
      <div className="flex justify-between items-start mb-6">
        <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon size={24} className={c.icon} />
        </div>
        {trend && (
          <div className={`${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} px-2 py-1 rounded-lg text-xs font-bold`}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <p className="text-sm font-semibold text-slate-500 mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
    </Card>
  );
};
