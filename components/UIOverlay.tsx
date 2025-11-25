import React, { useEffect, useState } from 'react';
import { Battery, Zap, Shield, Radio, Activity, Code, AlertTriangle, Plus, Cpu, Disc } from 'lucide-react';
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
          case PowerupType.SPEED: return { icon: Zap, label: "TURBO", color: POWERUP_COLORS[type] };
          case PowerupType.SNOWBALLS: return { icon: Disc, label: "AMMO", color: POWERUP_COLORS[type] };
          case PowerupType.BLAST: return { icon: Activity, label: "BLAST", color: POWERUP_COLORS[type] };
          case PowerupType.HEALING: return { icon: Plus, label: "REPAIR", color: POWERUP_COLORS[type] };
          case PowerupType.LIFE: return { icon: Battery, label: "1-UP", color: POWERUP_COLORS[type] };
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
    <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none z-20 font-mono tracking-wider">
      
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
                    <div className="p-4 rounded-full border-4 mb-2 backdrop-blur-md shadow-lg" style={{ color: color, borderColor: color, backgroundColor: 'rgba(0,0,0,0.7)', boxShadow: `0 0 30px ${color}` }}>
                        <Icon size={48} strokeWidth={3} />
                    </div>
                    <span className="font-black text-2xl uppercase tracking-[0.2em] font-christmas text-white" style={{ textShadow: `0 0 10px ${color}` }}>{label}</span>
                </div>
            );
        })}
      </div>

      {/* Narrative Wish Popup */}
      {activeWish && (
          <div className="absolute top-32 right-8 flex flex-col items-end animate-slide-in-right z-30">
             <div className="bg-slate-900/90 backdrop-blur-xl border-r-4 border-cyan-400 pl-6 pr-4 py-4 max-w-sm text-right shadow-[0_0_30px_rgba(34,211,238,0.2)] rounded-l-lg">
                 <div className="flex items-center justify-end gap-2 text-cyan-400 mb-1">
                     <span className="text-[10px] uppercase font-bold tracking-widest">DATA FRAGMENT</span>
                     <Code size={16} />
                 </div>
                 <p className="font-christmas text-white text-xl text-yellow-300">"{activeWish}"</p>
             </div>
          </div>
      )}

      {/* Dialogue Box */}
      {activeDialogue && (
          <div className="absolute bottom-12 left-0 right-0 flex justify-center animate-slide-up z-20">
             <div className="bg-black/90 backdrop-blur-lg border border-slate-700 px-8 py-6 rounded-2xl max-w-3xl text-center shadow-2xl relative">
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg ${
                    activeDialogue.speaker === 'KOMET' ? 'bg-yellow-500 text-black' : 
                    activeDialogue.speaker === 'VIXEN' ? 'bg-purple-600 text-white' : 'bg-red-600 text-white'
                }`}>
                    {activeDialogue.speaker}
                </div>
                <p className="text-xl md:text-2xl font-bold text-white drop-shadow-md font-christmas tracking-wide">
                    "{activeDialogue.text}"
                </p>
             </div>
          </div>
      )}

      {/* Top HUD */}
      <div className="flex items-start justify-between w-full z-10">
        
        {/* Left: Vitals */}
        <div className="flex flex-col gap-3">
          {/* Integrity */}
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm p-2 rounded-lg border border-white/10">
             <Shield size={20} className="text-cyan-400" />
             <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                    <div key={i} className={`h-3 w-8 rounded-sm skew-x-[-12deg] transition-all border border-cyan-900 ${i <= lives ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-slate-800'}`} />
                ))}
             </div>
          </div>

          {/* Ammo */}
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm p-2 rounded-lg border border-white/10">
            <Disc size={20} className="text-pink-400" />
            <div className="text-pink-400 font-bold text-lg font-christmas">{snowballs} <span className="text-xs font-mono text-pink-400/70">PLASMA</span></div>
          </div>
        </div>

        {/* Center: Timer & Location */}
        <div className="flex flex-col items-center">
          <div className={`
            text-4xl font-black px-8 py-2 rounded-xl border-2 backdrop-blur-md shadow-2xl font-mono
            ${isLowTime ? 'border-red-500 text-red-100 bg-red-900/60 animate-pulse' : 'border-cyan-500/50 text-white bg-slate-900/60'}
          `}>
            {formatTime(timeLeft)}
          </div>
          <div className="mt-2 text-sm uppercase tracking-[0.2em] text-cyan-200 font-bold font-christmas text-shadow-glow">
            {currentLevelName}
          </div>
        </div>

        {/* Right: Score */}
        <div className="text-right bg-black/40 backdrop-blur-sm p-3 rounded-lg border border-white/10">
             <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Score</div>
             <div className="text-3xl font-black text-yellow-400 tabular-nums shadow-cyan-glow font-christmas">
                {Math.floor(score).toLocaleString()}
             </div>
        </div>
      </div>

      {/* Bottom Progress Line */}
      <div className="w-full max-w-4xl mx-auto mb-4 animate-slide-up z-10 relative">
         <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-widest mb-1 px-1">
             <span>Insertion</span>
             <span>Extraction</span>
         </div>
         <div className="h-2 bg-slate-800 w-full overflow-hidden rounded-full border border-slate-700">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-white shadow-[0_0_20px_#22d3ee]"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
         </div>
      </div>
    </div>
  );
};

export default UIOverlay;