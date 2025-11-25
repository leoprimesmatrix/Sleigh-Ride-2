
import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Gift, ShieldCheck } from 'lucide-react';

interface VictorySequenceProps {
  onRestart: () => void;
}

const VictorySequence: React.FC<VictorySequenceProps> = ({ onRestart }) => {
  const [stage, setStage] = useState(0);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    setTimeout(() => setStage(1), 500); 
    setTimeout(() => setStage(2), 3500); 
    setTimeout(() => setStage(3), 10000); 
    setTimeout(() => setShowButton(true), 15000);
  }, []);

  return (
    <div className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden text-white font-mono">
      
      {/* Matrix Background */}
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
          {[...Array(20)].map((_, i) => (
             <div key={i} className="absolute text-green-500 text-xs animate-pulse" style={{
                 left: `${Math.random()*100}%`, top: `${Math.random()*100}%`,
                 writingMode: 'vertical-rl'
             }}>
                 0101011101010101
             </div>
          ))}
      </div>

      {/* Stage 1: Terminal Boot */}
      <div className={`transition-all duration-1000 ${stage === 1 ? 'opacity-100' : 'opacity-0'} text-green-500 text-xl`}>
         > SYSTEM REBOOT INITIATED...<br/>
         > K.R.A.M.P.U.S. OFFLINE<br/>
         > HOLIDAY PROTOCOL RESTORED
      </div>

      {/* Stage 2: Message */}
      <div className={`absolute inset-0 flex items-center justify-center px-8 transition-opacity duration-1000 ${stage === 2 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-3xl text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold text-cyan-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]">
                MISSION ACCOMPLISHED
            </h1>
            <p className="text-xl text-slate-300">
                The Mainframe is secure. Magic has returned to the grid.
            </p>
        </div>
      </div>

      {/* Stage 3: Button */}
      <div className={`absolute bottom-20 transition-all duration-1000 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <button 
            onClick={onRestart}
            className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-none border border-green-400 font-bold text-lg shadow-[0_0_20px_rgba(34,197,94,0.5)] flex items-center gap-3"
          >
            <ShieldCheck size={24} /> RETURN TO BASE
          </button>
      </div>
    </div>
  );
};

export default VictorySequence;
