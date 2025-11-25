
import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas.tsx';
import VictorySequence from './components/VictorySequence.tsx';
import { GameState, PowerupType, GameMode } from './types.ts';
import { Play, HelpCircle, ArrowLeft, Loader2, FileText, Cpu, Crosshair, Star } from 'lucide-react';

const CURRENT_VERSION = '2.0.1';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.STORY);
  const [isLoading, setIsLoading] = useState(false);
  
  // Prevent space scrolling globally when game is focused
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
        if (gameState === GameState.PLAYING && (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown')) {
            e.preventDefault();
        }
    };
    window.addEventListener('keydown', handleGlobalKey, { passive: false });
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [gameState]);

  const handleStartClick = (mode: GameMode) => {
    setGameMode(mode);
    setIsLoading(true);
    setTimeout(() => { setIsLoading(false); setGameState(GameState.PLAYING); }, 1500);
  };

  const handleWin = () => setGameState(GameState.VICTORY);
  const restartGame = () => setGameState(GameState.MENU);

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-4 select-none font-mono text-white relative">
      
      {/* Background: Cyber-Grid + Snow */}
      <div className="absolute inset-0 z-0 bg-[#020617]">
          {/* Grid */}
          <div className="absolute inset-0 opacity-20" 
             style={{ 
               backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)', 
               backgroundSize: '40px 40px',
               transform: 'perspective(500px) rotateX(10deg) scale(1.5)'
             }} 
          />
          {/* Particles (CSS only for menu background) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
             {[...Array(30)].map((_, i) => (
                 <div key={i} className="absolute bg-cyan-200 rounded-full opacity-40 animate-pulse" 
                      style={{
                          left: `${Math.random()*100}%`,
                          top: `${Math.random()*100}%`,
                          width: `${Math.random()*4 + 2}px`,
                          height: `${Math.random()*4 + 2}px`,
                          animationDuration: `${Math.random()*3 + 2}s`
                      }} 
                 />
             ))}
          </div>
      </div>

      {gameState === GameState.MENU && !isLoading && (
        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
          
          {/* Title Card */}
          <div className="text-center w-full bg-black/40 backdrop-blur-xl border-y border-cyan-500/30 p-12 mb-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
            
            <h1 className="text-7xl md:text-8xl mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] font-christmas tracking-wide">
              Sleigh Ride
            </h1>
            <div className="flex items-center justify-center gap-4 text-cyan-400 text-2xl tracking-[0.5em] font-bold uppercase">
                <span className="text-pink-500">★</span> 2.0 Cyber-Sleigh <span className="text-pink-500">★</span>
            </div>
          </div>
          
          {/* Menu Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-lg">
              <button 
                onClick={() => handleStartClick(GameMode.STORY)} 
                className="group relative px-8 py-6 bg-slate-900 border border-cyan-700 hover:border-cyan-400 rounded-xl transition-all hover:scale-105 shadow-lg overflow-hidden"
              >
                  <div className="absolute inset-0 bg-cyan-900/20 group-hover:bg-cyan-400/10 transition-colors" />
                  <div className="relative flex items-center justify-center gap-3 text-xl font-bold text-white group-hover:text-cyan-300">
                      <Play className="fill-current" /> START MISSION
                  </div>
              </button>

              <button 
                onClick={() => setGameState(GameState.HELP)} 
                className="group relative px-8 py-6 bg-slate-900 border border-slate-700 hover:border-white rounded-xl transition-all hover:scale-105 shadow-lg overflow-hidden"
              >
                  <div className="absolute inset-0 bg-slate-800/50 group-hover:bg-white/5 transition-colors" />
                  <div className="relative flex items-center justify-center gap-3 text-xl font-bold text-slate-300 group-hover:text-white">
                      <FileText /> BRIEFING
                  </div>
              </button>
          </div>
          
          <div className="mt-12 text-xs text-slate-500 font-mono flex items-center gap-2">
              <span>SYSTEM STATUS: ONLINE</span>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span>v{CURRENT_VERSION}</span>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center space-y-8 z-10">
           <div className="relative">
              <div className="w-32 h-32 border-4 border-slate-800 rounded-full"></div>
              <div className="w-32 h-32 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0 shadow-[0_0_20px_#22d3ee]"></div>
              <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-500 animate-pulse" size={40} />
           </div>
           <div className="text-3xl font-bold text-white tracking-[0.3em] font-christmas animate-pulse">INITIALIZING...</div>
        </div>
      )}

      {gameState === GameState.HELP && (
        <div className="w-full max-w-3xl bg-slate-900/95 backdrop-blur-xl p-10 rounded-2xl border border-slate-700 z-10 shadow-2xl relative">
          <button onClick={() => setGameState(GameState.MENU)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"><Crosshair /></button>
          
          <h2 className="text-4xl font-bold text-cyan-400 mb-2 font-christmas">Mission Briefing</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-cyan-500 to-transparent mb-8"></div>

          <div className="grid md:grid-cols-2 gap-8 text-slate-300">
             <div className="space-y-6">
                 <h3 className="text-white font-bold uppercase tracking-widest text-sm border-b border-slate-700 pb-2">Controls</h3>
                 <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center font-bold text-xl shadow-inner">␣</div>
                    <div>
                        <div className="text-white font-bold">JUMP / FLY</div>
                        <div className="text-xs text-slate-500">Hold to thrust upwards</div>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center font-bold text-xl shadow-inner">Z</div>
                    <div>
                        <div className="text-white font-bold">FIRE PLASMA</div>
                        <div className="text-xs text-slate-500">Clear obstacles</div>
                    </div>
                 </div>
             </div>

             <div className="space-y-6">
                 <h3 className="text-white font-bold uppercase tracking-widest text-sm border-b border-slate-700 pb-2">Objectives</h3>
                 <ul className="space-y-4 text-sm">
                     <li className="flex gap-3"><span className="text-yellow-400">★</span> Dodge Cyber-Pipes and Drones.</li>
                     <li className="flex gap-3"><span className="text-cyan-400">★</span> Collect Data Packets (Letters).</li>
                     <li className="flex gap-3"><span className="text-pink-400">★</span> Reach the Core to reboot Christmas.</li>
                 </ul>
             </div>
          </div>

          <button onClick={() => setGameState(GameState.MENU)} className="mt-10 w-full py-4 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-lg transition-colors shadow-lg">
              ACKNOWLEDGE
          </button>
        </div>
      )}

      {(gameState === GameState.PLAYING || gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) && (
        <div className="relative w-full h-full md:max-w-[1200px] md:max-h-[600px] shadow-2xl rounded-xl overflow-hidden bg-black z-20 border-4 border-slate-800">
          <GameCanvas gameState={gameState} gameMode={gameMode} setGameState={setGameState} onWin={handleWin} />
          
          {gameState === GameState.GAME_OVER && (
            <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center backdrop-blur-sm animate-fade-in-up">
              <h2 className="text-6xl md:text-8xl font-black text-red-500 tracking-widest mb-2 font-christmas drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">SYSTEM FAILURE</h2>
              <p className="text-slate-400 mb-8 font-mono tracking-widest uppercase">Signal Lost</p>
              <button onClick={restartGame} className="px-10 py-4 bg-white text-black font-black hover:bg-cyan-400 hover:text-white rounded-full transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                  REBOOT SYSTEM
              </button>
            </div>
          )}
          
          {gameState === GameState.VICTORY && <VictorySequence onRestart={restartGame} />}
        </div>
      )}
    </div>
  );
};

export default App;
