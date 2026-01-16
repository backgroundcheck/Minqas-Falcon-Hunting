
import React from 'react';
import { AnalysisResult, Language } from '../types';
import { UI_STRINGS } from '../constants';

interface Props {
  analysis: AnalysisResult;
  currentAltitude: number;
  maxAltitude: number;
  diveIntensity: number; // 0-100 scale
  climbRate?: number; // meters per unit time
  language: Language;
}

export const RiskVisualization: React.FC<Props> = ({ 
  analysis, 
  currentAltitude, 
  maxAltitude, 
  diveIntensity, 
  climbRate = 0,
  language 
}) => {
  const score = analysis.environmentalRiskScore;
  const altPercentage = Math.min((currentAltitude / maxAltitude) * 100, 100);
  const t = UI_STRINGS[language];
  
  const getSeverity = (s: number) => {
    if (s > 70) return { 
      color: 'text-rose-500', 
      bgColor: 'bg-rose-500', 
      label: 'EXTREME', 
      icon: 'fa-triangle-exclamation',
      glow: 'shadow-[0_0_15_rgba(244,63,94,0.3)]'
    };
    if (s > 40) return { 
      color: 'text-amber-500', 
      bgColor: 'bg-amber-500', 
      label: 'ELEVATED', 
      icon: 'fa-circle-exclamation',
      glow: 'shadow-[0_0_15_rgba(245,158,11,0.2)]'
    };
    return { 
      color: 'text-emerald-500', 
      bgColor: 'bg-emerald-500', 
      label: 'NOMINAL', 
      icon: 'fa-shield-check',
      glow: 'shadow-[0_0_15_rgba(16,185,129,0.2)]'
    };
  };

  const sev = getSeverity(score);

  const getDiveColorClass = (val: number) => {
    if (val > 75) return 'text-rose-500';
    if (val > 35) return 'text-amber-500';
    return 'text-blue-500';
  };

  const getDiveStrokeClass = (val: number) => {
    if (val > 75) return 'stroke-rose-500 drop-shadow-[0_0_5px_rgba(244,63,94,0.6)]';
    if (val > 35) return 'stroke-amber-500 drop-shadow-[0_0_3px_rgba(245,158,11,0.4)]';
    return 'stroke-blue-500 drop-shadow-[0_0_3px_rgba(59,130,246,0.4)]';
  };

  // SVG Arc Shared Constants
  const radius = 40;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const arcLength = 240; // 240-degree arc
  const arcOffset = (arcLength / 360) * circumference;

  const calculateDashOffset = (percentage: number) => {
    return arcOffset - (Math.min(100, Math.max(0, percentage)) / 100) * arcOffset;
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Tactical Telemetry Module */}
      <div className={`flex flex-col p-6 bg-slate-950/60 rounded-3xl border border-slate-800 relative overflow-hidden transition-all duration-500 ${sev.glow}`}>
        <div className="absolute top-0 right-0 p-3 text-[9px] text-slate-600 font-mono tracking-widest opacity-50">
          TRACKING_HUD_V14
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6">
          {/* Main Gauges Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* Risk Gauge (Circular) */}
            <div className="flex flex-col items-center justify-center bg-slate-900/40 p-3 rounded-2xl border border-slate-800/50">
              <div className="relative w-full aspect-square max-w-[80px]">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="#0f172a" strokeWidth="6" />
                  <circle
                    cx="50" cy="50" r="44"
                    fill="none" stroke="currentColor" strokeWidth="6"
                    strokeDasharray="276.46"
                    strokeDashoffset={276.46 - (276.46 * score) / 100}
                    strokeLinecap="round"
                    className={`${sev.color} transition-all duration-1000 ease-out`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-sm font-black font-mono tracking-tighter ${sev.color}`}>{score}%</span>
                </div>
              </div>
              <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest mt-2">Risk</span>
            </div>

            {/* Tactical Altimeter Gauge */}
            <div className="flex flex-col items-center justify-center bg-slate-900/40 p-3 rounded-2xl border border-slate-800/50">
               <div className="relative w-full aspect-square max-w-[80px]">
                  <svg className="w-full h-full transform rotate-[150deg]" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r={normalizedRadius}
                      fill="none" stroke="#0f172a" strokeWidth={strokeWidth}
                      strokeDasharray={`${arcOffset} ${circumference}`}
                      strokeLinecap="round"
                    />
                    <circle
                      cx="50" cy="50" r={normalizedRadius}
                      fill="none" stroke="#22d3ee" strokeWidth={strokeWidth}
                      strokeDasharray={`${arcOffset} ${circumference}`}
                      strokeDashoffset={calculateDashOffset(altPercentage)}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out drop-shadow-[0_0_3px_rgba(34,211,238,0.5)]"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                    <span className="text-sm font-black font-mono text-cyan-400 tracking-tighter">
                      {Math.round(currentAltitude / 100) / 10}k
                    </span>
                  </div>
               </div>
               <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest mt-2">Alt</span>
            </div>

            {/* NEW: Dive Intensity Radial Gauge */}
            <div className="flex flex-col items-center justify-center bg-slate-900/40 p-3 rounded-2xl border border-slate-800/50 relative overflow-hidden">
               <div className="relative w-full aspect-square max-w-[80px]">
                  <svg className="w-full h-full transform rotate-[150deg]" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r={normalizedRadius}
                      fill="none" stroke="#0f172a" strokeWidth={strokeWidth}
                      strokeDasharray={`${arcOffset} ${circumference}`}
                      strokeLinecap="round"
                    />
                    <circle
                      cx="50" cy="50" r={normalizedRadius}
                      fill="none" strokeWidth={strokeWidth}
                      strokeDasharray={`${arcOffset} ${circumference}`}
                      strokeDashoffset={calculateDashOffset(diveIntensity)}
                      strokeLinecap="round"
                      className={`transition-all duration-1000 ease-out ${getDiveStrokeClass(diveIntensity)}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                    <span className={`text-sm font-black font-mono tracking-tighter ${getDiveColorClass(diveIntensity)}`}>
                      {Math.round(diveIntensity)}%
                    </span>
                  </div>
               </div>
               <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest mt-2">Dive</span>
            </div>
          </div>
        </div>

        {/* Digital Readouts & Telemetry Status */}
        <div className="grid grid-cols-2 gap-3 mb-6">
           <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/50 flex flex-col justify-center">
              <span className="text-[7px] text-slate-500 uppercase font-black tracking-widest mb-1">Elevation</span>
              <div className="flex items-baseline gap-1">
                 <span className="text-sm font-black font-mono text-slate-100">{Math.round(currentAltitude).toLocaleString()}</span>
                 <span className="text-[8px] text-slate-500 font-bold uppercase">m</span>
              </div>
           </div>
           <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/50 flex flex-col justify-center">
              <span className="text-[7px] text-slate-500 uppercase font-black tracking-widest mb-1">V_Speed</span>
              <div className="flex items-baseline gap-1">
                 <span className={`text-sm font-black font-mono ${climbRate >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                    {climbRate >= 0 ? '▲' : '▼'} {Math.abs(Math.round(climbRate))}
                 </span>
                 <span className="text-[8px] text-slate-500 font-bold uppercase">m/Δ</span>
              </div>
           </div>
        </div>

        {/* Tactical AI Risk Summary */}
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/30"></div>
          <div className="flex items-center gap-2 mb-2">
            <i className={`fa-solid ${sev.icon} text-[9px] ${sev.color} animate-pulse`}></i>
            <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">Threat Assessment Output</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed italic font-medium">
            "{analysis.environmentalRisk}"
          </p>
        </div>
      </div>

      {/* Threat Vector Analysis Grid */}
      <div className="space-y-4">
        <h4 className="text-[10px] uppercase text-slate-500 font-black tracking-[0.2em] flex justify-between items-center px-1">
          Threat Vector Analysis
          <div className="flex gap-1.5 items-center">
             <div className="w-1 h-1 bg-cyan-500 rounded-full animate-ping"></div>
             <span className="text-[8px] font-mono text-cyan-500/50 uppercase">Active_Scan</span>
          </div>
        </h4>
        <div className="grid grid-cols-1 gap-3">
          {analysis.riskFactors.map((rf, idx) => {
            const rfSev = rf.severity > 7 ? { color: 'text-rose-500', bg: 'bg-rose-500' } : 
                          rf.severity > 4 ? { color: 'text-amber-500', bg: 'bg-amber-500' } : 
                          { color: 'text-emerald-500', bg: 'bg-emerald-500' };
            return (
              <div key={idx} className="group cursor-default">
                <div className="flex justify-between items-center text-[10px] font-mono mb-1.5">
                  <span className="text-slate-400 group-hover:text-slate-200 transition-colors uppercase tracking-tight">{rf.factor}</span>
                  <span className={`font-bold ${rfSev.color} bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800`}>
                    {rf.severity.toFixed(1)}
                  </span>
                </div>
                <div className="h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${rfSev.bg}`}
                    style={{ width: `${rf.severity * 10}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
