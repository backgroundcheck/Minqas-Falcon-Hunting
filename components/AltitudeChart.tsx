
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrackingPoint } from '../types';

interface Props {
  data: TrackingPoint[];
  type: 'altitude' | 'heartRate' | 'temperature';
  color: string;
}

export const TelemetryChart: React.FC<Props> = ({ data, type, color }) => {
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  const unit = type === 'altitude' ? 'm' : type === 'temperature' ? '°C' : 'bpm';

  return (
    <div className="h-48 w-full bg-slate-900/50 rounded-xl p-2 border border-slate-800">
      <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">{label} ({unit})</h4>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`color${type}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="timestamp" hide />
          <YAxis 
            hide 
            domain={['auto', 'auto']} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '12px' }}
            itemStyle={{ color: color }}
          />
          <Area 
            type="monotone" 
            dataKey={type} 
            stroke={color} 
            fillOpacity={1} 
            fill={`url(#color${type})`} 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
