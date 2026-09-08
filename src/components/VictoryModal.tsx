import React from 'react';
import { Award, RotateCcw, CheckCircle2, Home } from 'lucide-react';
import { Inventory } from '../types';

interface VictoryModalProps {
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  inventory: Inventory;
  timeTakenSeconds: number;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  onPlayAgain,
  onBackToMenu,
  inventory,
  timeTakenSeconds,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div id="victory-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none font-mono text-white p-6 animate-fade-in">
      {/* Cold Night Moonlight Glow Background */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.5)_0%,transparent_75%)]" />

      <div className="relative max-w-md w-full bg-zinc-950/90 border border-emerald-800/80 rounded-xl p-6 text-center space-y-6 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
        <div className="space-y-2">
          <div className="inline-flex p-3 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-widest text-emerald-400 uppercase">
            YOU ESCAPED
          </h2>
          <p className="text-xs text-zinc-300">
            The diesel generator roared to life. You unchained the highway perimeter gate and escaped the Blackwood Pines into safety.
          </p>
        </div>

        {/* Escape Mission Report */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 text-xs space-y-2.5 text-left">
          <div className="flex justify-between items-center text-zinc-400">
            <span>ESCAPE TIME:</span>
            <span className="font-bold text-white text-sm">{formatTime(timeTakenSeconds)}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-400">
            <span>SPARK PLUGS INSTALLED:</span>
            <span className="font-bold text-emerald-400 text-sm">{inventory.fuses} / 3</span>
          </div>
          <div className="flex justify-between items-center text-zinc-400">
            <span>FIELD NOTES RECOVERED:</span>
            <span className="font-bold text-sky-400 text-sm">{inventory.notesRead.length} / 4</span>
          </div>
          <div className="flex justify-between items-center text-zinc-400">
            <span>STATUS:</span>
            <span className="font-bold text-emerald-400 text-sm">SURVIVED THE BLACKWOOD WENDIGO</span>
          </div>
        </div>

        {/* Play Again Button */}
        <div className="flex flex-col gap-2.5">
          <button
            id="play-again-btn"
            onClick={onPlayAgain}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg shadow-lg transition-all cursor-pointer transform hover:scale-[1.02]"
          >
            <RotateCcw className="h-4 w-4" />
            <span>TRY AGAIN</span>
          </button>
          <button
            id="victory-menu-btn"
            onClick={onBackToMenu}
            className="w-full flex items-center justify-center gap-2.5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold rounded-lg transition-all cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
