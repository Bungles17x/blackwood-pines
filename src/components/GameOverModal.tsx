import React from 'react';
import { Skull, RotateCcw, AlertTriangle, Home } from 'lucide-react';
import { Inventory } from '../types';

interface GameOverModalProps {
  onRetry: () => void;
  inventory: Inventory;
  timeSurvivedSeconds: number;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  onRetry,
  inventory,
  timeSurvivedSeconds,
  onMainMenu,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div id="game-over-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none font-mono text-white p-6 animate-fade-in">
      {/* Red Jumpscare flash effect background */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.7)_0%,transparent_80%)]" />

      {/* Static / Glitch scanline overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[linear-gradient(rgba(255,0,0,0.15)_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px]" />

      <div className="relative max-w-md w-full bg-zinc-950/90 border border-red-900/80 rounded-xl p-6 text-center space-y-6 shadow-[0_0_50px_rgba(220,38,38,0.4)]">
        <div className="space-y-2">
          <div className="inline-flex p-3 rounded-full bg-red-950/60 border border-red-800 text-red-500 animate-pulse">
            <Skull className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-widest text-red-500 uppercase">
            YOU WERE CAUGHT
          </h2>
          <p className="text-xs text-zinc-400">
            Claimed by the Blackwood Wendigo. Your body was never recovered from the dark pines.
          </p>
        </div>

        {/* Survival Run Statistics */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 text-xs space-y-2.5 text-left">
          <div className="flex justify-between items-center text-zinc-400">
            <span>TIME SURVIVED:</span>
            <span className="font-bold text-white text-sm">{formatTime(timeSurvivedSeconds)}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-400">
            <span>SPARK PLUGS RECOVERED:</span>
            <span className="font-bold text-amber-400 text-sm">{inventory.fuses} / 3</span>
          </div>
          <div className="flex justify-between items-center text-zinc-400">
            <span>RANGER CABIN KEY:</span>
            <span className={`font-bold text-sm ${inventory.hasKeycard ? 'text-emerald-400' : 'text-zinc-500'}`}>
              {inventory.hasKeycard ? 'ACQUIRED' : 'NOT FOUND'}
            </span>
          </div>
          <div className="flex justify-between items-center text-zinc-400">
            <span>FOREST NOTES READ:</span>
            <span className="font-bold text-sky-400 text-sm">{inventory.notesRead.length} / 4</span>
          </div>
        </div>

        {/* Tactical Survival Hint */}
        <div className="flex items-start gap-2.5 bg-red-950/30 border border-red-900/40 p-3 rounded-lg text-left text-[11px] text-zinc-300">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Tip: Running snaps pine needles and branches. Crouch [C] to move silently or slip into Hunting Blinds [E]!
          </span>
        </div>

        {/* Retry Button */}
        <div className="flex flex-col gap-2.5">
          <button id="retry-game-btn" onClick={onRetry} className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg shadow-lg transition-all cursor-pointer transform hover:scale-[1.02]">
            <RotateCcw className="h-4 w-4" />
            <span>TRY AGAIN</span>
          </button>
          <button id="game-over-menu-btn" onClick={onMainMenu} className="w-full flex items-center justify-center gap-2.5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-lg transition-all cursor-pointer">
            <Home className="h-4 w-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
