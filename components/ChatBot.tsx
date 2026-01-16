
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Language } from '../types';
import { UI_STRINGS } from '../constants';
import { chatWithAssistant } from '../services/geminiService';

interface Props {
  language: Language;
}

export const ChatBot: React.FC<Props> = ({ language }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = UI_STRINGS[language];
  const isRtl = language === 'ar';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithAssistant(input, language, messages);
      const modelMsg: ChatMessage = { 
        role: 'model', 
        text: response.text, 
        sources: response.sources 
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Signal degradation. Re-establishing secure tactical link..." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Tactical Status Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <i className="fa-solid fa-microchip text-cyan-400"></i>
            <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping"></div>
          </div>
          <h3 className="text-sm font-bold tracking-tight">
            {t.chatTitle}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-tighter">SECURE_LINK_CH_4</span>
          <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 uppercase font-black">TACTICAL_V2</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 font-sans scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
            <div className="w-16 h-16 rounded-full border border-slate-700 flex items-center justify-center mb-4">
              <i className="fa-solid fa-satellite-dish text-2xl"></i>
            </div>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-slate-500">{t.chatPlaceholder}</p>
            <p className="text-[10px] mt-2 text-slate-600 font-mono">READY FOR INPUT / WAITING FOR OPERATOR</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-cyan-600 text-white rounded-te-none shadow-lg shadow-cyan-900/10' 
                : 'bg-slate-800 text-slate-200 rounded-ts-none border border-slate-700'
            }`}>
              {msg.text}
            </div>
            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 max-w-[85%]">
                <span className="text-[9px] text-slate-600 uppercase font-black w-full mb-1 tracking-widest">{t.sources}:</span>
                {msg.sources.map((src, idx) => (
                  <a key={idx} href={src.uri} target="_blank" rel="noopener noreferrer" 
                     className="text-[9px] bg-slate-950 px-2 py-1 rounded border border-slate-800 text-cyan-400 hover:border-cyan-500 hover:text-cyan-300 transition-all flex items-center gap-1.5 font-mono">
                    <i className="fa-solid fa-arrow-up-right-from-square text-[8px]"></i> {src.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono animate-pulse">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce"></div>
            </div>
            ANALYZING_GEOSPATIAL_DATA...
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t.chatPlaceholder}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-cyan-500/50 transition-all pe-12 placeholder:text-slate-600 font-sans"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 transition-all shadow-md shadow-cyan-900/10"
          >
            <i className="fa-solid fa-bolt-lightning text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
