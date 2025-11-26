
import React from 'react';
import { Battery, Zap, Shield, AlertTriangle, Database, Activity, Eye } from 'lucide-react';
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
    <div className="absolute inset-0 flex flex-col justify-between p-6 z-20 font-mono text-cyan-400 select-none pointer-events-none">
      
      {/* Top HUD */}
      <div className="flex justify-between items-start w-full border-b border-cyan-500/30 pb-2 bg-gradient-to-b from-[#000510] to-transparent backdrop-blur-sm">
         
         {/* Left: Vital Systems */}
         <div className="flex flex-col gap-2 w-64">
            {/* Hull Integrity */}
            <div className="flex items-center gap-2">
                <Activity size={16} className={integrity < 30 ? "text-red-500 animate-pulse" : "text-emerald-400"} />
                <div className="w-full h-2 bg-black rounded-sm overflow-hidden border border-cyan-900 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                    <div className={`h-full transition-all duration-300 ${integrity < 30 ? "bg-red-500 shadow-[0_0_10px_#ef4444]" : "bg-emerald-500 shadow-[0_0_10px_#10b981]"}`} style={{width: `${integrity}%`}} />
                </div>
                <span className="text-xs tracking-wider">INTEGRITY</span>
            </div>

            {/* Phase Energy */}
            <div className="flex items-center gap-2">
                <Zap size={16} className={energy < 20 ? "text-yellow-500 animate-pulse" : "text-fuchsia-400"} />
                <div className="w-full h-2 bg-black rounded-sm overflow-hidden border border-cyan-900 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                    <div className="h-full bg-fuchsia-400 transition-all duration-100 shadow-[0_0_10px_#bc13fe]" style={{width: `${energy}%`}} />
                </div>
                <span className="text-xs tracking-wider text-fuchsia-400">PHASE_FLUX</span>
            </div>
         </div>

         {/* Center: Combo Meter & Status */}
         <div className="flex flex-col items-center">
             <div className="flex flex-col items-center">
                 {combo > 1 && (
                     <div className="animate-bounce">
                         <span className="text-4xl font-black italic text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">
                             {combo}x
                         </span>
                         <span className="text-xs text-yellow-200 block text-center tracking-[0.3em]">DATA SYNC</span>
                     </div>
                 )}
                 {combo <= 1 && (
                     <div className="text-3xl font-bold tracking-widest text-slate-700 drop-shadow-[0_0_10px_rgba(0,243,255,0.1)]">
                         SCAN
                     </div>
                 )}
             </div>
             
             <div className="flex gap-2 mt-2 h-6">
               {isPhasing && <div className="text-[10px] text-fuchsia-400 border border-fuchsia-500 px-2 rounded animate-pulse shadow-[0_0_10px_#d946ef] bg-fuchsia-900/50">GHOST_MODE_ACTIVE</div>}
             </div>
         </div>

         {/* Right: Score */}
         <div className="text-right">
             <div className="text-xs text-cyan-600 tracking-widest">DATA_RECOVERED</div>
             <div className="text-xl text-white font-bold drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{score.toFixed(0)}</div>
         </div>
      </div>

      {/* Central Notifications */}
      {activeLog && (
          <div className="absolute top-24 right-10 animate-slide-in-right">
              <div className="bg-black/80 border-l-4 border-yellow-500 p-4 max-w-sm shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur">
                  <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold mb-1 tracking-widest">
                      <Database size={12}/> DATA FRAGMENT
                  </div>
                  <p className="text-sm text-yellow-100 italic">"{activeLog}"</p>
              </div>
          </div>
      )}

      {/* Bottom Dialogue (Terminal Style) */}
      {activeDialogue && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl">
              <div className="bg-[#000510]/90 border border-cyan-500/50 p-6 rounded-sm shadow-[0_0_30px_rgba(0,243,255,0.15)]">
                  <div className="text-xs text-cyan-500 font-bold mb-2 tracking-[0.2em] uppercase flex items-center gap-2">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_5px_#00f3ff]"/>
                      {activeDialogue.speaker} CHANNEL
                  </div>
                  <p className="text-lg text-cyan-50 font-mono leading-relaxed typing-effect">
                      {activeDialogue.text}
                  </p>
              </div>
          </div>
      )}

      {/* Bottom Status Bar */}
      <div className="flex justify-between items-end text-xs text-cyan-700 uppercase tracking-widest">
          <div>
              <div className="text-white font-bold text-sm drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{currentLevelName}</div>
              <div className="text-cyan-500">{currentLevelSub}</div>
          </div>
          
          <div className="flex flex-col items-end gap-1 w-1/3">
              <span className="text-cyan-600">Proximity to Zero Point</span>
              <div className="w-full h-1 bg-black border border-cyan-900">
                  <div className="h-full bg-white transition-all duration-500 shadow-[0_0_10px_#fff]" style={{width: `${Math.min(100, progress)}%`}} />
              </div>
          </div>
      </div>

    </div>
  );
};

export default UIOverlay;
