
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  colorClass?: string;
  description?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, colorClass = "text-slate-900", description }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-2">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      {icon && <div className="opacity-20">{icon}</div>}
    </div>
    <h3 className={`text-2xl font-black ${colorClass}`}>{value}</h3>
    {description && <p className="text-[10px] text-slate-500 mt-2 italic">{description}</p>}
  </div>
);
