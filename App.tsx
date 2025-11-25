
import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas.tsx';
import VictorySequence from './components/VictorySequence.tsx';
import { GameState, GameMode } from './types.ts';
import { Terminal, Cpu, Play, Power, ShieldAlert, Radio } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.STORY);
  const [isLoading, setIsLoading] = useState(false);
  const [bootLog, setBootLog] = useState<string[]>([]);

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
      
      // Simulate Boot Sequence
      const logs = [
          "INITIALIZING KERNEL...",
          "MOUNTING FILE SYSTEM...",
          "CHECKING MEMORY INTEGRITY... OK",
          "LOADING PHYSICS ENGINE... OK",
          "CONNECTING TO NEURAL NET...",
          "DECRYPTING MISSION FILES...",
          "TARGET LOCKED: NORTH POLE",
          "SYSTEM READY."
      ];
      
      let delay = 0;
      logs.forEach((log, index) => {
          delay += Math.random() * 400 + 100;
          setTimeout(() => {
              setBootLog(prev => [...prev, log]);
          }, delay);
      });

      setTimeout(() => { 
          setIsLoading(false); 
          setBootLog([]);
          setGameState(GameState.PLAYING); 
      }, delay + 800);
  };

  const restart = () => setGameState(GameState.MENU);

  return (
    <div className="h-screen w-screen overflow-hidden bg-black flex flex-col items-center justify-center font-mono text-slate-300 relative select-none">
      
      {/* CRT Scanline Overlay */}
      <div className="absolute inset-0 scanlines z-50 pointer-events-none opacity-20"></div>
      
      {/* Moving Holographic Grid */}
      <div className="absolute inset-0 holo-grid opacity-20 pointer-events-none transform perspective-3d rotate-x-60"></div>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none z-10" style={{ background: 'radial-gradient(circle, transparent 60%, rgba(0,0,0,0.8) 100%)' }}></div>

      {/* Floating System Deco */}
      <div className="absolute top-4 left-4 text-[10px] text-cyan-900 flex flex-col gap-1 z-0">
          <div>SYS_ID: 0x94F2A</div>
          <div>MEM_FREE: 4092TB</div>
          <div>UPTIME: 9999:59:59</div>
      </div>
      <div className="absolute bottom-4 right-4 text-[10px] text-cyan-900 text-right z-0">
          <div>ENCRYPTION: AES-4096</div>
          <div>NET: OFFLINE</div>
          <div>LOC: UNKNOWN</div>
      </div>

      {gameState === GameState.MENU && !isLoading && (
        <div className="z-20 text-center flex flex-col items-center gap-8 relative">
            
            {/* Title Block */}
            <div className="relative mb-8">
                <div className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-white tracking-tighter glitch-wrapper" style={{ fontFamily: 'Orbitron' }}>
                    <span className="glitch absolute inset-0" data-text="SLEIGH RIDE 2">SLEIGH RIDE 2</span>
                    <span className="opacity-0">SLEIGH RIDE 2</span>
                </div>
                <div className="flex items-center justify-between w-full mt-2 border-t border-b border-cyan-800 py-1">
                    <span className="text-cyan-500 text-xs tracking-[0.5em] animate-pulse">PROTOCOL:</span>
                    <h2 className="text-xl md:text-2xl text-cyan-400 tracking-[0.3em] uppercase font-bold text-shadow-glow">
                        BRAVE NEW WORLD
                    </h2>
                    <span className="text-cyan-500 text-xs tracking-[0.5em] animate-pulse">ACTIVE</span>
                </div>
            </div>

            {/* Main Menu Panel */}
            <div className="w-full max-w-md bg-black/60 border border-slate-700 backdrop-blur-sm p-1 relative group">
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-cyan-500"/>
                <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-cyan-500"/>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-cyan-500"/>
                <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-cyan-500"/>

                <div className="p-6 flex flex-col gap-4">
                    <div className="text-left text-xs text-slate-500 font-mono mb-4">
                        <p>> YEAR: 2941 AD</p>
                        <p>> UNIT: KRAMPUS-7</p>
                        <p>> OBJECTIVE: RECOVER LEGACY DATA</p>
                        <p>> <span className="animate-pulse">_</span></p>
                    </div>

                    <button onClick={handleStart} className="relative overflow-hidden group/btn bg-slate-900 border border-slate-600 hover:border-cyan-400 py-4 px-8 transition-all duration-300">
                        <div className="absolute inset-0 w-full h-full bg-cyan-500/10 scale-x-0 group-hover/btn:scale-x-100 transition-transform origin-left duration-300"></div>
                        <div className="flex items-center justify-center gap-3 relative z-10">
                            <Power className="text-cyan-500 group-hover/btn:text-white transition-colors" size={20} />
                            <span className="text-lg tracking-[0.2em] group-hover/btn:text-white transition-colors font-bold">ENGAGE SYSTEM</span>
                        </div>
                    </button>
                    
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="bg-slate-900/50 border border-slate-800 p-2 text-xs text-slate-500 text-center">
                            <span className="text-cyan-600 font-bold block mb-1">CONTROLS</span>
                            [SPACE] THRUST
                        </div>
                         <div className="bg-slate-900/50 border border-slate-800 p-2 text-xs text-slate-500 text-center">
                            <span className="text-cyan-600 font-bold block mb-1">ABILITY</span>
                            [Z] EMP BLAST
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {isLoading && (
          <div className="z-30 flex flex-col items-start w-full max-w-lg p-8">
              <div className="flex items-center gap-4 mb-6">
                  <Cpu className="animate-spin text-cyan-500" size={32} />
                  <div className="text-xl text-white tracking-widest font-bold glitch" data-text="SYSTEM BOOT">SYSTEM BOOT</div>
              </div>
              
              <div className="w-full bg-slate-900 h-64 border border-slate-700 p-4 font-mono text-xs overflow-hidden flex flex-col justify-end shadow-[0_0_20px_rgba(8,145,178,0.2)]">
                  {bootLog.map((log, i) => (
                      <div key={i} className="mb-1">
                          <span className="text-cyan-500 mr-2">{'>'}</span>
                          <span className={log.includes("OK") ? "text-green-400" : "text-slate-300"}>{log}</span>
                      </div>
                  ))}
                  <div className="animate-pulse text-cyan-500">_</div>
              </div>
              
              <div className="w-full h-1 bg-slate-800 mt-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-cyan-500 progress-striped animate-[slide-in-right_3s_ease-out]"></div>
              </div>
          </div>
      )}

      {(gameState === GameState.PLAYING || gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) && (
         <div className="relative w-full h-full md:max-w-[1200px] md:max-h-[600px] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden bg-black z-20 border-2 border-slate-800">
            <GameCanvas gameState={gameState} gameMode={gameMode} setGameState={setGameState} onWin={() => setGameState(GameState.VICTORY)} />
            
            {gameState === GameState.GAME_OVER && (
                <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center font-mono">
                    <div className="border-4 border-red-600 p-8 bg-red-950/20 backdrop-blur text-center max-w-lg">
                        <ShieldAlert size={64} className="text-red-500 mb-6 mx-auto animate-pulse" />
                        <h2 className="text-5xl text-red-500 font-bold tracking-widest mb-2 glitch" data-text="CRITICAL FAILURE">CRITICAL FAILURE</h2>
                        <div className="h-px w-full bg-red-900 my-4"></div>
                        <p className="text-red-300/80 mb-8 tracking-wider">SIGNAL LOST. HULL COMPROMISED.</p>
                        
                        <button onClick={restart} className="group px-8 py-3 border border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest flex items-center gap-2 mx-auto">
                            <Radio size={16} className="group-hover:animate-ping"/>
                            RE-INITIALIZE
                        </button>
                    </div>
                </div>
            )}

            {gameState === GameState.VICTORY && <VictorySequence onRestart={restart} />}
         </div>
      )}
    </div>
  );
};
export default App;
