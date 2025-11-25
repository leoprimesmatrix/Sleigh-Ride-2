import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas.tsx';
import VictorySequence from './components/VictorySequence.tsx';
import { GameState, PowerupType, GameMode } from './types.ts';
import { Play, HelpCircle, FileText, Crosshair, Star } from 'lucide-react';

const CURRENT_VERSION = '2.1.0';

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

  const handleStartClick = (mode: GameMode) => {
    setGameMode(mode);
    setIsLoading(true);
    setTimeout(() => { setIsLoading(false); setGameState(GameState.PLAYING); }, 2000);
  };

  const handleWin = () => setGameState(GameState.VICTORY);
  const restartGame = () => setGameState(GameState.MENU);

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-4 select-none font-serif text-slate-200 relative">
      
      {/* Background: Desolate Snow */}
      <div className="absolute inset-0 z-0 bg-[#0f172a]">
          <div className="absolute inset-0 opacity-20 pointer-events-none" 
               style={{ 
                 backgroundImage: 'radial-gradient(circle at 50% 100%, #334155 0%, #0f172a 60%)'
               }} 
          />
          {/* Ash Particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
             {[...Array(30)].map((_, i) => (
                 <div key={i} className="absolute bg-slate-400 rounded-full opacity-10 animate-[bounce-slow_10s_infinite]" 
                      style={{
                          left: `${Math.random()*100}%`,
                          top: `${Math.random()*100}%`,
                          width: `${Math.random()*4}px`,
                          height: `${Math.random()*4}px`,
                          animationDelay: `${Math.random()*5}s`
                      }} 
                 />
             ))}
          </div>
      </div>

      {gameState === GameState.MENU && !isLoading && (
        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
          
          {/* Title Card */}
          <div className="text-center w-full mb-16 relative">
            <h1 className="text-6xl md:text-8xl mb-4 text-slate-200 font-christmas tracking-wide drop-shadow-2xl">
              Sleigh Ride 2
            </h1>
            <h2 className="text-2xl md:text-3xl text-yellow-500/80 font-serif tracking-[0.2em] uppercase border-t border-b border-slate-700 py-2 inline-block">
                Brave New World
            </h2>
            <p className="text-slate-500 text-xs mt-4 tracking-widest font-mono">
                THE AFTERMATH • YEAR 2xxx
            </p>
          </div>
          
          {/* Menu Buttons */}
          <div className="flex flex-col gap-6 w-full max-w-xs">
              <button 
                onClick={() => handleStartClick(GameMode.STORY)} 
                className="group relative px-6 py-4 bg-transparent border border-slate-600 hover:border-yellow-500 hover:bg-slate-900 transition-all duration-500"
              >
                  <div className="flex items-center justify-between text-lg text-slate-400 group-hover:text-yellow-500 font-mono uppercase tracking-widest">
                      <span>Begin Journey</span>
                      <Play size={16} />
                  </div>
              </button>

              <button 
                onClick={() => setGameState(GameState.HELP)} 
                className="group relative px-6 py-4 bg-transparent border border-slate-800 hover:border-slate-500 transition-all duration-500"
              >
                  <div className="flex items-center justify-between text-lg text-slate-600 group-hover:text-slate-300 font-mono uppercase tracking-widest">
                      <span>Archives</span>
                      <FileText size={16} />
                  </div>
              </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center space-y-8 z-10">
           <div className="w-16 h-16 border-t-2 border-yellow-500 rounded-full animate-spin"></div>
           <div className="text-sm text-slate-500 tracking-[0.5em] uppercase font-mono animate-pulse">Accessing Ancient Memory...</div>
        </div>
      )}

      {gameState === GameState.HELP && (
        <div className="w-full max-w-3xl bg-slate-950/95 backdrop-blur-xl p-12 border border-slate-800 z-10 shadow-2xl relative">
          <button onClick={() => setGameState(GameState.MENU)} className="absolute top-6 right-6 p-2 hover:text-white transition-colors"><Crosshair /></button>
          
          <h2 className="text-3xl font-serif text-slate-200 mb-2 italic">The Seeker's Log</h2>
          <div className="w-12 h-0.5 bg-yellow-600 mb-8"></div>

          <div className="text-slate-400 space-y-6 font-mono text-sm leading-relaxed">
             <p>
                "They say there was once a man in Red who commanded the skies. He brought light to the darkest nights. But that was centuries ago."
             </p>
             <p>
                "The cities are silent now. The factories are rusted. But I found a machine... a Sleigh. It still hums with a strange warmth."
             </p>
             <p className="text-yellow-500/80">
                OBJECTIVE: Pilot the Scavenged Sleigh. Collect Artifacts. Find the Frozen Throne. Discover the truth of Santa Claus.
             </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 border-t border-slate-800 pt-8">
              <div className="flex items-center gap-3">
                  <div className="p-2 border border-slate-700 rounded text-xs">SPACE</div>
                  <span className="text-xs uppercase tracking-widest text-slate-500">Ascend</span>
              </div>
              <div className="flex items-center gap-3">
                  <div className="p-2 border border-slate-700 rounded text-xs">Z</div>
                  <span className="text-xs uppercase tracking-widest text-slate-500">Lantern Flash</span>
              </div>
          </div>
        </div>
      )}

      {(gameState === GameState.PLAYING || gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) && (
        <div className="relative w-full h-full md:max-w-[1200px] md:max-h-[600px] shadow-2xl overflow-hidden bg-black z-20 border border-slate-900">
          <GameCanvas gameState={gameState} gameMode={gameMode} setGameState={setGameState} onWin={handleWin} />
          
          {gameState === GameState.GAME_OVER && (
            <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center animate-fade-in-up">
              <h2 className="text-4xl text-slate-300 font-serif italic mb-4">The Flame is Extinguished</h2>
              <p className="text-slate-600 text-sm mb-8 font-mono">HISTORY REMAINS FORGOTTEN.</p>
              <button onClick={restartGame} className="px-8 py-3 border border-slate-700 text-slate-400 hover:text-white hover:border-white transition-all uppercase tracking-widest text-xs">
                  Rekindle
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