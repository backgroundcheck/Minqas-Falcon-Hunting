
import React from 'react';
import { TrackingPoint, PredictionPoint } from '../types';

interface Props {
  path: TrackingPoint[];
  predictedPath?: PredictionPoint[];
}

export const MigrationMap: React.FC<Props> = ({ path, predictedPath }) => {
  /**
   * Pakistan Boundaries for Visualization:
   * Lat: 23.0 to 37.0 (Y-axis: 14 degrees)
   * Lng: 60.0 to 78.0 (X-axis: 18 degrees)
   */
  const getX = (lng: number) => ((lng - 60) / 18) * 100;
  const getY = (lat: number) => (1 - (lat - 23) / 14) * 100;

  const points = path.map(p => `${getX(p.lng)},${getY(p.lat)}`).join(' ');
  
  const predictedPoints = predictedPath && predictedPath.length > 0
    ? [path[path.length - 1], ...predictedPath].map(p => `${getX(p.lng)},${getY(p.lat)}`).join(' ')
    : null;

  return (
    <div className="relative w-full aspect-video bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden group shadow-2xl">
      {/* 1. GEOGRAPHIC BACKGROUND LAYER */}
      <div 
        className="absolute inset-0 opacity-40 mix-blend-luminosity grayscale contrast-125"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1200')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 70%'
        }}
      />
      
      {/* 2. TACTICAL GRID LAYER */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', 
             backgroundSize: '5% 7.14%' 
           }} 
      />
      
      {/* 3. PROVINCE OUTLINES (STYLIZED GEOGRAPHY) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Stylized Coastline & Boundary approximation for Sindh & Balochistan */}
        <path d="M 40 100 Q 45 90 55 85 T 75 80 T 90 70" fill="none" stroke="#0ea5e9" strokeWidth="0.5" />
        <path d="M 0 80 Q 10 70 20 60 T 30 40 T 40 20" fill="none" stroke="#0ea5e9" strokeWidth="0.5" />
        <path d="M 50 100 Q 55 70 65 50 T 75 20" fill="none" stroke="#0ea5e9" strokeWidth="0.2" strokeDasharray="2,2" />
      </svg>

      {/* 4. TRACKING DATA LAYER */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Historical Path Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="0.6"
          strokeDasharray="1.5,1.5"
          className="drop-shadow-[0_0_2px_rgba(56,189,248,0.5)]"
        />
        
        {/* Predicted Path Line */}
        {predictedPoints && (
          <polyline
            points={predictedPoints}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="2,2"
            className="animate-pulse drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]"
          />
        )}
        
        {/* Historical Points */}
        {path.map((p, i) => (
          <g key={`hist-${i}`}>
            <circle 
              cx={getX(p.lng)} 
              cy={getY(p.lat)} 
              r={i === path.length - 1 ? 1.5 : 0.4} 
              fill={i === path.length - 1 ? "#f43f5e" : "#38bdf8"}
              className={i === path.length - 1 ? "animate-pulse" : "opacity-60"}
            />
            {i === path.length - 1 && (
              <circle 
                cx={getX(p.lng)} 
                cy={getY(p.lat)} 
                r="3" 
                fill="none" 
                stroke="#f43f5e" 
                strokeWidth="0.2" 
                className="animate-ping"
              />
            )}
          </g>
        ))}

        {/* Predicted Points */}
        {predictedPath?.map((p, i) => (
          <circle 
            key={`pred-${i}`} 
            cx={getX(p.lng)} 
            cy={getY(p.lat)} 
            r="0.8" 
            fill="#f59e0b"
            className="drop-shadow-[0_0_2px_rgba(245,158,11,0.8)]"
          />
        ))}
      </svg>
      
      {/* 5. TACTICAL OVERLAY ELEMENTS */}
      <div className="absolute top-4 left-4 text-[10px] text-slate-400 font-mono flex flex-col gap-0.5 bg-slate-950/40 p-2 rounded backdrop-blur-sm border border-slate-800">
        <span className="text-cyan-400 font-bold tracking-widest uppercase text-[9px]">Miqnas Tactical Feed</span>
        <div className="flex gap-2 text-slate-500">
          <span>REGION: SINDH / BALOCHISTAN</span>
          <span className="text-slate-600">|</span>
          <span>SCAN: ACTIVE</span>
        </div>
      </div>

      <div className="absolute bottom-16 left-4 flex items-center gap-2 text-[9px] text-slate-500 font-mono bg-slate-950/20 px-1 rounded">
        <div className="flex flex-col border-l border-b border-slate-700 w-8 h-4"></div>
        <span>500 KM REF</span>
      </div>

      <div className="absolute bottom-4 right-4 bg-slate-950/90 backdrop-blur-md border border-cyan-500/30 p-3 rounded-lg flex gap-6 shadow-xl">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase text-cyan-500 font-bold tracking-tighter">Lat Axis</span>
          <span className="font-mono text-sm text-slate-100">{path[path.length-1].lat.toFixed(4)}°N</span>
        </div>
        <div className="w-px bg-slate-800 self-stretch"></div>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase text-cyan-500 font-bold tracking-tighter">Lng Axis</span>
          <span className="font-mono text-sm text-slate-100">{path[path.length-1].lng.toFixed(4)}°E</span>
        </div>
      </div>

      {predictedPath && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-amber-500/20 border border-amber-500/50 px-3 py-1.5 rounded-full text-[10px] text-amber-500 uppercase font-black tracking-widest backdrop-blur-md animate-in zoom-in duration-300">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          AI Prediction Active
        </div>
      )}

      {/* Scanning Line Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10 overflow-hidden">
        <div className="w-full h-1 bg-cyan-400/50 absolute top-0 animate-[scan_8s_linear_infinite]"></div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};
