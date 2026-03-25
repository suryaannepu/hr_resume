import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingUp, Shield, Lightbulb, GraduationCap, Mic2, Scale, FileText, Target, Users, BarChart3, Bell, MessageSquare, PlusCircle, User, Search, LogOut, ChevronLeft, ChevronRight, Camera, Menu, LayoutDashboard, Loader2, Edit2, Check, X, Moon, Sun } from 'lucide-react';
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
    dark: 'bg-[#f8fafc] text-slate-800 border border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.08)]',
    ghost: 'bg-transparent border border-slate-200 shadow-none'
  };
  const staticVariants = {
    light: 'glass-card-static',
    dark: 'bg-[#f8fafc] text-slate-800 border border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.08)]',
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
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#334155" strokeWidth={strokeWidth} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-1000 ease-out" />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-slate-800">{score ?? '-'}</span>
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
    <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl border ${styles[type] || styles.info} animate-slide-up mb-4`}>
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className={`bg-white w-full ${widths[size]} max-h-[85vh] overflow-y-auto rounded-2xl shadow-[0_24px_80px_rgba(15,23,42,0.16)] border border-slate-200`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
          {Icon && <Icon size={20} className="text-blue-400" />}
          <h2 className="text-lg font-semibold text-slate-800 flex-1">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all">
            <span className="text-lg">×</span>
          </button>
        </div>
        <div className="p-6 text-slate-700">{children}</div>
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
    brand: 'border-l-blue-500 bg-blue-50/40',
    emerald: 'border-l-emerald-500 bg-emerald-50/40',
    amber: 'border-l-amber-500 bg-amber-50/40',
    rose: 'border-l-rose-500 bg-rose-50/40',
    purple: 'border-l-violet-500 bg-violet-50/40',
    cyan: 'border-l-cyan-500 bg-cyan-50/40',
  };
  const iconColors = {
    brand: 'text-blue-600 bg-blue-100',
    emerald: 'text-emerald-600 bg-emerald-100',
    amber: 'text-amber-600 bg-amber-100',
    rose: 'text-rose-600 bg-rose-100',
    purple: 'text-violet-600 bg-violet-100',
    cyan: 'text-cyan-600 bg-cyan-100',
  };
  const statusColors = { active: 'bg-emerald-400', processing: 'bg-amber-400 animate-pulse', pending: 'bg-slate-500', error: 'bg-rose-400' };
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
    if (s === 'active') return { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', dot: 'bg-blue-500' };
    if (s === 'error') return { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'text-rose-600', dot: 'bg-rose-500' };
    return { bg: 'bg-slate-100', border: 'border-slate-200', icon: 'text-slate-400', dot: 'bg-slate-400' };
  };

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
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
  <div className="flex gap-1 p-1.5 bg-slate-100 rounded-xl overflow-x-auto border border-slate-200">
    {tabs.map(tab => (
      <button key={tab.key} onClick={() => onChange(tab.key)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200
          ${activeTab === tab.key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}>
        {tab.icon && <span>{tab.icon}</span>}
        {tab.label}
      </button>
    ))}
  </div>
);

/* ────────────── Section Header ────────────── */
export const SectionHeader = ({ title, subtitle, icon: Icon, action }) => (
  <div className="flex items-center justify-between gap-4 mb-6">
    <div className="flex items-center gap-3">
      {Icon && <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center"><Icon size={20} className="text-blue-600" /></div>}
      <div>
        <h3 className="text-xl font-semibold tracking-tight text-slate-800">{title}</h3>
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
    {Icon && <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 border border-slate-200"><Icon size={32} className="text-slate-400" /></div>}
    <p className="text-lg font-semibold text-slate-800 mb-2">{title}</p>
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
        <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

/* ────────────── InfoBox ────────────── */
export const InfoBox = ({ type = 'info', title, children }) => {
  const styles = {
    info: 'bg-blue-500/10 border-blue-400/20',
    success: 'bg-emerald-500/10 border-emerald-400/20',
    warning: 'bg-amber-500/10 border-amber-400/20',
    error: 'bg-rose-500/10 border-rose-400/20',
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
export const DashboardSidebar = ({ activePath, navItems, userName = "User", userCompany = "Recruiter", profilePhoto, isUploadingPhoto, onPhotoUpload, onCompanyUpdate, collapsed, onToggle, onLogout, darkMode }) => {
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

  const dm = darkMode;

  return (
    <div
      className={`h-screen fixed left-0 top-0 flex flex-col z-[100] transition-all duration-300 ${collapsed ? 'w-[70px]' : 'w-[300px]'} ${dm ? 'dark-sidebar' : 'bg-white text-slate-700 border-r border-slate-200/80 backdrop-blur-md shadow-[0_0_35px_rgba(59,130,246,0.12)]'}`}
    >
      {/* ── Logo Header ── */}
      <div className={`pb-0 relative`}>
        {collapsed ? (
          /* Collapsed: just the logo icon, glowing, no box */
          <div className="flex flex-col items-center pt-4 pb-2 gap-2 relative">
            <div
              onClick={() => navigate('/recruiter-dashboard')}
              className="cursor-pointer"
            >
              <img
                src="/resumex-logo.png"
                alt="ResumeX"
                className="transform scale-[2.2]"
                style={{
                  width: '32px',
                  height: '32px',
                  objectFit: 'contain',
                  mixBlendMode: 'normal',
                  display: 'block'
                }}
              />
            </div>
            {/* Toggle button overlaid below logo */}
            <div className="absolute -right-3 top-5">
              <button
                onClick={onToggle}
                className={`p-1 rounded-full shadow-md transition-colors ${dm ? 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700' : 'bg-white text-slate-400 hover:text-slate-800 border border-slate-200'}`}
                title="Expand sidebar"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          /* Expanded: full logo, no box, glow via drop-shadow */
          <div className="px-4 pt-3 pb-0 relative">
            <div
              onClick={() => navigate('/recruiter-dashboard')}
              className="cursor-pointer"
            >
              <img
                src="/resumex-logo.png"
                alt="ResumeX"
                className="transform scale-[1.3] origin-left"
                style={{
                  width: '150px',
                  height: 'auto',
                  display: 'block',
                  mixBlendMode: 'normal'
                }}
              />
            </div>
            {/* Collapse toggle positioned absolutely to not take vertical space */}
            <div className="absolute -right-3 top-5 z-10">
              <button
                onClick={onToggle}
                className={`p-1 rounded-full shadow-md transition-colors ${dm ? 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700' : 'bg-white text-slate-400 hover:text-slate-800 border border-slate-200'}`}
                title="Collapse sidebar"
              >
                <ChevronLeft size={14} />
              </button>
            </div>
          </div>
        )}
      </div>



      {/* Profile Section */}
      <div className={`${collapsed ? 'px-2 pb-3 pt-0' : 'px-4 pb-4 pt-0'} border-b ${dm ? 'border-white/8' : 'border-slate-200/80'} mt-1`}>
        <div className={`flex ${collapsed ? 'justify-center' : 'items-center gap-3'}`}>
          <div
            className={`${collapsed ? 'w-10 h-10' : 'w-12 h-12'} rounded-full overflow-hidden border-2 flex-shrink-0 cursor-pointer relative group ${dm ? 'border-blue-400/30 shadow-[0_0_0_4px_rgba(59,130,246,0.12)]' : 'border-indigo-100 shadow-[0_0_0_4px_rgba(248,250,252,0.96)]'}`}
            onClick={handlePhotoClick}
            title="Update Profile Photo"
          >
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            {profilePhoto ? (
              <img src={profilePhoto} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-white font-bold text-sm ${dm ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}>
                {(userName || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className={`absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all`}>
              {isUploadingPhoto ? <Loader2 size={16} className="text-white animate-spin" /> : <Camera size={16} className="text-white" />}
            </div>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 group/company">
              <p className={`text-sm font-semibold truncate ${dm ? 'text-white' : 'text-slate-900'}`}>{userName}</p>
              {isEditingCompany ? (
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="text"
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    onKeyDown={handleCompanyKeyDown}
                    onBlur={saveCompany}
                    autoFocus
                    className={`w-full text-[10px] font-medium px-2 py-1 rounded-lg border focus:outline-none ${dm ? 'bg-white/10 text-white border-white/20 focus:border-blue-400' : 'bg-white text-slate-800 border-slate-300 focus:border-blue-400'}`}
                  />
                  <button onClick={saveCompany} className={dm ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}>
                    <Check size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 mt-0.5">
                  <p className={`text-[10px] font-medium truncate flex-1 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{userCompany || 'Recruiter'}</p>
                  <button
                    onClick={() => setIsEditingCompany(true)}
                    className={`opacity-0 group-hover/company:opacity-100 transition-opacity p-0.5 ${dm ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'}`}
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
      <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-3'} mt-5 space-y-2.5`}>
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            title={collapsed ? item.label : undefined}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 ${collapsed ? 'px-2' : 'px-4'} py-3.5 rounded-2xl transition-all duration-200 group border ${
              activePath === item.path
                ? dm
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400/30 text-white shadow-[0_14px_30px_rgba(59,130,246,0.35)]'
                  : 'bg-[linear-gradient(135deg,_#4f46e5_0%,_#3b82f6_100%)] border-indigo-400/30 text-white shadow-[0_14px_30px_rgba(79,70,229,0.22)]'
                : dm
                  ? 'border-transparent hover:bg-white/8 hover:border-white/10 text-slate-400 hover:text-white'
                  : 'border-transparent hover:bg-indigo-50/70 hover:border-indigo-100 hover:text-slate-900'
            }`}
          >
            <item.icon
              size={20}
              className={activePath === item.path
                ? 'text-white'
                : dm
                  ? 'text-slate-500 group-hover:text-blue-300'
                  : 'text-slate-400 group-hover:text-indigo-600'
              }
            />
            {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Logout at bottom */}
      <div className={`${collapsed ? 'px-2 pb-4' : 'px-4 pb-4'} mt-auto space-y-2`}>
        <button
          onClick={onLogout}
          title={collapsed ? 'Logout' : undefined}
          className={`w-full ${collapsed ? 'p-3 justify-center' : 'py-3 px-4'} rounded-2xl border border-transparent transition-all flex items-center gap-3 group ${dm ? 'hover:bg-rose-500/10 hover:border-rose-400/20' : 'hover:bg-rose-50 hover:border-rose-100'}`}
        >
          <LogOut size={18} className={`flex-shrink-0 ${dm ? 'text-slate-500 group-hover:text-rose-400' : 'text-slate-400 group-hover:text-rose-500'}`} />
          {!collapsed && <span className={`font-medium text-sm ${dm ? 'text-slate-500 group-hover:text-rose-400' : 'text-slate-500 group-hover:text-rose-500'}`}>Logout</span>}
        </button>
      </div>

      {/* Profile Photo Modal */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-sm animate-fade-in" onClick={() => setIsPhotoModalOpen(false)}>
          <div className={`p-6 rounded-2xl shadow-[0_24px_80px_rgba(15,23,42,0.16)] relative max-w-sm w-full border ${dm ? 'bg-[#1a1f3a] border-white/10' : 'bg-white border-slate-200'}`} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setIsPhotoModalOpen(false)}
              className={`absolute top-4 right-4 transition-colors p-1.5 rounded-full ${dm ? 'text-slate-400 hover:text-white bg-white/8 hover:bg-white/15' : 'text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200'}`}
            >
              <X size={20} />
            </button>
            <h3 className={`text-lg font-semibold mb-6 text-center ${dm ? 'text-white' : 'text-slate-900'}`}>Profile Photo</h3>

            <div className="flex justify-center mb-8">
              <div className={`w-48 h-48 rounded-full overflow-hidden border-4 shadow-xl relative ${dm ? 'border-blue-400/30 bg-white/5' : 'border-blue-100 bg-slate-100'}`}>
                {profilePhoto ? (
                  <img src={profilePhoto} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-white font-bold text-5xl ${dm ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}>
                    {(userName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full justify-center"
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

export const DashboardTopNav = ({ userName, profilePhoto, onToggleSidebar, darkMode, onToggleDark }) => (
  <div className={`h-18 flex items-center justify-between px-6 lg:px-8 border-b sticky top-0 z-[90] transition-all duration-300 ${darkMode ? 'dark-topnav' : 'border-slate-200/80 bg-white/86 backdrop-blur-xl shadow-[0_10px_35px_rgba(59,130,246,0.12)]'}`}>
    <div className="flex items-center gap-4">
      <button
        onClick={onToggleSidebar}
        className={`p-2.5 rounded-xl transition-colors border border-transparent ${darkMode ? 'text-slate-300 hover:bg-white/10 hover:border-white/10 hover:text-white' : 'hover:bg-indigo-50 text-slate-400 hover:text-slate-800 hover:border-indigo-100'}`}
        title="Toggle sidebar"
      >
        <Menu size={20} />
      </button>
      <div className="relative w-80">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`} size={16} />
        <input
          type="text"
          placeholder="Search candidates, jobs..."
          className={`w-full rounded-2xl py-2.5 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:outline-none transition-all ${darkMode ? 'dark-search-input' : 'bg-white border border-slate-200/80 text-slate-800 focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-300 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)]'}`}
        />
      </div>
    </div>

    <div className="flex items-center gap-4">
      {/* Dark Mode Toggle */}
      {onToggleDark && (
        <button
          onClick={onToggleDark}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`p-2.5 rounded-xl transition-all duration-300 border ${darkMode
            ? 'bg-blue-500/15 border-blue-400/25 text-blue-300 hover:bg-blue-500/25 hover:border-blue-400/40 shadow-[0_0_12px_rgba(59,130,246,0.18)] hover:-translate-y-1'
            : 'border-slate-200 text-slate-500 hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600'
          }`}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      )}

      <button className={`relative p-2.5 transition-colors duration-300 rounded-xl border border-transparent ${darkMode ? 'text-slate-300 hover:text-blue-300 hover:bg-white/8 hover:border-white/10 hover:-translate-y-1' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100'}`}>
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
      </button>
      <div className={`flex items-center gap-3 pl-4 border-l ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
        <span className={`text-sm font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{userName}</span>
        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-blue-100">
          {profilePhoto ? (
            <img src={profilePhoto} alt={userName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
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
    blue: {
      featured: true,
      card: 'bg-[linear-gradient(135deg,_#4f46e5_0%,_#3b82f6_100%)] border-indigo-300/60 shadow-[0_22px_46px_rgba(79,70,229,0.28)]',
      iconWrap: 'bg-white/12 border border-white/15',
      icon: 'text-white',
      value: 'text-white',
      label: 'text-blue-100',
      hoverCard: 'hover:-translate-y-2 hover:bg-[linear-gradient(135deg,_#4338ca_0%,_#2563eb_100%)] hover:border-indigo-400/70 hover:shadow-[0_28px_54px_rgba(79,70,229,0.34)]',
      hoverIconWrap: 'group-hover:bg-white/14 group-hover:border-white/20',
      hoverIcon: '',
      hoverValue: '',
      hoverLabel: '',
    },
    purple: {
      featured: false,
      card: 'bg-white border-slate-200 shadow-[0_14px_30px_rgba(15,23,42,0.06)]',
      iconWrap: 'bg-indigo-50 border border-indigo-100',
      icon: 'text-indigo-600',
      value: 'text-slate-800',
      label: 'text-slate-500',
      hoverCard: 'hover:-translate-y-2 hover:bg-[linear-gradient(135deg,_#4f46e5_0%,_#3b82f6_100%)] hover:border-indigo-300/60 hover:shadow-[0_24px_50px_rgba(79,70,229,0.26)]',
      hoverIconWrap: 'group-hover:bg-white/12 group-hover:border-white/15',
      hoverIcon: 'group-hover:text-white',
      hoverValue: 'group-hover:text-white',
      hoverLabel: 'group-hover:text-blue-100',
    },
    emerald: {
      featured: false,
      card: 'bg-white border-slate-200 shadow-[0_14px_30px_rgba(15,23,42,0.06)]',
      iconWrap: 'bg-emerald-50 border border-emerald-100',
      icon: 'text-emerald-600',
      value: 'text-slate-800',
      label: 'text-slate-500',
      hoverCard: 'hover:-translate-y-2 hover:bg-[linear-gradient(135deg,_#4f46e5_0%,_#3b82f6_100%)] hover:border-indigo-300/60 hover:shadow-[0_24px_50px_rgba(79,70,229,0.26)]',
      hoverIconWrap: 'group-hover:bg-white/12 group-hover:border-white/15',
      hoverIcon: 'group-hover:text-white',
      hoverValue: 'group-hover:text-white',
      hoverLabel: 'group-hover:text-blue-100',
    },
    amber: {
      featured: false,
      card: 'bg-white border-slate-200 shadow-[0_14px_30px_rgba(15,23,42,0.06)]',
      iconWrap: 'bg-amber-50 border border-amber-100',
      icon: 'text-amber-600',
      value: 'text-slate-800',
      label: 'text-slate-500',
      hoverCard: 'hover:-translate-y-2 hover:bg-[linear-gradient(135deg,_#4f46e5_0%,_#3b82f6_100%)] hover:border-indigo-300/60 hover:shadow-[0_24px_50px_rgba(79,70,229,0.26)]',
      hoverIconWrap: 'group-hover:bg-white/12 group-hover:border-white/15',
      hoverIcon: 'group-hover:text-white',
      hoverValue: 'group-hover:text-white',
      hoverLabel: 'group-hover:text-blue-100',
    },
  };
  const c = configs[color] || configs.blue;

  return (
    <Card padding="normal" hover={true} className={`group h-full flex flex-col justify-between min-h-[152px] transition-all duration-300 ${c.card} ${c.hoverCard}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl ${c.iconWrap} ${c.hoverIconWrap} flex items-center justify-center transition-all duration-300`}>
          <Icon size={22} className={`${c.icon} ${c.hoverIcon}`} />
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-sm">
            +{Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <h3 className={`${c.value} ${c.hoverValue} text-3xl font-black tracking-tight mb-2 transition-colors duration-300`}>{value}</h3>
        <p className={`${c.label} ${c.hoverLabel} text-xs font-semibold uppercase tracking-[0.2em] transition-colors duration-300`}>{label}</p>
      </div>
    </Card>
  );
};
