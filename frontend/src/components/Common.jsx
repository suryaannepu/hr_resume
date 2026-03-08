import React from 'react';

/* ────────────── Button ────────────── */
export const Button = ({ children, variant = 'primary', size = 'md', onClick, disabled = false, type = 'button', className = '', ...props }) => {
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
    <button className={`${variants[variant] || variants.primary} ${sizes[size] || ''} ${className}`}
      onClick={onClick} disabled={disabled} type={type} {...props}>
      {children}
    </button>
  );
};

/* ────────────── Card ────────────── */
export const Card = ({ children, className = '', hover = true, ...props }) => (
  <div className={`${hover ? 'glass-card' : 'glass-card-static'} ${className}`} {...props}>
    {children}
  </div>
);

/* ────────────── Badge ────────────── */
export const Badge = ({ children, variant = 'default', className = '' }) => {
  const map = {
    primary: 'badge-primary', success: 'badge-success', warning: 'badge-warning',
    danger: 'badge-danger', default: 'badge-default',
    excellent: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    good: 'bg-brand-500/20 text-brand-300 border border-brand-500/30',
    fair: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    poor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  };
  return <span className={`badge ${map[variant] || map.default} ${className}`}>{children}</span>;
};

/* ────────────── ScoreRing ────────────── */
export const ScoreRing = ({ score, size = 80, strokeWidth = 6, label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#3b8bff' : score >= 40 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white">{score ?? '—'}</span>
        </div>
      </div>
      {label && <span className="text-xs text-slate-400">{label}</span>}
    </div>
  );
};

