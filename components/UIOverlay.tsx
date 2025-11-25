
import React, { useEffect, useState } from 'react';
import { Battery, Zap, Shield, Radio, Activity, Code, AlertTriangle, Plus, Cpu } from 'lucide-react';
import { Player, PowerupType, DialogueLine } from '../types.ts';
import { POWERUP_COLORS } from '../constants.ts';

interface UIOverlayProps {
  lives: number;
  snowballs: number;
  progress: number;
  timeLeft: number;
  activePowerups: Player['speedTimer'] | Player['healingTimer'];
  currentLevelName: string;
  score: number;
  collectedPowerups: { id: number; type: PowerupType }[];
  activeDialogue: DialogueLine | null;
  activeWish: string | null;
}

const UIOverlay: React.FC<UIOverlayProps> = ({
  lives,
  snowballs,
  progress,
  timeLeft,
  currentLevelName,
  score,
  collectedPowerups,
  activeDialogue,
  activeWish
}) => {
  
  const [popups, setPopups] = useState<{id: number, type: PowerupType}[]>([]);

  useEffect(() => {
    if (collectedPowerups.length > 0) {
      setPopups(prev => [...prev, ...collectedPowerups]);
    }
  }, [collectedPowerups]);

  const handleAnimationEnd = (id: number) => {
    setPopups(prev => prev.filter(p => p.id !== id));
  };

  const getPowerupConfig = (type: PowerupType) => {
      switch (type) {
          case PowerupType.SPEED: return { icon: Zap, label: "OVERCLOCK", color: POWERUP_COLORS[type] };
          case PowerupType.SNOWBALLS: return { icon: Cpu, label: "AMMO", color: POWERUP_COLORS[type] };
          case PowerupType.BLAST: return { icon: Activity, label: "EMP BLAST", color: POWERUP_COLORS[type] };
          case PowerupType.HEALING: return { icon: Plus, label: "REPAIR", color: POWERUP_COLORS[type] };
          case PowerupType.LIFE: return { icon: Battery, label: "BACKUP BATTERY", color: POWERUP_COLORS[type] };
          default: return { icon: Zap, label: "UPGRADE", color: "#fff" };
      }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isLowTime = timeLeft < 30;
  
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none z-20 font-mono">
      
      {/* Scan Lines Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none z-0 mix-blend-overlay"></div>

      {/* Popups */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden z-20">
        {popups.map(p => {
            const { icon: Icon, label, color } = getPowerupConfig(p.type);
            return (
                <div 
                    key={p.id} 
                    className="absolute animate-powerup-pop flex flex-col items-center justify-center"
                    onAnimationEnd={() => handleAnimationEnd(p.id)}
                >
                    <div className="p-4 rounded-lg bg-black/80 border border-white/50 mb-2 shadow-[0_0_15px_currentColor]" style={{ color: color, borderColor: color }}>
                        <Icon size={48} strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-2xl uppercase tracking-widest bg-black/50 px-2" style={{ color: color }}>{label}</span>
                </div>
            );
        })}
      </div>

      {/* Log Notification */}
      {activeWish && (
          <div className="absolute top-28 right-4 flex flex-col items-end animate-slide-in-right z-30">
             <div className="bg-slate-900/90 text-green-400 pl-4 pr-6 py-3 border-r-4 border-green-500 max-w-sm text-right flex items-center gap-3 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                 <div className="animate-pulse">
                    <Code size={20} />
                 </div>
                 <div className="flex flex-col">
                     <span className="text-[10px] uppercase tracking-widest text-green-600 font-bold">Encrypted Data Found</span>
                     <p className="font-mono text-sm leading-tight">"{activeWish}"</p>
                 </div>
             </div>
          </div>
      )}

      {/* Dialogue Box */}
      {activeDialogue && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/80 border-t-2 border-slate-700 pb-8 pt-6 flex justify-center animate-slide-up z-20">
             <div className="flex flex-col items-center text-center max-w-4xl px-4">
                <h4 className={`font-bold uppercase text-xs tracking-[0.3em] mb-2 flex items-center gap-2 ${
                    activeDialogue.speaker === 'Santa' ? 'text-red-500' : 
                    activeDialogue.speaker === 'Rudolph' ? 'text-cyan-400' : 'text-red-700'
                }`}>
                    {activeDialogue.speaker === 'KRAMPUS_AI' && <AlertTriangle size={12} />}
                    {activeDialogue.speaker}
                    {activeDialogue.speaker === 'KRAMPUS_AI' && <AlertTriangle size={12} />}
                </h4>
                <p className={`text-xl md:text-2xl font-bold tracking-wide leading-snug ${
                     activeDialogue.speaker === 'KRAMPUS_AI' ? 'text-red-600 font-mono uppercase' : 'text-white font-sans'
                }`}>
                    "{activeDialogue.text}"
                </p>
             </div>
          </div>
      )}

      {/* Top HUD */}
      <div className="flex items-start justify-between w-full z-10 relative">
        
        {/* Left: Status */}
        <div className="flex flex-col gap-2 animate-slide-in-left">
          {/* Health Bar */}
          <div className="flex items-center gap-1">
             <span className="text-[10px] text-slate-500 uppercase font-bold w-12">Shields</span>
             <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                    <div key={i} className={`h-3 w-8 skew-x-[-12deg] border border-slate-600 ${i <= lives ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]' : 'bg-slate-900'}`} />
                ))}
             </div>
          </div>

          {/* Ammo Bar */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold w-12">Plasma</span>
            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded border border-slate-700">
                <Zap size={14} className="text-yellow-400" />
                <span className="text-yellow-400 font-bold font-mono">{snowballs}</span>
            </div>
          </div>
        </div>

        {/* Center: Mission Clock */}
        <div className="flex flex-col items-center animate-fade-in-down">
          <div className={`
            flex items-center gap-3 text-2xl font-black px-6 py-1 rounded-sm border
            ${isLowTime ? 'bg-red-900/80 border-red-500 text-red-100 animate-pulse' : 'bg-slate-900/80 border-cyan-500/50 text-cyan-100'}
          `}>
            <span className="text-[10px] uppercase tracking-widest opacity-50">T-Minus</span>
            <span className="tabular-nums font-mono">{formatTime(timeLeft)}</span>
          </div>
          
          <div className="mt-1 text-center">
            <h2 className="text-white font-bold text-sm tracking-[0.2em] uppercase text-shadow-blue">
                {currentLevelName}
            </h2>
          </div>
        </div>

        {/* Right: Score */}
        <div className="animate-slide-in-right">
             <div className="flex flex-col items-end">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Data Mined</div>
                <div className="text-2xl font-black text-green-400 font-mono tabular-nums shadow-green-glow">
                    {Math.floor(score).toLocaleString()}
                </div>
             </div>
        </div>
      </div>

      {/* Bottom Bar: Progress */}
      <div className="w-full max-w-4xl mx-auto mb-2 animate-slide-up z-10">
         <div className="flex justify-between text-[10px] font-bold mb-1 px-1 text-slate-500 uppercase tracking-widest">
            <span>Entry</span>
            <span>Core</span>
         </div>
         <div className="h-1 bg-slate-800 w-full relative">
            <div 
              className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all duration-200 ease-linear"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
         </div>
      </div>
    </div>
  );
};

export default UIOverlay;
