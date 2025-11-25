
import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas.tsx';
import VictorySequence from './components/VictorySequence.tsx';
import { GameState, GameMode } from './types.ts';
import { Terminal, Cpu, Play } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.STORY);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
        if (gameState === GameState.PLAYING && (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown')) {
            e.preventDefault();
        }
    };
    window.addEventListener('keydown', handleGlobalKey, { passive: false });
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [gameState]);

  const handleStart = () => {
      setGameMode(GameMode.STORY);
      setIsLoading(true);
      setTimeout(() => { setIsLoading(false); setGameState(GameState.PLAYING); }, 2500);
  };

  const restart = () => setGameState(GameState.MENU);

  return (
    <div className="h-screen w-screen overflow-hidden bg-black flex flex-col items-center justify-center font-mono text-slate-300 relative">
      
      {/* Matrix / Scanline Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
           style={{
               backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(34, 197, 94, .1) 25%, rgba(34, 197, 94, .1) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, .1) 75%, rgba(34, 197, 94, .1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(34, 197, 94, .1) 25%, rgba(34, 197, 94, .1) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, .1) 75%, rgba(34, 197, 94, .1) 76%, transparent 77%, transparent)',
               backgroundSize: '50px 50px'
           }}
      />

      {gameState === GameState.MENU && !isLoading && (
        <div className="z-10 text-center flex flex-col items-center gap-8">
            <div className="border-4 border-slate-800 p-8 bg-black/80 shadow-[0_0_30px_rgba(255,255,255,0.1)] max-w-2xl">
                <h1 className="text-6xl md:text-7xl font-bold text-white mb-2 tracking-tighter">SLEIGH RIDE 2</h1>
                <h2 className="text-2xl text-cyan-500 tracking-[0.3em] uppercase mb-8">Brave New World</h2>
                
                <div className="text-left text-xs text-slate-500 font-mono space-y-2 mb-8 border-l-2 border-slate-700 pl-4">
                    <p>> SYSTEM YEAR: 2941</p>
                    <p>> SUBJECT: KRAMPUS (SCAVENGER CLASS)</p>
                    <p>> MISSION: LOCATE "SANTA" SIGNAL</p>
                    <p>> STATUS: AWAITING INPUT...</p>
                </div>

                <button onClick={handleStart} className="group flex items-center justify-center gap-4 w-full bg-slate-900 hover:bg-cyan-900 border border-slate-700 py-4 transition-all">
                    <Play className="text-cyan-400 group-hover:text-white" />
                    <span className="text-xl tracking-widest group-hover:text-white">INITIATE LAUNCH</span>
                </button>
            </div>
            
            <div className="flex gap-8 text-xs text-slate-600">
                <div className="flex items-center gap-2"><div className="w-4 h-4 border border-slate-600 flex items-center justify-center">SPC</div> THRUST</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 border border-slate-600 flex items-center justify-center">Z</div> EMP BLAST</div>
            </div>
        </div>
      )}

      {isLoading && (
          <div className="z-10 flex flex-col items-center gap-4">
              <Cpu className="animate-spin text-cyan-500" size={48} />
              <div className="text-cyan-500 text-sm tracking-widest animate-pulse">BOOTING SCAVENGER OS...</div>
              <div className="w-64 h-1 bg-slate-800"><div className="h-full bg-cyan-500 animate-[slide-in-right_2s_ease-out]"/></div>
          </div>
      )}

      {(gameState === GameState.PLAYING || gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) && (
         <div className="relative w-full h-full md:max-w-[1200px] md:max-h-[600px] shadow-2xl overflow-hidden bg-black z-20 border border-slate-900">
            <GameCanvas gameState={gameState} gameMode={gameMode} setGameState={setGameState} onWin={() => setGameState(GameState.VICTORY)} />
            
            {gameState === GameState.GAME_OVER && (
                <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center">
                    <Terminal size={64} className="text-red-500 mb-4" />
                    <h2 className="text-4xl text-white font-bold tracking-widest mb-2">CRITICAL FAILURE</h2>
                    <p className="text-slate-500 font-mono mb-8">HULL INTEGRITY 0%. SIGNAL LOST.</p>
                    <button onClick={restart} className="px-6 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all uppercase">
                        REBOOT SYSTEM
                    </button>
                </div>
            )}

            {gameState === GameState.VICTORY && <VictorySequence onRestart={restart} />}
         </div>
      )}
    </div>
  );
};
export default App;
