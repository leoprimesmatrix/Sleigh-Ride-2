
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
    <div className="h-screen overflow-y-auto bg-slate-950 flex flex-col items-center justify-center p-4 select-none font-mono text-white">
      
      {gameState === GameState.MENU && !isLoading && (
        <div className="text-center w-full max-w-2xl border border-slate-700 bg-slate-900/90 p-8 rounded-lg shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-cyan-500 to-red-500 animate-pulse" />
          
          <h1 className="text-6xl font-black mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            SLEIGH RIDE 2
          </h1>
          <p className="text-xl text-red-500 font-bold tracking-[0.5em] uppercase mb-8">CYBER-SLEIGH</p>
          
          <div className="grid gap-4">
              <button onClick={() => handleStartClick(GameMode.STORY)} className="py-4 bg-cyan-900/50 hover:bg-cyan-800 border border-cyan-500/50 text-cyan-100 text-xl font-bold rounded flex items-center justify-center gap-4 transition-all hover:scale-105 group">
                  <Cpu className="group-hover:animate-spin" /> INFILTRATE MAINFRAME
              </button>
              <button onClick={() => setGameState(GameState.HELP)} className="py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-bold rounded flex items-center justify-center gap-4 transition-all">
                  <FileText /> MISSION BRIEFING
              </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center space-y-6">
           <Loader2 size={64} className="text-cyan-500 animate-spin" />
           <div className="text-2xl font-bold text-cyan-500 tracking-widest animate-pulse">ESTABLISHING UPLINK...</div>
        </div>
      )}

      {gameState === GameState.HELP && (
        <div className="w-full max-w-2xl bg-slate-900 p-8 rounded border border-cyan-500/30">
          <h2 className="text-3xl font-bold text-cyan-400 mb-6">OPERATIONAL GUIDE</h2>
          <ul className="space-y-4 text-slate-300">
             <li className="flex gap-4 items-center"><span className="text-cyan-400 font-bold">JUMP:</span> Space / Tap Screen</li>
             <li className="flex gap-4 items-center"><span className="text-cyan-400 font-bold">FIRE:</span> Z / Tap Right Side</li>
             <li className="flex gap-4 items-center"><span className="text-red-400 font-bold">GOAL:</span> Reach the Mainframe. Destroy Drones.</li>
          </ul>
          <button onClick={() => setGameState(GameState.MENU)} className="mt-8 w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold">BACK</button>
        </div>
      )}

      {(gameState === GameState.PLAYING || gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) && (
        <div className="relative w-full max-w-[1200px] aspect-[2/1] shadow-[0_0_50px_rgba(6,182,212,0.2)] rounded-xl overflow-hidden border border-slate-800">
          <GameCanvas gameState={gameState} gameMode={gameMode} setGameState={setGameState} onWin={handleWin} />
          
          {gameState === GameState.GAME_OVER && (
            <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center">
              <h2 className="text-6xl font-black text-red-600 tracking-widest mb-4">SIGNAL LOST</h2>
              <button onClick={restartGame} className="px-8 py-3 bg-red-900/50 border border-red-500 text-red-100 font-bold hover:bg-red-800">RETRY CONNECTION</button>
            </div>
          )}
          
          {gameState === GameState.VICTORY && <VictorySequence onRestart={restartGame} />}
        </div>
      )}
    </div>
  );
};

export default App;
