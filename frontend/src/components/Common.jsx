import React from 'react';
import { Sparkles, TrendingUp, Shield, Lightbulb, GraduationCap, Mic2, Scale, FileText, Target, Users, BarChart3 } from 'lucide-react';

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
export const Card = ({ children, className = '', hover = true, padding = 'normal', ...props }) => {
  const paddingClasses = { normal: 'p-6', compact: 'p-4', large: 'p-8' };
  return (
    <div className={`${hover ? 'glass-card' : 'glass-card-static'} ${paddingClasses[padding] || paddingClasses.normal} ${className}`} {...props}>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
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
  { key: 'skills', icon: Target, name: 'Skill Normalizer' },
  { key: 'scoring', icon: BarChart3, name: 'Scoring' },
  { key: 'insights', icon: Lightbulb, name: 'Insights' },
  { key: 'risk', icon: Shield, name: 'Risk' },
  { key: 'interview', icon: Mic2, name: 'Interview' },
  { key: 'coach', icon: GraduationCap, name: 'Coach' },
  { key: 'committee', icon: Scale, name: 'Committee' },
];

export const AgentPipelineVisualizer = ({ status = 'pending', agentOutputs = {} }) => {
  const getAgentStatus = (key) => {
    if (status === 'processed') return 'done';
    if (status === 'failed') return 'error';
    if (agentOutputs && agentOutputs[key]) return 'done';
    if (status === 'processing') return 'processing';
    return 'pending';
  };

  const statusStyles = (s) => {
    if (s === 'done') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s === 'processing') return 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse';
    if (s === 'error') return 'bg-rose-100 text-rose-700 border-rose-200';
    return 'bg-slate-100 text-slate-500 border-slate-200';
  };

  const statusDot = (s) => {
    if (s === 'done') return 'bg-emerald-500';
    if (s === 'processing') return 'bg-amber-500 animate-pulse';
    if (s === 'error') return 'bg-rose-500';
    return 'bg-slate-300';
  };

  return (
    <div className="glass-card-static">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Sparkles size={20} className="text-blue-600" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800">AI Agent Pipeline</h4>
        <Badge variant={status === 'processed' ? 'success' : status === 'processing' ? 'warning' : status === 'failed' ? 'danger' : 'default'}>
          {status === 'processed' ? 'Complete' : status === 'processing' ? 'Running' : status === 'failed' ? 'Failed' : 'Pending'}
        </Badge>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {AGENTS.map((agent, i) => {
          const s = getAgentStatus(agent.key);
          return (
            <React.Fragment key={agent.key}>
              <div className="flex flex-col items-center min-w-[70px] group">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-1 transition-all duration-300 border ${statusStyles(s)}`}>
                  <agent.icon size={18} />
                </div>
                <div className={`w-2 h-2 rounded-full mb-1 ${statusDot(s)}`} />
                <span className="text-[10px] text-slate-500 text-center leading-tight font-medium">{agent.name}</span>
              </div>
              {i < AGENTS.length - 1 && (
                <div className={`w-3 h-0.5 mb-5 rounded-full ${s === 'done' ? 'bg-emerald-300' : 'bg-slate-200'}`} />
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

/* ────────────── Timeline ────────────── */
export const Timeline = ({ items }) => (
  <div className="space-y-0">
    {items.map((item, i) => (
      <div key={i} className="flex gap-4">
        <div className="flex flex-col items-center">
          <div className={`w-3 h-3 rounded-full ${item.completed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          {i < items.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
        </div>
        <div className="flex-1 pb-4">
          <p className={`text-sm font-medium ${item.completed ? 'text-slate-800' : 'text-slate-500'}`}>{item.title}</p>
          {item.description && <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>}
        </div>
      </div>
    ))}
  </div>
);
