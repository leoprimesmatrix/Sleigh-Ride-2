
import React from 'react';
import { Activity, Zap, Database, Ghost } from 'lucide-react';
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
  isPhasing: boolean;
  combo: number;
}

const UIOverlay: React.FC<UIOverlayProps> = ({
  integrity, energy, progress, timeLeft, currentLevelName, currentLevelSub,
  score, activeDialogue, activeLog, isPhasing, combo
}) => {
  
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-6 z-20 font-mono text-blue-200 select-none pointer-events-none">
      
      {/* Top HUD */}
      <div className="flex justify-between items-start w-full border-b border-blue-900/30 pb-2 bg-gradient-to-b from-[#0f172a] to-transparent backdrop-blur-sm">
         
         {/* Left: Vital Systems */}
         <div className="flex flex-col gap-2 w-64">
            {/* Hull Integrity */}
            <div className="flex items-center gap-2">
                <Activity size={16} className={integrity < 30 ? "text-red-500 animate-pulse" : "text-emerald-400"} />
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                    <div className={`h-full transition-all duration-300 ${integrity < 30 ? "bg-red-500 shadow-[0_0_10px_#ef4444]" : "bg-emerald-500 shadow-[0_0_10px_#10b981]"}`} style={{width: `${integrity}%`}} />
                </div>
                <span className="text-[10px] tracking-wider text-slate-400">SLEIGH</span>
            </div>

            {/* Spirit Energy */}
            <div className="flex items-center gap-2">
                <Ghost size={16} className={energy < 20 ? "text-blue-300 animate-pulse" : "text-blue-400"} />
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                    <div className="h-full bg-blue-400 transition-all duration-100 shadow-[0_0_10px_#60a5fa]" style={{width: `${energy}%`}} />
                </div>
                <span className="text-[10px] tracking-wider text-blue-300">SPIRIT</span>
            </div>
         </div>

         {/* Center: Combo Meter & Status */}
         <div className="flex flex-col items-center">
             <div className="flex flex-col items-center">
                 {combo > 1 && (
                     <div className="animate-bounce">
                         <span className="text-4xl font-black font-serif italic text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">
                             {combo}x
                         </span>
                         <span className="text-xs text-yellow-200 block text-center tracking-[0.3em]">MAGIC SYNC</span>
                     </div>
                 )}
                 {combo <= 1 && (
                     <div className="text-2xl font-bold tracking-widest text-slate-700 font-serif">
                         SEEK
                     </div>
                 )}
             </div>
             
             <div className="flex gap-2 mt-2 h-6">
               {isPhasing && <div className="text-[10px] text-blue-100 border border-blue-400 px-3 py-0.5 rounded-full animate-pulse shadow-[0_0_15px_#60a5fa] bg-blue-900/50 uppercase tracking-widest">Spirit Form</div>}
             </div>
         </div>

         {/* Right: Score */}
         <div className="text-right">
             <div className="text-[10px] text-slate-400 tracking-widest">MEMORIES RECOVERED</div>
             <div className="text-xl text-yellow-100 font-serif font-bold drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{score.toFixed(0)}</div>
         </div>
      </div>

      {/* Central Notifications */}
      {activeLog && (
          <div className="absolute top-24 right-10 animate-slide-in-right">
              <div className="bg-slate-900/80 border-l-2 border-yellow-600 p-4 max-w-sm shadow-xl backdrop-blur">
                  <div className="flex items-center gap-2 text-yellow-500 text-xs font-bold mb-1 tracking-widest">
                      <Database size={12}/> MEMORY FRAGMENT
                  </div>
                  <p className="text-sm text-yellow-100 italic font-serif">"{activeLog}"</p>
              </div>
          </div>
      )}

      {/* Bottom Dialogue */}
      {activeDialogue && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl">
              <div className="bg-slate-950/90 border-t border-b border-blue-500/30 p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                  <div className="text-xs text-blue-400 font-bold mb-2 tracking-[0.2em] uppercase flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_5px_#60a5fa]"/>
                      {activeDialogue.speaker}
                  </div>
                  <p className="text-lg text-slate-200 font-serif leading-relaxed typing-effect">
                      {activeDialogue.text}
                  </p>
              </div>
          </div>
      )}

      {/* Bottom Status Bar */}
      <div className="flex justify-between items-end text-xs text-slate-500 uppercase tracking-widest">
          <div>
              <div className="text-white font-bold text-sm drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] font-serif">{currentLevelName}</div>
              <div className="text-slate-400">{currentLevelSub}</div>
          </div>
          
          <div className="flex flex-col items-end gap-1 w-1/3">
              <span className="text-blue-400">Proximity to Zero Point</span>
              <div className="w-full h-1 bg-slate-900 border border-slate-800">
                  <div className="h-full bg-white transition-all duration-500 shadow-[0_0_10px_#fff]" style={{width: `${Math.min(100, progress)}%`}} />
              </div>
          </div>
      </div>

    </div>
  );
};

export default UIOverlay;