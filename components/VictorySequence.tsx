import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';

interface VictorySequenceProps {
  onRestart: () => void;
}

const VictorySequence: React.FC<VictorySequenceProps> = ({ onRestart }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Cinematic Timeline
    setTimeout(() => setStage(1), 2000); 
    setTimeout(() => setStage(2), 6000); 
    setTimeout(() => setStage(3), 10000); 
    setTimeout(() => setStage(4), 15000);
  }, []);

  return (
    <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden text-white font-serif">
      
      {/* Stage 1: The Machine Activates */}
      <div className={`transition-opacity duration-2000 ${stage === 1 ? 'opacity-100' : 'opacity-0'} text-center`}>
          <div className="text-6xl text-white mb-4 animate-pulse">⚙</div>
          <p className="text-slate-400 tracking-[0.5em] text-sm uppercase">Temporal Engine Online</p>
      </div>

      {/* Stage 2: Destination */}
      {stage >= 2 && stage < 4 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white transition-opacity duration-[3000ms] animate-[pulse_0.2s_infinite]">
             <h1 className="text-black text-9xl font-bold font-mono">YEAR 0001</h1>
          </div>
      )}

      {/* Stage 3: Fade to Black & Cliffhanger */}
      <div className={`absolute inset-0 bg-black flex flex-col items-center justify-center transition-opacity duration-1000 ${stage >= 3 ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-2xl text-slate-300 italic mb-8">
              "To save the future... I must build the legend."
          </p>
          {stage >= 4 && (
            <div className="mt-12 text-center animate-fade-in-up">
                <h1 className="text-4xl text-yellow-500 font-christmas mb-2">The Cycle Begins</h1>
                <p className="text-slate-600 text-sm mb-8">Sleigh Ride 1 Prequel Setup Complete.</p>
                <button 
                    onClick={onRestart}
                    className="text-slate-400 hover:text-white border-b border-transparent hover:border-white pb-1 transition-all uppercase tracking-widest text-xs"
                >
                    Return to Menu
                </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default VictorySequence;