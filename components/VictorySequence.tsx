
import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface VictorySequenceProps {
  onRestart: () => void;
}

const VictorySequence: React.FC<VictorySequenceProps> = ({ onRestart }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Cinematic Timing
    setTimeout(() => setStage(1), 2000); // Machine Spin
    setTimeout(() => setStage(2), 5000); // White Out
    setTimeout(() => setStage(3), 8000); // Black Screen Text
    setTimeout(() => setStage(4), 12000); // Credits
  }, []);

  return (
    <div className="absolute inset-0 bg-[#00020a] z-50 flex flex-col items-center justify-center overflow-hidden font-mono text-white">
      
      {/* Stage 0-1: The Machine Visual */}
      {stage < 2 && (
          <div className="relative flex items-center justify-center animate-pulse">
             <div className="absolute w-[500px] h-[500px] border-4 border-cyan-500 rounded-full animate-[spin-slow_10s_linear_infinite] opacity-50 shadow-[0_0_80px_rgba(0,243,255,0.3)]"></div>
             <div className="absolute w-[300px] h-[300px] border-4 border-white rounded-full animate-[spin_4s_linear_infinite_reverse] shadow-[0_0_30px_rgba(255,255,255,0.2)]"></div>
             <div className="text-center z-10">
                 <Clock size={64} className="mx-auto mb-4 text-cyan-400 drop-shadow-[0_0_20px_rgba(0,243,255,1)]" />
                 <h1 className="text-2xl tracking-[0.5em] text-cyan-100 uppercase text-shadow-glow">Chronos Engine</h1>
                 <p className="text-xs text-cyan-500 mt-2 tracking-widest">TARGET DATE: 0001 AD</p>
             </div>
          </div>
      )}

      {/* Stage 2: White Flash */}
      <div className={`absolute inset-0 bg-white transition-opacity duration-[2000ms] pointer-events-none ${stage === 2 ? 'opacity-100' : 'opacity-0'}`} />

      {/* Stage 3-4: The Reveal */}
      <div className={`absolute inset-0 bg-[#00020a] flex flex-col items-center justify-center transition-opacity duration-1000 ${stage >= 3 ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-xl text-cyan-100 italic mb-8 max-w-lg text-center leading-relaxed drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
              "History is gone. So I will rewrite it."
          </p>
          
          {stage >= 4 && (
            <div className="mt-8 text-center animate-fade-in-up">
                <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">YEAR 0</h1>
                <p className="text-cyan-600 text-sm mb-12 uppercase tracking-[0.5em]">The Cycle Begins</p>
                
                <button 
                    onClick={onRestart}
                    className="text-cyan-400 hover:text-white border-b border-cyan-400 hover:border-white pb-1 transition-all uppercase tracking-widest text-xs hover:shadow-[0_5px_10px_-5px_rgba(255,255,255,0.5)]"
                >
                    System Reset
                </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default VictorySequence;