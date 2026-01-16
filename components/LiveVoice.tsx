
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Language } from '../types';
import { UI_STRINGS } from '../constants';
import { encodeBase64, decodeBase64, decodeAudioData } from '../services/geminiService';

interface Props {
  language: Language;
}

export const LiveVoice: React.FC<Props> = ({ language }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const t = UI_STRINGS[language];
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);

  const startLive = async () => {
    setIsConnecting(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const systemInstruction = `You are the Miqnas Tactical Voice Interface. 
      Your tone is calm, professional, and efficient. You are part of a high-altitude bird tracking system.
      Provide concise, technical information about bird tracking, migratory paths, and regional biometrics.
      Acknowledge the tradition of Miqnas (falconry) with respect, but keep your primary focus on technical assistance and ecological data.
      Respond in ${language === 'ar' ? 'Arabic' : 'English'}.
      Operator is currently monitoring Siberian-Indus flyway activity.`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            const source = audioCtx.createMediaStreamSource(stream);
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const input = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(input.length);
              for (let i = 0; i < input.length; i++) int16[i] = input[i] * 32768;
              sessionPromise.then(s => s.sendRealtimeInput({
                media: { data: encodeBase64(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' }
              }));
            };
            source.connect(processor);
            processor.connect(audioCtx.destination);
          },
          onmessage: async (msg) => {
            const base64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64) {
              const buf = await decodeAudioData(decodeBase64(base64), audioCtx, 24000, 1);
              const source = audioCtx.createBufferSource();
              source.buffer = buf;
              source.connect(audioCtx.destination);
              const startTime = Math.max(nextStartTimeRef.current, audioCtx.currentTime);
              source.start(startTime);
              nextStartTimeRef.current = startTime + buf.duration;
            }
          },
          onclose: () => stopLive(),
          onerror: (e) => console.error("Live Error", e)
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (e) {
      console.error(e);
      setIsConnecting(false);
    }
  };

  const stopLive = () => {
    sessionRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    setIsActive(false);
    setIsConnecting(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-xl">
      <div className="flex items-center gap-3 self-start mb-2">
        <i className="fa-solid fa-microphone-lines text-rose-500"></i>
        <h3 className="text-sm font-bold uppercase tracking-wider">{t.voiceTitle}</h3>
      </div>
      
      <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
        isActive ? 'border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.3)]' : 'border-slate-800'
      }`}>
        {isActive ? (
          <div className="flex gap-1 items-center">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="w-1 bg-rose-500 rounded-full animate-bounce" style={{ height: `${Math.random()*40+10}px`, animationDelay: `${i*0.1}s` }}></div>
            ))}
          </div>
        ) : (
          <i className={`fa-solid fa-microphone text-3xl ${isConnecting ? 'text-slate-500 animate-pulse' : 'text-slate-700'}`}></i>
        )}
      </div>

      <p className="text-xs text-slate-500 text-center max-w-[200px]">
        {isActive ? "Tactical Link Established. Monitor audio feed for biometric updates." : "Initialize secure voice comms for real-time field intelligence."}
      </p>

      <button 
        onClick={isActive ? stopLive : startLive}
        disabled={isConnecting}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
          isActive 
            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500/20 shadow-inner' 
            : 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20 hover:bg-cyan-500 active:scale-95'
        }`}
      >
        {isConnecting ? (
          <><i className="fa-solid fa-spinner fa-spin"></i> SYNCING_ENCRYPTION...</>
        ) : isActive ? (
          <><i className="fa-solid fa-phone-slash text-xs"></i> TERMINATE_LINK</>
        ) : (
          <><i className="fa-solid fa-headset text-xs"></i> {t.voiceStart}</>
        )}
      </button>
    </div>
  );
};
