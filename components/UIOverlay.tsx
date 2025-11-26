
import React from 'react';
import { Battery, Zap, Shield, AlertTriangle, Database, Activity } from 'lucide-react';
import { DialogueLine } from '../types.ts';

interface UIOverlayProps {
  integrity: number;
  energy: number;
  progress: number;
  timeLeft: number;
  currentLevelName: string;
  currentLevelSub: string;
  score: number;
  activeDialogue: DialogueLine | null;
  activeLog: string | null;
  isShielded: boolean;
}

const UIOverlay: React.FC<UIOverlayProps> = ({
  integrity, energy, progress, timeLeft, currentLevelName, currentLevelSub,
  score, activeDialogue, activeLog, isShielded
}) => {
  
  const formatTime = (s: number) => {
      const m = Math.floor(s/60); const sc = Math.floor(s%60);
      return `${m < 10 ? '0'+m : m}:${sc < 10 ? '0'+sc : sc}`;
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-6 z-20 font-mono text-cyan-400 select-none">
      
      {/* Top HUD */}
      <div className="flex justify-between items-start w-full border-b border-cyan-500/30 pb-2 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
         
         {/* Left: Vital Systems */}
         <div className="flex flex-col gap-2 w-64">
            {/* Hull Integrity */}
            <div className="flex items-center gap-2">
                <Activity size={16} className={integrity < 30 ? "text-red-500 animate-pulse" : "text-emerald-400"} />
                <div className="w-full h-2 bg-slate-900 rounded-sm overflow-hidden border border-slate-700 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                    <div className={`h-full transition-all duration-300 ${integrity < 30 ? "bg-red-500 shadow-[0_0_10px_#ef4444]" : "bg-emerald-500 shadow-[0_0_10px_#10b981]"}`} style={{width: `${integrity}%`}} />
                </div>
                <span className="text-xs tracking-wider">HULL</span>
            </div>

            {/* Energy */}
            <div className="flex items-center gap-2">
                <Zap size={16} className={energy < 20 ? "text-yellow-500" : "text-cyan-400"} />
                <div className="w-full h-2 bg-slate-900 rounded-sm overflow-hidden border border-slate-700 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                    <div className="h-full bg-cyan-400 transition-all duration-100 shadow-[0_0_10px_#22d3ee]" style={{width: `${energy}%`}} />
                </div>
                <span className="text-xs tracking-wider">PWR</span>
            </div>
         </div>

         {/* Center: Timer & Status */}
         <div className="flex flex-col items-center">
             <div className="text-3xl font-bold tracking-widest text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
                 {formatTime(timeLeft)}
             </div>
             {isShielded && <div className="text-xs text-fuchsia-400 border border-fuchsia-500 px-2 rounded animate-pulse shadow-[0_0_10px_#d946ef]">SHIELD ACTIVE</div>}
         </div>

         {/* Right: Score */}
         <div className="text-right">
             <div className="text-xs text-cyan-600 tracking-widest">ARCHIVE_DATA</div>
             <div className="text-xl text-yellow-400 font-bold drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">{score.toFixed(0)}</div>
         </div>
      </div>

      {/* Central Notifications */}
      {activeLog && (
          <div className="absolute top-24 right-10 animate-slide-in-right">
              <div className="bg-black/80 border-l-4 border-yellow-500 p-4 max-w-sm shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur">
                  <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold mb-1 tracking-widest">
                      <Database size={12}/> DECRYPTED LOG
                  </div>
                  <p className="text-sm text-yellow-100 italic">"{activeLog}"</p>
              </div>
          </div>
      )}

      {/* Bottom Dialogue (Terminal Style) */}
      {activeDialogue && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl">
              <div className="bg-black/90 border border-cyan-500/50 p-6 rounded-sm shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                  <div className="text-xs text-cyan-500 font-bold mb-2 tracking-[0.2em] uppercase flex items-center gap-2">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_5px_#22d3ee]"/>
                      {activeDialogue.speaker} CHANNEL
                  </div>
                  <p className="text-lg text-cyan-50 font-mono leading-relaxed typing-effect">
                      {activeDialogue.text}
                  </p>
              </div>
          </div>
      )}

      {/* Bottom Status Bar */}
      <div className="flex justify-between items-end text-xs text-slate-400 uppercase tracking-widest">
          <div>
              <div className="text-white font-bold text-sm drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{currentLevelName}</div>
              <div className="text-cyan-500">{currentLevelSub}</div>
          </div>
          
          <div className="flex flex-col items-end gap-1 w-1/3">
              <span className="text-cyan-700">Mission Progress</span>
              <div className="w-full h-1 bg-slate-900 border border-slate-700">
                  <div className="h-full bg-white transition-all duration-500 shadow-[0_0_10px_#fff]" style={{width: `${Math.min(100, progress)}%`}} />
              </div>
          </div>
      </div>

    </div>
  );
};

export default UIOverlay;
