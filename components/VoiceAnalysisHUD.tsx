
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Language } from '../types';
import { UI_STRINGS } from '../constants';
import { encodeBase64 } from '../services/geminiService';

interface Props {
  language: Language;
  onCommandRecognized: (command: string) => void;
  isProcessing: boolean;
}

export const VoiceAnalysisHUD: React.FC<Props> = ({ language, onCommandRecognized, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'LISTENING' | 'SYNCING' | 'SUCCESS'>('IDLE');
  const t = UI_STRINGS[language];
  
  const sessionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopRecording = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    
    setIsRecording(false);
    if (transcription.trim()) {
      onCommandRecognized(transcription.trim());
      setStatus('SUCCESS');
      setTimeout(() => setStatus('IDLE'), 2000);
    } else {
      setStatus('IDLE');
    }
    setTranscription('');
  };

  const startRecording = async () => {
    try {
      setStatus('LISTENING');
      setIsRecording(true);
      setTranscription('');

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          systemInstruction: `You are the Miqnas Voice Decoder. Transcribe the operator's bird tracking instructions exactly. 
          The operator might say things like "Analyze this bird", "What is the risk level?", or describe bird behavior. 
          Provide only the transcription text. Do not reply with audio.`
        },
        callbacks: {
          onopen: () => {
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
          onmessage: (msg: any) => {
            if (msg.serverContent?.inputTranscription) {
              setTranscription(prev => prev + ' ' + msg.serverContent.inputTranscription.text);
            }
          },
          onerror: (e) => {
            console.error("Voice Sync Error", e);
            stopRecording();
          },
          onclose: () => setIsRecording(false)
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to start tactical audio link", err);
      setIsRecording(false);
      setStatus('IDLE');
    }
  };

  return (
    <div className="relative group">
      <div className={`absolute -inset-1 bg-gradient-to-r from-rose-500 to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 ${isRecording ? 'opacity-75 animate-pulse' : ''}`}></div>
      <div className="relative flex items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <button 
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 relative overflow-hidden ${
            isRecording 
              ? 'bg-rose-500 text-white scale-110 shadow-[0_0_20px_rgba(244,63,94,0.4)]' 
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-cyan-400'
          }`}
        >
          {isRecording && (
            <div className="absolute inset-0 border-2 border-white/20 rounded-full animate-ping"></div>
          )}
          <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone-lines'} text-xl`}></i>
        </button>

        <div className="flex-1 min-w-[120px]">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${
              status === 'LISTENING' ? 'text-rose-500' : 
              status === 'SUCCESS' ? 'text-emerald-500' : 'text-slate-500'
            }`}>
              {status === 'LISTENING' ? 'Capture Active' : 
               status === 'SUCCESS' ? 'Command Parsed' : 'Voice Cmd Interface'}
            </span>
            {isRecording && <div className="w-1 h-1 bg-rose-500 rounded-full animate-pulse"></div>}
          </div>
          
          <div className="h-6 overflow-hidden">
            {isRecording ? (
              <p className="text-xs font-mono text-slate-300 italic truncate animate-in fade-in slide-in-from-left-2">
                {transcription || "Listening for tactical input..."}
              </p>
            ) : isProcessing ? (
              <p className="text-xs font-mono text-cyan-400 animate-pulse uppercase tracking-tighter">
                Running Neural Analysis...
              </p>
            ) : (
              <p className="text-xs text-slate-600 font-medium">
                Tap to issue behavioral command
              </p>
            )}
          </div>
        </div>

        {isRecording && (
          <div className="flex gap-0.5 items-end h-4 pb-1">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="w-0.5 bg-rose-500 rounded-full animate-bounce" 
                style={{ 
                  height: `${Math.random() * 100}%`,
                  animationDuration: `${0.5 + Math.random()}s`,
                  animationDelay: `${i * 0.1}s`
                }}
              ></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
