
import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas.tsx';
import VictorySequence from './components/VictorySequence.tsx';
import { GameState, GameMode, DebugCommand } from './types.ts';
import { Snowflake, Play, BookOpen, XCircle, FastForward, Eye, Zap, Gauge, Skull } from 'lucide-react';
import { soundManager } from './audio.ts';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.STORY);
  const [isLoading, setIsLoading] = useState(false);
  const [bootLog, setBootLog] = useState<string[]>([]);
  
  // Debug State
  const [debugClicks, setDebugClicks] = useState(0);
  const [isDebugUnlocked, setIsDebugUnlocked] = useState(false);
  const [debugCommand, setDebugCommand] = useState<DebugCommand>(null);
  const [showDebugMenu, setShowDebugMenu] = useState(false);

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
      soundManager.init();
      setGameMode(GameMode.STORY);
      setIsLoading(true);
      
      const logs = [
          "AWAKENING ANCIENT SPIRIT...",
          "RECONSTRUCTING SLEIGH HULL...",
          "ATTUNING TO POLAR LEY LINES...",
          "WEAPONS... LOST TO TIME",
          "CONNECTING TO ECHO NETWORK...",
          "RECOVERING FORGOTTEN MEMORIES...",
          "OBJECTIVE: FIND THE RED SAINT",
          "SPIRIT READY."
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

  const handleSecretClick = () => {
      if (isDebugUnlocked) {
          setShowDebugMenu(true);
          return;
      }
      const newCount = debugClicks + 1;
      setDebugClicks(newCount);
      if (newCount === 5) {
          setIsDebugUnlocked(true);
          setShowDebugMenu(true);
          setDebugClicks(0);
      }
  };

  const sendDebugCommand = (cmd: DebugCommand) => {
      setDebugCommand(cmd);
      if (cmd === 'SKIP_TO_ENDING') setShowDebugMenu(false);
      
      if (gameState !== GameState.PLAYING && cmd === 'SKIP_TO_ENDING') {
          setGameState(GameState.PLAYING);
      }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020617] flex flex-col items-center justify-center font-mono text-blue-50 relative select-none">
      
      <div className="snow-container opacity-40"></div>
      
      {/* Background Gradient */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(circle at bottom, #172554 0%, #020617 70%)' }}></div>

      <div className="absolute top-4 left-4 text-[10px] text-blue-800 flex flex-col gap-1 z-50 cursor-pointer hover:text-blue-400 transition-colors" onClick={handleSecretClick}>
          <div>SPIRIT_ID: 0xKRAMPUS</div>
          <div>YEAR: 2941 (EST)</div>
          <div>STATUS: SEEKER</div>
      </div>
      <div className="absolute bottom-4 right-4 text-[10px] text-blue-900 text-right z-0">
          <div>HISTORY: CORRUPTED</div>
          <div>LOCATION: FROZEN WASTES</div>
      </div>

      {showDebugMenu && (
          <div className="absolute top-20 left-20 z-[90] bg-[#0f172a]/95 border border-blue-500 p-4 w-72 shadow-xl backdrop-blur-md rounded">
               <div className="flex justify-between items-center mb-4 border-b border-blue-900 pb-2">
                   <h3 className="text-blue-400 font-bold tracking-widest text-xs">SPIRIT_DEBUG</h3>
                   <button onClick={() => setShowDebugMenu(false)} className="text-blue-700 hover:text-blue-400"><XCircle size={14}/></button>
               </div>
               <div className="space-y-2">
                   <button onClick={() => sendDebugCommand('SKIP_TO_ENDING')} className="w-full text-left text-xs bg-slate-900 hover:bg-blue-900/50 text-blue-400 p-2 border border-slate-800 hover:border-blue-500 flex items-center gap-2 transition-colors">
                       <FastForward size={14} /> JUMP TO CHRONOS
                   </button>
                   <button onClick={() => sendDebugCommand('TOGGLE_GOD_MODE')} className="w-full text-left text-xs bg-slate-900 hover:bg-blue-900/50 text-yellow-400 p-2 border border-slate-800 hover:border-yellow-500 flex items-center gap-2 transition-colors">
                       <Eye size={14} /> TOGGLE ETERNAL FORM
                   </button>
                   <button onClick={() => sendDebugCommand('INCREASE_SPEED')} className="w-full text-left text-xs bg-slate-900 hover:bg-blue-900/50 text-green-400 p-2 border border-slate-800 hover:border-green-500 flex items-center gap-2 transition-colors">
                       <Gauge size={14} /> INCREASE VELOCITY
                   </button>
               </div>
          </div>
      )}

      {gameState === GameState.MENU && !isLoading && (
        <div className="z-20 text-center flex flex-col items-center gap-8 relative w-full px-4">
            
            <div className="relative mb-8 w-full max-w-4xl">
                <div className="text-4xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-200 tracking-tighter magic-text whitespace-nowrap mb-2">
                    SLEIGH RIDE 2
                </div>
                <div className="flex items-center justify-center w-full mt-2 py-1 gap-4">
                    <span className="h-px w-12 bg-blue-800/50"></span>
                    <h2 className="text-lg md:text-2xl text-blue-300 tracking-[0.3em] uppercase font-serif text-shadow-glow">
                        The Forgotten Winter
                    </h2>
                    <span className="h-px w-12 bg-blue-800/50"></span>
                </div>
            </div>

            <div className="w-full max-w-md bg-[#0f172a]/80 border border-blue-900/50 backdrop-blur-md p-1 relative group shadow-[0_0_50px_rgba(37,99,235,0.15)] rounded-sm">
                
                <div className="p-8 flex flex-col gap-6">
                    <div className="text-left text-xs text-blue-400/80 font-mono mb-2 leading-relaxed">
                        <p>> The bells haven't rung in 900 years.</p>
                        <p>> The toys are rusting. The elves are corrupted.</p>
                        <p>> I am the last Spirit. I must find Him.</p>
                    </div>

                    <button onClick={handleStart} className="relative overflow-hidden group/btn bg-blue-950 border border-blue-800 hover:border-blue-400 py-4 px-8 transition-all duration-300 hover:shadow-[0_0_20px_rgba(96,165,250,0.4)]">
                        <div className="absolute inset-0 w-full h-full bg-blue-500/10 scale-x-0 group-hover/btn:scale-x-100 transition-transform origin-left duration-300"></div>
                        <div className="flex items-center justify-center gap-3 relative z-10">
                            <Play className="text-blue-500 group-hover/btn:text-white transition-colors" size={20} />
                            <span className="text-lg tracking-[0.2em] group-hover/btn:text-white transition-colors font-bold font-serif">BEGIN JOURNEY</span>
                        </div>
                    </button>

                    <button onClick={() => setGameState(GameState.INFO)} className="relative overflow-hidden group/btn bg-slate-900 border border-slate-800 hover:border-yellow-600 py-3 px-8 transition-all duration-300 hover:shadow-[0_0_20px_rgba(202,138,4,0.3)]">
                        <div className="absolute inset-0 w-full h-full bg-yellow-600/10 scale-x-0 group-hover/btn:scale-x-100 transition-transform origin-left duration-300"></div>
                        <div className="flex items-center justify-center gap-3 relative z-10">
                            <BookOpen className="text-yellow-600 group-hover/btn:text-white transition-colors" size={18} />
                            <span className="text-sm tracking-[0.2em] group-hover/btn:text-white transition-colors font-bold font-serif">THE ARCHIVES</span>
                        </div>
                    </button>
                    
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="bg-slate-900/50 border border-slate-800 p-2 text-xs text-slate-500 text-center hover:border-blue-500/30 transition-colors">
                            <span className="text-blue-500 font-bold block mb-1">FLY</span>
                            [SPACE] / [TAP]
                        </div>
                         <div className="bg-slate-900/50 border border-slate-800 p-2 text-xs text-slate-500 text-center hover:border-blue-500/30 transition-colors">
                            <span className="text-blue-300 font-bold block mb-1">SPIRIT FORM</span>
                            [HOLD SHIFT]
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {gameState === GameState.INFO && (
          <div className="z-30 w-full max-w-4xl h-[80vh] bg-[#0f172a]/95 border border-blue-900 backdrop-blur-md p-6 relative flex flex-col overflow-hidden shadow-2xl rounded">
             <div className="flex items-center justify-between border-b border-blue-900/50 pb-4 mb-4">
                 <div className="flex items-center gap-4">
                     <BookOpen className="text-yellow-600" size={24} />
                     <h2 className="text-2xl font-bold tracking-widest text-white font-serif">The Book of Secrets</h2>
                 </div>
                 <button onClick={() => setGameState(GameState.MENU)} className="text-slate-400 hover:text-white flex items-center gap-2 text-xs tracking-widest uppercase border border-slate-700 px-4 py-2 hover:bg-slate-800 transition-colors">
                     <XCircle size={16} /> Close Book
                 </button>
             </div>

             <div className="flex-1 overflow-y-auto grid md:grid-cols-2 gap-8 pr-2 custom-scrollbar p-4">
                 <div className="space-y-6">
                     <h3 className="text-blue-400 border-b border-blue-900 pb-1 text-sm tracking-widest uppercase mb-4 font-serif">Gameplay Guides</h3>
                     
                     <div className="flex gap-4 p-4 bg-slate-900/50 border border-slate-800 items-start hover:border-blue-500/50 transition-colors">
                         <div className="w-12 h-12 border border-blue-500 flex items-center justify-center bg-blue-900/20 shrink-0 rounded-full">
                             <Zap size={20} className="text-blue-400" />
                         </div>
                         <div>
                             <h4 className="text-white font-bold text-sm font-serif">SPIRIT FORM [HOLD SHIFT]</h4>
                             <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                                 Revert to your ghostly nature to pass through solid objects unharmed.
                                 <br/><br/>
                                 <span className="text-blue-300">PRO TIP:</span> Passing through obstacles while in Spirit Form restores your energy and recovers lost memories (Score).
                             </p>
                         </div>
                     </div>
                 </div>

                 <div className="space-y-6">
                     <h3 className="text-yellow-600 border-b border-yellow-900 pb-1 text-sm tracking-widest uppercase mb-4 font-serif">The Great Forgetting</h3>

                     <div className="flex gap-4 p-4 bg-slate-900/50 border border-slate-800 items-start">
                         <div className="w-12 h-12 rounded-full border border-slate-500 flex items-center justify-center bg-slate-900/20 shrink-0">
                            <div className="text-xs text-slate-500 font-bold font-serif">I</div>
                         </div>
                         <div>
                             <h4 className="text-slate-300 font-bold text-sm font-serif">The Silence</h4>
                             <p className="text-slate-500 text-xs mt-2 leading-relaxed italic">
                                 "First the letters stopped. Then the belief faded. The Red Saint didn't die; he simply had no fuel left to exist in this timeline. He vanished into the blizzard, leaving only his Shadow behind."
                             </p>
                         </div>
                     </div>
                 </div>
             </div>
          </div>
      )}

      {isLoading && (
          <div className="z-30 flex flex-col items-start w-full max-w-lg p-8">
              <div className="flex items-center gap-4 mb-6">
                  <Snowflake className="animate-spin text-blue-400" size={32} />
                  <div className="text-xl text-white tracking-widest font-bold font-serif">RECALLING MEMORIES</div>
              </div>
              
              <div className="w-full bg-[#0f172a]/90 h-64 border border-blue-900 p-4 font-mono text-xs overflow-hidden flex flex-col justify-end shadow-lg rounded">
                  {bootLog.map((log, i) => (
                      <div key={i} className="mb-1">
                          <span className="text-blue-500 mr-2">{'>'}</span>
                          <span className="text-blue-100 opacity-80">{log}</span>
                      </div>
                  ))}
                  <div className="animate-pulse text-blue-500">_</div>
              </div>
              
              <div className="w-full h-1 bg-slate-800 mt-2 relative overflow-hidden rounded-full">
                  <div className="absolute inset-0 bg-blue-500 animate-[slide-in-right_3s_ease-out]"></div>
              </div>
          </div>
      )}

      {(gameState === GameState.PLAYING || gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) && (
         <div className="relative w-full h-full md:max-w-[1200px] md:max-h-[600px] shadow-2xl overflow-hidden bg-[#020617] z-20 border-2 border-slate-800 rounded-lg">
            <GameCanvas 
              gameState={gameState} 
              gameMode={gameMode} 
              setGameState={setGameState} 
              onWin={() => setGameState(GameState.VICTORY)}
              debugCommand={debugCommand}
              onDebugCommandHandled={() => setDebugCommand(null)}
            />
            
            {isDebugUnlocked && (
              <div className="absolute top-2 left-2 flex gap-2 z-50">
                  <div className="text-[10px] text-green-500 border border-green-800 px-2 py-1 bg-black/80 font-mono">
                    SPIRIT_UNBOUND
                  </div>
              </div>
            )}
            
            {gameState === GameState.GAME_OVER && (
                <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center font-serif">
                    <div className="border border-red-900/50 p-10 bg-red-950/20 backdrop-blur text-center max-w-lg shadow-[0_0_50px_rgba(185,28,28,0.1)] rounded-lg">
                        <Skull size={64} className="text-red-700 mb-6 mx-auto opacity-80" />
                        <h2 className="text-4xl text-red-500 font-bold tracking-widest mb-2">SPIRIT FADED</h2>
                        <div className="h-px w-full bg-red-900/50 my-6"></div>
                        <p className="text-red-300/60 mb-8 tracking-wider italic">"Christmas remains forgotten..."</p>
                        
                        <button onClick={restart} className="group px-8 py-3 border border-red-800 text-red-500 hover:bg-red-900 hover:text-white transition-all uppercase tracking-widest flex items-center gap-2 mx-auto font-mono text-xs">
                            <Zap size={14} />
                            REIGNITE SOUL
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