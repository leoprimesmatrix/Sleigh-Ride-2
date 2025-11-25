import React, { useEffect, useState } from 'react';
import { Flame, Star, BookOpen, Clock, Activity, Zap, Plus, Heart } from 'lucide-react';
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
          case PowerupType.SPEED: return { icon: Zap, label: "WIND", color: POWERUP_COLORS[type] };
          case PowerupType.SNOWBALLS: return { icon: Star, label: "SPIRIT", color: POWERUP_COLORS[type] };
          case PowerupType.BLAST: return { icon: Activity, label: "ECHO", color: POWERUP_COLORS[type] };
          case PowerupType.HEALING: return { icon: Plus, label: "MEND", color: POWERUP_COLORS[type] };
          case PowerupType.LIFE: return { icon: Heart, label: "RESOLVE", color: POWERUP_COLORS[type] };
          default: return { icon: Zap, label: "BOOST", color: "#fff" };
      }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none z-20 font-mono tracking-wide text-slate-300">
      
      {/* Popups (Centered) */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden z-20">
        {popups.map(p => {
            const { icon: Icon, label, color } = getPowerupConfig(p.type);
            return (
                <div 
                    key={p.id} 
                    className="absolute animate-powerup-pop flex flex-col items-center justify-center"
                    onAnimationEnd={() => handleAnimationEnd(p.id)}
                >
                    <span className="font-bold text-3xl uppercase tracking-widest drop-shadow-md" style={{ color: color }}>{label}</span>
                </div>
            );
        })}
      </div>

      {/* Artifact Found */}
      {activeWish && (
          <div className="absolute top-28 right-8 flex flex-col items-end animate-slide-in-right z-30">
             <div className="bg-slate-900/90 border border-slate-600 p-4 shadow-xl max-w-sm">
                 <div className="text-[10px] font-bold text-yellow-500 uppercase mb-1 flex items-center gap-2">
                    <BookOpen size={12}/> ARCHIVE ENTRY
                 </div>
                 <p className="text-white text-sm italic serif">"{activeWish}"</p>
             </div>
          </div>
      )}

      {/* Dialogue Box */}
      {activeDialogue && (
          <div className="absolute bottom-20 left-0 right-0 flex justify-center animate-fade-in-up z-20">
             <div className="bg-black/80 border-t border-b border-slate-500 px-8 py-6 max-w-3xl text-center relative backdrop-blur-md">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">
                    {activeDialogue.speaker}
                </div>
                <p className="text-xl font-serif text-slate-200 italic">
                    "{activeDialogue.text}"
                </p>
             </div>
          </div>
      )}

      {/* Top HUD Bar */}
      <div className="flex items-start justify-between w-full z-10 border-b border-slate-800 pb-4 bg-gradient-to-b from-black/50 to-transparent">
        
        {/* Left: Resolve (Lives) */}
        <div className="flex gap-8">
          <div className="flex flex-col gap-1">
             <span className="text-[10px] uppercase text-slate-600 tracking-widest">Resolve</span>
             <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                    <Flame 
                        key={i} 
                        size={24} 
                        className={`${i <= lives ? 'fill-orange-500 text-orange-500' : 'text-slate-800'}`} 
                    />
                ))}
             </div>
          </div>

          <div className="flex flex-col gap-1">
             <span className="text-[10px] uppercase text-slate-600 tracking-widest">Spirit</span>
             <div className="flex items-center gap-2">
                <Star size={20} className="fill-blue-400 text-blue-400" />
                <span className="text-xl font-bold text-white tabular-nums">{snowballs}</span>
             </div>
          </div>
        </div>

        {/* Center: Chronometer */}
        <div className="absolute left-1/2 -translate-x-1/2 top-4 flex flex-col items-center">
            <Clock size={16} className="text-slate-500 mb-1" />
            <div className={`text-3xl font-bold tabular-nums tracking-widest ${timeLeft < 30 ? 'text-red-900' : 'text-slate-200'}`}>
                {formatTime(timeLeft)}
            </div>
        </div>

        {/* Right: Archive % */}
        <div className="text-right flex flex-col gap-1">
             <span className="text-[10px] uppercase text-slate-600 tracking-widest">Knowledge</span>
             <div className="text-xl font-bold text-yellow-500 tabular-nums">
                {Math.floor(score / 100)}%
             </div>
        </div>
      </div>

      {/* Bottom: Progress */}
      <div className="w-full h-[2px] bg-slate-900 fixed bottom-0 left-0">
          <div 
             className="h-full bg-slate-400" 
             style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} 
          />
      </div>
      
      {/* Biome Name */}
      <div className="absolute bottom-4 left-4 text-xs font-serif italic text-slate-600">
          Region: {currentLevelName}
      </div>

    </div>
  );
};

export default UIOverlay;