/* ────────────── ScoreBar ────────────── */
export const ScoreBar = ({ score, max = 100, label }) => {
  const pct = Math.min((score / max) * 100, 100);
  const color = pct >= 70 ? 'from-emerald-500 to-emerald-400' : pct >= 50 ? 'from-brand-500 to-brand-400' : pct >= 30 ? 'from-amber-500 to-amber-400' : 'from-rose-500 to-rose-400';
  return (
    <div className="w-full">
      {label && <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">{label}</span><span className="text-white font-semibold">{score}%</span></div>}
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

/* ────────────── Loading ────────────── */
export const Loading = ({ text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
    <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    <p className="text-slate-400 animate-pulse">{text}</p>
  </div>
);

/* ────────────── Alert ────────────── */
export const Alert = ({ type = 'info', message, onClose }) => {
  const styles = {
    info: 'bg-brand-500/10 border-brand-500/30 text-brand-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    danger: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
  };
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${styles[type] || styles.info} animate-slide-up mb-4`}>
      <span className="text-sm">{message}</span>
      {onClose && <button onClick={onClose} className="ml-3 text-lg opacity-60 hover:opacity-100 transition-opacity">×</button>}
    </div>
  );
};

/* ────────────── Modal ────────────── */
export const Modal = ({ isOpen, title, children, onClose, size = 'lg' }) => {
  if (!isOpen) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl', full: 'max-w-7xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className={`glass-card-static w-full ${widths[size]} max-h-[85vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all">×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

/* ────────────── Input ────────────── */
export const Input = ({ label, error, className = '', ...props }) => (
  <div className={`mb-4 ${className}`}>
    {label && <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>}
    <input className={`input-field ${error ? 'border-rose-500/50' : ''}`} {...props} />
    {error && <span className="text-xs text-rose-400 mt-1">{error}</span>}
  </div>
);

/* ────────────── Select ────────────── */
export const Select = ({ label, options, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>}
    <select className="input-field" {...props}>
      <option value="">Select an option</option>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

/* ────────────── AgentCard ────────────── */
export const AgentCard = ({ icon, title, status, children, accentColor = 'brand' }) => {
  const statusColors = { active: 'bg-emerald-500', processing: 'bg-amber-500 animate-pulse', pending: 'bg-slate-600', error: 'bg-rose-500' };
  const borderColors = { brand: 'border-brand-500/30', emerald: 'border-emerald-500/30', amber: 'border-amber-500/30', rose: 'border-rose-500/30', purple: 'border-purple-500/30' };
  return (
    <div className={`glass-card-static border-l-2 ${borderColors[accentColor] || borderColors.brand}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-white">{title}</h4>
        </div>
        {status && <div className={`w-2 h-2 rounded-full ${statusColors[status] || statusColors.pending}`} />}
      </div>
      {children}
    </div>
  );
};

/* ────────────── AgentPipelineVisualizer ────────────── */
const AGENTS = [
  { key: 'resume', icon: '📄', name: 'Resume Parser' },
  { key: 'jd', icon: '📋', name: 'JD Analyzer' },
  { key: 'skills', icon: '🎯', name: 'Skill Normalizer' },
  { key: 'scoring', icon: '📊', name: 'Scoring' },
  { key: 'insights', icon: '💡', name: 'Insights' },
  { key: 'risk', icon: '🛡️', name: 'Risk' },
  { key: 'interview', icon: '🎤', name: 'Interview' },
  { key: 'coach', icon: '🎓', name: 'Coach' },
  { key: 'committee', icon: '⚖️', name: 'Committee' },
];

export const AgentPipelineVisualizer = ({ status = 'pending', agentOutputs = {} }) => {
  const getAgentStatus = (key) => {
    if (status === 'processed') return 'done';
    if (status === 'failed') return 'error';
    if (agentOutputs && agentOutputs[key]) return 'done';
    if (status === 'processing') return 'processing';
    return 'pending';
  };

  const statusDot = (s) => {
    if (s === 'done') return 'bg-emerald-500 shadow-lg shadow-emerald-500/50';
    if (s === 'processing') return 'bg-amber-500 animate-pulse shadow-lg shadow-amber-500/50';
    if (s === 'error') return 'bg-rose-500 shadow-lg shadow-rose-500/50';
    return 'bg-slate-600';
  };

  return (
    <div className="glass-card-static p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🤖</span>
        <h4 className="text-sm font-semibold text-white">AI Agent Pipeline</h4>
        <Badge variant={status === 'processed' ? 'success' : status === 'processing' ? 'warning' : status === 'failed' ? 'danger' : 'default'}>
          {status === 'processed' ? 'Complete' : status === 'processing' ? 'Running' : status === 'failed' ? 'Failed' : 'Pending'}
        </Badge>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {AGENTS.map((agent, i) => {
          const s = getAgentStatus(agent.key);
          return (
            <React.Fragment key={agent.key}>
              <div className="flex flex-col items-center min-w-[64px] group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-1 transition-all duration-300
                  ${s === 'done' ? 'bg-emerald-500/20 scale-110' : s === 'processing' ? 'bg-amber-500/20 animate-pulse' : 'bg-white/5'}
                  group-hover:scale-110`}>
                  {agent.icon}
                </div>
                <div className={`w-2 h-2 rounded-full mb-1 ${statusDot(s)}`} />
                <span className="text-[10px] text-slate-500 text-center leading-tight">{agent.name}</span>
              </div>
              {i < AGENTS.length - 1 && (
                <div className={`w-4 h-0.5 mt-[-16px] rounded ${s === 'done' ? 'bg-emerald-500' : 'bg-white/10'}`} />
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
  if (matched) return <span className="badge bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">✓ {skill}</span>;
  if (missing) return <span className="badge bg-rose-500/15 text-rose-300 border border-rose-500/20">✗ {skill}</span>;
  return <span className="badge bg-white/10 text-slate-300 border border-white/10">{skill}</span>;
};

/* ────────────── Tabs ────────────── */
export const Tabs = ({ tabs, activeTab, onChange }) => (
  <div className="flex gap-1 p-1 bg-white/5 rounded-xl overflow-x-auto">
    {tabs.map(tab => (
      <button key={tab.key} onClick={() => onChange(tab.key)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200
          ${activeTab === tab.key ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
        {tab.icon && <span>{tab.icon}</span>}
        {tab.label}
      </button>
    ))}
  </div>
);
