import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string | number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  color?: 'primary' | 'accent' | 'success' | 'danger' | 'info';
  subtext?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  color = 'primary',
  subtext,
}) => {
  const { lang } = useApp();
  const isRtl = lang === 'ar';

  const colorMap = {
    primary: {
      bg: 'bg-[#014976]/10 dark:bg-[#014976]/20',
      icon: 'text-[#014976] dark:text-blue-400',
      border: 'border-[#014976]/20 dark:border-blue-500/20',
      glow: 'from-[#014976]/5 dark:from-blue-500/5',
    },
    accent: {
      bg: 'bg-[#FBAE42]/10 dark:bg-[#FBAE42]/25',
      icon: 'text-[#FBAE42]',
      border: 'border-[#FBAE42]/20 dark:border-[#FBAE42]/30',
      glow: 'from-[#FBAE42]/5 dark:from-[#FBAE42]/5',
    },
    success: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      icon: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/20 dark:border-emerald-500/30',
      glow: 'from-emerald-500/5',
    },
    danger: {
      bg: 'bg-red-500/10 dark:bg-red-500/20',
      icon: 'text-red-600 dark:text-red-400',
      border: 'border-red-500/20 dark:border-red-500/30',
      glow: 'from-red-500/5',
    },
    info: {
      bg: 'bg-sky-500/10 dark:bg-sky-500/20',
      icon: 'text-sky-600 dark:text-sky-400',
      border: 'border-sky-500/20 dark:border-sky-500/30',
      glow: 'from-sky-500/5',
    },
  };

  const scheme = colorMap[color] || colorMap.primary;

  return (
    <div className="glass-card p-5 flex flex-col justify-between min-h-[140px] relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:border-slate-300 dark:hover:border-slate-700/80">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{value}</h3>
        </div>
        <div className={`p-2.5 rounded-xl border ${scheme.bg} ${scheme.border} ${scheme.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3">
        {change !== undefined && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              changeType === 'increase'
                ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20'
                : changeType === 'decrease'
                  ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/20'
                  : 'text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800'
            }`}
          >
            {changeType === 'increase' ? '+' : ''}
            {change}
          </span>
        )}
        {subtext && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
            {subtext}
          </span>
        )}
      </div>
      
      {/* Decorative gradient corner glow */}
      <div className={`absolute -bottom-12 ${isRtl ? '-left-12' : '-right-12'} w-24 h-24 bg-gradient-to-tr ${scheme.glow} to-transparent rounded-full filter blur-xl pointer-events-none`} />
    </div>
  );
};

export default StatCard;
