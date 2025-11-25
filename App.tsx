
import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas.tsx';
import VictorySequence from './components/VictorySequence.tsx';
import { GameState, PowerupType, GameMode } from './types.ts';
import { Play, HelpCircle, ArrowLeft, Loader2, FileText, Cpu, Crosshair } from 'lucide-react';

const CURRENT_VERSION = '2.0';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.STORY);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleStartClick = (mode: GameMode) => {
    setGameMode(mode);
    setIsLoading(true);
    setTimeout(() => { setIsLoading(false); setGameState(GameState.PLAYING); }, 1500);
  };

  const handleWin = () => setGameState(GameState.VICTORY);
  const restartGame = () => setGameState(GameState.MENU);

  return (
    <div className="h-screen overflow-y-auto bg-slate-950 flex flex-col items-center justify-center p-4 select-none font-mono text-white relative">
      
      {/* Background Grid Animation */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)', 
             backgroundSize: '40px 40px',
             transform: 'perspective(500px) rotateX(20deg)'
           }} 
      />

      {gameState === GameState.MENU && !isLoading && (
        <div className="text-center w-full max-w-2xl bg-black/80 backdrop-blur-xl border border-cyan-900 p-12 rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.3)] z-10 relative overflow-hidden group">
          
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600" />
          
          <h1 className="text-6xl md:text-7xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 drop-shadow-sm">
            SLEIGH RIDE <span className="text-cyan-400">2</span>
          </h1>
          <p className="text-sm md:text-base text-cyan-500 font-bold tracking-[0.6em] uppercase mb-12 flex items-center justify-center gap-4">
            <span className="w-8 h-[1px] bg-cyan-800"></span>
            CYBER-SLEIGH
            <span className="w-8 h-[1px] bg-cyan-800"></span>
          </p>
          
          <div className="flex flex-col gap-4 max-w-sm mx-auto">
              <button 
                onClick={() => handleStartClick(GameMode.STORY)} 
                className="py-4 bg-cyan-600 hover:bg-cyan-500 text-white text-lg font-bold rounded-lg shadow-lg shadow-cyan-900/50 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
              >
                  <Play size={20} fill="currentColor" /> INITIATE LAUNCH
              </button>
              <button 
                onClick={() => setGameState(GameState.HELP)} 
                className="py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-all flex items-center justify-center gap-3"
              >
                  <FileText size={20} /> MISSION DATA
              </button>
          </div>
          
          <div className="absolute bottom-4 right-6 text-xs text-slate-600 font-mono">v{CURRENT_VERSION} SYSTEM READY</div>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center space-y-8 z-10">
           <div className="relative">
              <div className="w-24 h-24 border-4 border-slate-800 rounded-full"></div>
              <div className="w-24 h-24 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
           </div>
           <div className="text-2xl font-bold text-white tracking-[0.3em] animate-pulse">UPLOADING...</div>
        </div>
      )}

      {gameState === GameState.HELP && (
        <div className="w-full max-w-2xl bg-slate-900/90 backdrop-blur p-8 rounded-xl border border-slate-700 z-10">
          <h2 className="text-3xl font-bold text-cyan-400 mb-8 border-b border-slate-700 pb-4">MISSION PROTOCOLS</h2>
          <ul className="space-y-6 text-slate-300">
             <li className="flex gap-6 items-center">
                <div className="bg-slate-800 p-3 rounded text-cyan-400 font-bold w-24 text-center">SPACE</div>
                <div>ENGAGE THRUSTERS (JUMP)</div>
             </li>
             <li className="flex gap-6 items-center">
                <div className="bg-slate-800 p-3 rounded text-pink-400 font-bold w-24 text-center">Z</div>
                <div>FIRE NEON BOLTS</div>
             </li>
             <li className="flex gap-6 items-center">
                <div className="bg-slate-800 p-3 rounded text-yellow-400 font-bold w-24 text-center">GOAL</div>
                <div>DELIVER THE PAYLOAD. REBOOT THE HOLIDAY.</div>
             </li>
          </ul>
          <button onClick={() => setGameState(GameState.MENU)} className="mt-8 w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg">RETURN TO MENU</button>
        </div>
      )}

      {(gameState === GameState.PLAYING || gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) && (
        <div className="relative w-full max-w-[1200px] aspect-[2/1] shadow-2xl rounded-xl overflow-hidden bg-black z-20">
          <GameCanvas gameState={gameState} gameMode={gameMode} setGameState={setGameState} onWin={handleWin} />
          
          {gameState === GameState.GAME_OVER && (
            <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
              <h2 className="text-6xl font-black text-red-500 tracking-widest mb-2">SYSTEM FAILURE</h2>
              <p className="text-slate-400 mb-8">CONNECTION TERMINATED</p>
              <button onClick={restartGame} className="px-10 py-4 bg-white text-black font-black hover:bg-slate-200 rounded-full transition-transform hover:scale-105">RETRY UPLOAD</button>
            </div>
          )}
          
          {gameState === GameState.VICTORY && <VictorySequence onRestart={restartGame} />}
        </div>
      )}
    </div>
  );
};

export default App;
