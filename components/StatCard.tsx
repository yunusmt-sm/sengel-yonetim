import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtext?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtext, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  };

  return (
    <div className={`rounded-xl border p-6 shadow-sm ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium opacity-80 uppercase tracking-wider">{title}</h3>
        {icon && <div className="p-2 bg-white rounded-full bg-opacity-50">{icon}</div>}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      {subtext && <p className="text-xs opacity-75">{subtext}</p>}
    </div>
  );
};

export default StatCard;