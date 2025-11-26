
import React, { useEffect, useState } from 'react';
import { Snowflake } from 'lucide-react';

interface VictorySequenceProps {
  onRestart: () => void;
}

const VictorySequence: React.FC<VictorySequenceProps> = ({ onRestart }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Cinematic Timing
    setTimeout(() => setStage(1), 2000); // Machine Spin
    setTimeout(() => setStage(2), 6000); // White Out
    setTimeout(() => setStage(3), 9000); // Black Screen Text
    setTimeout(() => setStage(4), 13000); // Credits
  }, []);

  return (
    <div className="absolute inset-0 bg-[#020617] z-50 flex flex-col items-center justify-center overflow-hidden font-serif text-white">
      
      {/* Stage 0-1: The Machine Visual */}
      {stage < 2 && (
          <div className="relative flex items-center justify-center animate-pulse">
             <div className="absolute w-[500px] h-[500px] border border-blue-500/30 rounded-full animate-[spin-slow_20s_linear_infinite] opacity-50 shadow-[0_0_80px_rgba(96,165,250,0.2)]"></div>
             <div className="absolute w-[400px] h-[400px] border border-white/20 rounded-full animate-[spin_10s_linear_infinite_reverse]"></div>
             <div className="text-center z-10">
                 <Snowflake size={80} className="mx-auto mb-4 text-blue-100 drop-shadow-[0_0_40px_rgba(255,255,255,0.8)] animate-spin" />
                 <h1 className="text-3xl tracking-[0.2em] text-blue-50 uppercase text-shadow-glow mt-8">THE CHRONOS SNOWFLAKE</h1>
                 <p className="text-xs text-blue-400 mt-4 tracking-widest font-mono">CALIBRATING TEMPORAL COORDINATES</p>
             </div>
          </div>
      )}

      {/* Stage 2: White Flash */}
      <div className={`absolute inset-0 bg-white transition-opacity duration-[3000ms] pointer-events-none ${stage === 2 ? 'opacity-100' : 'opacity-0'}`} />

      {/* Stage 3-4: The Reveal */}
      <div className={`absolute inset-0 bg-[#0f172a] flex flex-col items-center justify-center transition-opacity duration-1000 ${stage >= 3 ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-2xl text-blue-100 italic mb-8 max-w-lg text-center leading-relaxed drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]">
              "The Saint didn't leave us. He went back... to save Christmas from itself."
          </p>
          
          {stage >= 4 && (
            <div className="mt-8 text-center animate-fade-in-up">
                <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] font-serif">Sleigh Ride 1</h1>
                <p className="text-blue-400 text-sm mb-12 uppercase tracking-[0.5em] font-mono">DESTINATION: DEC 24, 2024</p>
                
                <button 
                    onClick={onRestart}
                    className="text-blue-300 hover:text-white border-b border-blue-500 hover:border-white pb-1 transition-all uppercase tracking-widest text-xs font-mono hover:shadow-[0_5px_10px_-5px_rgba(255,255,255,0.5)]"
                >
                    Complete the Loop
                </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default VictorySequence;