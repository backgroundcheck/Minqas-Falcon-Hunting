
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PAKISTAN_SPECIES, MOCK_TRACKING_DATA, UI_STRINGS } from './constants';
import { BirdSpecies, AnalysisResult, Language, PredictionPoint } from './types';
import { TelemetryChart } from './components/AltitudeChart';
import { MigrationMap } from './components/MigrationMap';
import { ChatBot } from './components/ChatBot';
import { LiveVoice } from './components/LiveVoice';
import { RiskVisualization } from './components/RiskVisualization';
import { VoiceAnalysisHUD } from './components/VoiceAnalysisHUD';
import { analyzeBirdMigration, predictFuturePath } from './services/geminiService';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [selectedSpecies, setSelectedSpecies] = useState<BirdSpecies>(PAKISTAN_SPECIES[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [showPrediction, setShowPrediction] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [predictedPath, setPredictedPath] = useState<PredictionPoint[] | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const t = UI_STRINGS[language];
  const isRtl = language === 'ar';

  const trackingData = useMemo(() => MOCK_TRACKING_DATA(selectedSpecies.id), [selectedSpecies.id]);
  const latestData = trackingData[trackingData.length - 1];
  const prevData = trackingData[trackingData.length - 2];

  const telemetryStatus = useMemo(() => {
    const getAltStatus = (alt: number, max: number) => {
      const ratio = alt / max;
      if (ratio > 0.9) return { color: 'text-rose-500', bg: 'bg-rose-500', icon: 'fa-triangle-exclamation' };
      if (ratio > 0.75) return { color: 'text-amber-500', bg: 'bg-amber-500', icon: 'fa-circle-exclamation' };
      return { color: 'text-emerald-500', bg: 'bg-emerald-500', icon: 'fa-circle-check' };
    };

    const getHrStatus = (hr: number) => {
      if (hr > 250 || hr < 110) return { color: 'text-rose-500', bg: 'bg-rose-500', icon: 'fa-heart-crack' };
      if (hr > 220 || hr < 130) return { color: 'text-amber-500', bg: 'bg-amber-500', icon: 'fa-heart-pulse' };
      return { color: 'text-emerald-500', bg: 'bg-emerald-500', icon: 'fa-heart' };
    };

    const getTempStatus = (temp: number) => {
      if (temp > 38 || temp < 18) return { color: 'text-rose-500', bg: 'bg-rose-500', icon: 'fa-temperature-arrow-up' };
      if (temp > 34 || temp < 22) return { color: 'text-amber-500', bg: 'bg-amber-500', icon: 'fa-temperature-half' };
      return { color: 'text-emerald-500', bg: 'bg-emerald-500', icon: 'fa-temperature-low' };
    };

    return {
      altitude: getAltStatus(latestData.altitude, selectedSpecies.maxAltitude),
      heartRate: getHrStatus(latestData.heartRate),
      temperature: getTempStatus(latestData.temperature)
    };
  }, [latestData, selectedSpecies]);

  const telemetryFeed = useMemo(() => {
    if (!prevData || !latestData) return { diveIntensity: 0, climbRate: 0 };
    const altDelta = latestData.altitude - prevData.altitude;
    const isDescending = altDelta < 0;
    const dive = isDescending ? Math.min(100, (Math.abs(altDelta) / 500) * 100) : 5 + Math.random() * 5;
    return { diveIntensity: Math.max(0, dive), climbRate: altDelta };
  }, [latestData, prevData]);

  const handleRunAnalysis = async (userPrompt?: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeBirdMigration(selectedSpecies.name[language], latestData, language, userPrompt);
      setAnalysis(result);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePredictPath = async () => {
    setIsPredicting(true);
    try {
      const result = await predictFuturePath(selectedSpecies.name[language], trackingData, language);
      setPredictedPath(result);
      setShowPrediction(true);
    } catch (error) {
      console.error("Prediction failed", error);
    } finally {
      setIsPredicting(false);
    }
  };

  useEffect(() => {
    setAnalysis(null);
    setPredictedPath(undefined);
  }, [selectedSpecies, language]);

  return (
    <div 
      className={`flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden ${isRtl ? 'font-[Tajawal,sans-serif]' : ''}`}
      dir={isRtl ? 'rtl' : 'ltr'}
      lang={language}
    >
      {/* Sidebar */}
      <aside className={`transition-all duration-300 border-e border-slate-800 bg-slate-900/50 flex flex-col ${isSidebarOpen ? 'w-80' : 'w-0 overflow-hidden border-none'}`}>
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-cyan-500 flex items-center justify-center">
            <i className="fa-solid fa-wind text-slate-950"></i>
          </div>
          <h1 className="font-bold text-lg tracking-tight">{t.title}</h1>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <p className="text-xs uppercase text-slate-500 font-bold px-2">{t.db}</p>
          {PAKISTAN_SPECIES.map(species => (
            <button
              key={species.id}
              onClick={() => setSelectedSpecies(species)}
              className={`w-full text-start p-4 rounded-xl transition-all border ${
                selectedSpecies.id === species.id 
                  ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                  : 'bg-transparent border-transparent hover:bg-slate-800'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-sm font-bold ${selectedSpecies.id === species.id ? 'text-cyan-400' : 'text-slate-200'}`}>
                  {species.name[language]}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {species.status[language]}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono truncate">{species.scientificName}</p>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">{t.telemetry}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Toolbar */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
              <i className={`fa-solid ${isSidebarOpen ? (isRtl ? 'fa-outdent' : 'fa-indent') : (isRtl ? 'fa-indent' : 'fa-outdent')}`}></i>
            </button>
            <div className="h-4 w-px bg-slate-800"></div>
            <h2 className="text-sm font-medium">{t.tracking}: <span className="text-cyan-400">{selectedSpecies.name[language]}</span></h2>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Prediction Path Toggle */}
            <div className="flex items-center gap-3 mr-4 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-1.5 transition-all hover:bg-slate-900">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t.togglePrediction}
              </span>
              <button 
                onClick={() => setShowPrediction(!showPrediction)}
                className={`relative w-10 h-5 rounded-full transition-all duration-300 shadow-inner ${showPrediction ? 'bg-amber-500/40' : 'bg-slate-700'}`}
                title={t.togglePrediction}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 shadow-md ${
                  showPrediction 
                    ? (isRtl ? 'right-5.5 bg-amber-500 shadow-amber-500/50' : 'left-5.5 bg-amber-500 shadow-amber-500/50') 
                    : (isRtl ? 'right-0.5 bg-slate-400' : 'left-0.5 bg-slate-400')
                }`}></div>
              </button>
            </div>

            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800 mr-2">
              <button onClick={() => setLanguage('en')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${language === 'en' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>EN</button>
              <button onClick={() => setLanguage('ar')} className={`px-3 py-1 rounded text-xs font-bold transition-all ${language === 'ar' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}>AR</button>
            </div>

            <button onClick={handlePredictPath} disabled={isPredicting} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-500 px-4 py-2 rounded-lg text-sm font-semibold transition-all border border-amber-500/20">
              {isPredicting ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-location-crosshairs"></i>}
              {t.predict}
            </button>

            <button 
              onClick={() => handleRunAnalysis()} 
              disabled={isAnalyzing} 
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-cyan-900/20"
            >
              {isAnalyzing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
              {t.analyze}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              {/* Voice Analysis HUD Integration */}
              <div className="mb-2">
                <VoiceAnalysisHUD 
                  language={language} 
                  onCommandRecognized={(cmd) => handleRunAnalysis(cmd)} 
                  isProcessing={isAnalyzing}
                />
              </div>

              {/* Real-Time Telemetry Dashboard */}
              <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6 backdrop-blur-sm relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] pointer-events-none"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/80">{t.liveTelemetry}</h3>
                  </div>
                  <span className="text-[9px] font-mono text-slate-600 tracking-tighter">STRM_SYNC: {new Date().toLocaleTimeString()}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative border-l-2 border-cyan-500/30 pl-4 py-1 hover:border-cyan-500 transition-colors group/metric">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t.maxAlt} (Current)</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${telemetryStatus.altitude.bg} shadow-[0_0_5px_currentColor] ${telemetryStatus.altitude.color}`}></div>
                      <i className={`fa-solid ${telemetryStatus.altitude.icon} text-[8px] ${telemetryStatus.altitude.color}`}></i>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black font-mono text-slate-100 tracking-tighter">{Math.round(latestData.altitude).toLocaleString()}</span>
                      <span className="text-xs font-bold text-cyan-500/70">m</span>
                    </div>
                  </div>
                  <div className="relative border-l-2 border-rose-500/30 pl-4 py-1 hover:border-rose-500 transition-colors group/metric">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t.heartRate}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${telemetryStatus.heartRate.bg} shadow-[0_0_5px_currentColor] ${telemetryStatus.heartRate.color}`}></div>
                      <i className={`fa-solid ${telemetryStatus.heartRate.icon} text-[8px] ${telemetryStatus.heartRate.color}`}></i>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black font-mono text-slate-100 tracking-tighter">{Math.round(latestData.heartRate)}</span>
                      <span className="text-xs font-bold text-rose-500/70">bpm</span>
                    </div>
                  </div>
                  <div className="relative border-l-2 border-amber-500/30 pl-4 py-1 hover:border-amber-500 transition-colors group/metric">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t.temp}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${telemetryStatus.temperature.bg} shadow-[0_0_5px_currentColor] ${telemetryStatus.temperature.color}`}></div>
                      <i className={`fa-solid ${telemetryStatus.temperature.icon} text-[8px] ${telemetryStatus.temperature.color}`}></i>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black font-mono text-slate-100 tracking-tighter">{latestData.temperature.toFixed(1)}</span>
                      <span className="text-xs font-bold text-amber-500/70">°C</span>
                    </div>
                  </div>
                </div>
              </div>

              <MigrationMap path={trackingData} predictedPath={showPrediction ? predictedPath : undefined} />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TelemetryChart data={trackingData} type="altitude" color="#06b6d4" />
                <TelemetryChart data={trackingData} type="heartRate" color="#f43f5e" />
                <TelemetryChart data={trackingData} type="temperature" color="#818cf8" />
              </div>
            </div>
            
            <div className="space-y-6">
              <LiveVoice language={language} />
              <ChatBot language={language} />
            </div>
          </div>

          {(analysis || isAnalyzing) && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-8 bg-slate-900/80 border border-slate-700/50 rounded-2xl backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] -z-10 group-hover:bg-cyan-500/10 transition-all"></div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg"><i className="fa-solid fa-brain"></i></div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent uppercase tracking-wider">{t.brain}</h3>
                </div>

                {isAnalyzing ? (
                  <div className="grid md:grid-cols-3 gap-8">
                    <div className="space-y-4 py-8"><div className="h-4 bg-slate-800 rounded w-3/4 animate-pulse"></div><div className="h-4 bg-slate-800 rounded w-1/2 animate-pulse"></div></div>
                    <div className="space-y-4 py-8"><div className="h-4 bg-slate-800 rounded w-full animate-pulse"></div><div className="h-32 bg-slate-800 rounded animate-pulse"></div></div>
                    <div className="space-y-4 py-8"><div className="h-4 bg-slate-800 rounded w-2/3 animate-pulse"></div></div>
                  </div>
                ) : analysis && (
                  <div className="grid md:grid-cols-3 gap-12">
                    <div className="space-y-8">
                      <div>
                        <h4 className="text-[10px] uppercase text-cyan-400 font-black mb-3 tracking-[0.2em]">{t.behavior}</h4>
                        <p className="text-slate-300 leading-relaxed text-sm">{analysis.behaviorSummary}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] uppercase text-rose-400 font-black mb-3 tracking-[0.2em]">{t.envRisk}</h4>
                        <p className="text-slate-300 leading-relaxed text-sm">{analysis.climateImpact}</p>
                      </div>
                    </div>

                    <div>
                      <RiskVisualization 
                        analysis={analysis} 
                        currentAltitude={latestData.altitude}
                        maxAltitude={selectedSpecies.maxAltitude}
                        diveIntensity={telemetryFeed.diveIntensity}
                        climbRate={telemetryFeed.climbRate}
                        language={language}
                      />
                    </div>

                    <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800">
                      <h4 className="text-[10px] uppercase text-slate-400 font-black mb-6 tracking-[0.2em]">{t.recs}</h4>
                      <ul className="space-y-5">
                        {analysis.recommendations.map((rec, i) => (
                          <li key={i} className="flex gap-4 text-sm text-slate-300 group/item">
                            <span className="text-cyan-500 mt-1 transition-transform group-hover/item:scale-125">
                              <i className="fa-solid fa-shield-halved"></i>
                            </span>
                            <span className="leading-snug">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="grid md:grid-cols-2 gap-6 pb-12">
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-6">
              <img src={selectedSpecies.image} alt={selectedSpecies.name[language]} className="w-full md:w-48 h-48 object-cover rounded-xl shadow-lg grayscale hover:grayscale-0 transition-all duration-500" />
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2 tracking-tight">{selectedSpecies.name[language]}</h3>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">{selectedSpecies.description[language]}</p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-slate-950 text-cyan-500 text-[10px] font-black rounded border border-cyan-500/20 tracking-widest uppercase">{t.origin}</span>
                  <span className="px-3 py-1 bg-slate-950 text-rose-500 text-[10px] font-black rounded border border-rose-500/20 tracking-widest uppercase">{t.extreme}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">{t.stats}</h3>
              <div className="space-y-4 text-sm font-mono">
                <div className="flex justify-between items-center"><span className="text-slate-400">Telemetry Blocks</span><span className="text-cyan-400">1,440 DATA_BLKS</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400">Satellite Hop</span><span className="text-cyan-400">3.2ms Latency</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-400">System Status</span><span className="text-emerald-500 font-bold">NOMINAL</span></div>
                <div className="w-full h-px bg-slate-800 my-4"></div>
                <div className="flex justify-between items-center text-[10px] text-slate-600 italic"><span>LINK: STABLE</span><span>UTC: {new Date().toISOString()}</span></div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default App;
