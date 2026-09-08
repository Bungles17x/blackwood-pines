import React, { useEffect } from 'react';
import { Map, X, Compass, Key, Zap, Shield, DoorClosed, AlertCircle } from 'lucide-react';
import * as THREE from 'three';

interface MapModalProps {
  playerPosition: THREE.Vector3;
  hasKeycard: boolean;
  fusesFound: number;
  isPowerRestored: boolean;
  onClose: () => void;
}

export const MapModal: React.FC<MapModalProps> = ({
  playerPosition,
  hasKeycard,
  fusesFound,
  isPowerRestored,
  onClose,
}) => {
  // Convert 3D coordinate (-80 to 80) to percentage (0% to 100%) across the expanded 160m map
  const playerMapX = ((playerPosition.x + 80) / 160) * 100;
  const playerMapY = ((playerPosition.z + 80) / 160) * 100;

  // Keyboard close handlers
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyM' || e.code === 'KeyE' || e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKey, { capture: true });
    };
  }, [onClose]);

  return (
    <div
      id="map-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 font-mono select-none cursor-default"
      onClick={onClose}
    >
      <div
        id="map-modal-content"
        className="relative w-full max-w-4xl bg-zinc-950 border-2 border-emerald-500/60 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.25)] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-zinc-900 border-b border-zinc-800 text-emerald-400 text-xs">
          <div className="flex items-center gap-2.5">
            <Map className="h-4 w-4 text-emerald-400" />
            <span className="font-bold tracking-widest uppercase">BLACKWOOD PINES STATE PARK // TOPOGRAPHIC TRAIL MAP</span>
          </div>
          <button
            id="map-close-btn"
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-800 hover:bg-emerald-800 text-zinc-100 font-bold rounded text-xs transition-colors cursor-pointer border border-zinc-700 active:scale-95"
          >
            <X className="h-4 w-4" /> CLOSE MAP [M / ESC / E]
          </button>
        </div>

        {/* Blueprint Schematic Canvas */}
        <div className="map-schematic relative h-[480px] w-full bg-stone-950 p-6 flex flex-col justify-between overflow-hidden border-b border-zinc-800">
          {/* Topographic Grid Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#05966915_1px,transparent_1px),linear-gradient(to_bottom,#05966915_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

          {/* Forest Regions Layout Schematic */}
          <div className="relative h-full w-full border-2 border-emerald-700/80 rounded-lg p-3 bg-emerald-950/20">
            {/* Compass Rose */}
            <div className="absolute top-2 right-2 text-emerald-500/50 flex flex-col items-center pointer-events-none">
              <span className="font-black text-xs">N</span>
              <div className="h-6 w-0.5 bg-emerald-500/40" />
              <div className="w-6 h-0.5 bg-emerald-500/40 -mt-3.5" />
            </div>

            {/* 1. North Trailhead & Overlook */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-56 h-14 border-2 border-emerald-600/70 bg-emerald-900/30 flex flex-col items-center justify-center text-[10px] text-emerald-300 font-bold rounded shadow">
              <span>NORTH TRAILHEAD // OVERLOOK</span>
              <span className="text-[9px] text-amber-300 font-normal">PICKUP TRUCK (CABIN KEY IN BED)</span>
            </div>

            {/* 2. Northwest Ancient Monolith Stone Circle */}
            <div className="absolute top-18 left-4 w-48 h-20 border-2 border-red-800/80 bg-red-950/25 p-2 flex flex-col justify-between text-[10px] text-red-300 rounded shadow">
              <div className="font-bold flex items-center justify-between">
                <span>STONE MONOLITH CIRCLE</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-red-900/80 rounded">ANCIENT</span>
              </div>
              <div className="flex items-center gap-1 text-amber-300 font-bold">
                <Zap className="h-3 w-3 text-amber-400" />
                <span>SPARK PLUG #2 (ALTAR)</span>
              </div>
            </div>

            {/* 3. Northeast Misty Campsite & Swale */}
            <div className="absolute top-18 right-4 w-48 h-20 border-2 border-emerald-600/70 bg-emerald-900/25 p-2 flex flex-col justify-between text-[10px] text-emerald-300 rounded shadow">
              <div className="font-bold flex items-center justify-between">
                <span>HIKER'S CAMPSITE</span>
                <Shield className="h-3 w-3 text-emerald-400" />
              </div>
              <div className="text-[9px] text-zinc-400">TENTS & CAMPFIRE EMBERS</div>
              <div className="flex items-center gap-1 text-amber-300 font-bold">
                <Zap className="h-3 w-3 text-amber-400" />
                <span>SPARK PLUG #1 (TENT)</span>
              </div>
            </div>

            {/* 4. West Ridge Ranger Station Cabin */}
            <div className="absolute top-44 left-4 w-48 h-22 border-2 border-emerald-600/70 bg-emerald-900/25 p-2 flex flex-col justify-between text-[10px] text-emerald-300 rounded shadow">
              <div className="font-bold flex items-center justify-between">
                <span>RANGER CABIN</span>
                <Shield className="h-3 w-3 text-emerald-400" />
              </div>
              <div className="text-[9px] text-amber-400">
                {hasKeycard ? 'UNLOCKED' : 'LOCKED (REQUIRES TRUCK KEY)'}
              </div>
              <div className="text-[9px] text-emerald-400 font-bold">
                CCTV TERMINAL // HAM RADIO (6L6 TUBE)
              </div>
            </div>

            {/* 5. East Lookout Bluff */}
            <div className="absolute top-44 right-4 w-48 h-22 border-2 border-emerald-600/70 bg-emerald-900/25 p-2 flex flex-col justify-between text-[10px] text-emerald-300 rounded shadow">
              <div className="font-bold flex items-center justify-between">
                <span>LOOKOUT BLUFF</span>
                <Shield className="h-3 w-3 text-emerald-400" />
              </div>
              <div className="text-[9px] text-zinc-400">HUNTING BLIND & CHEST</div>
              <div className="text-[9px] text-sky-400 font-bold">FLARES & BATTERIES</div>
            </div>

            {/* 6. Southwest Old Logging Camp */}
            <div className="absolute bottom-18 left-4 w-52 h-20 border-2 border-emerald-600/70 bg-emerald-900/25 p-2 flex flex-col justify-between text-[10px] text-emerald-300 rounded shadow">
              <div className="font-bold flex items-center justify-between">
                <span>LOGGING CAMP & SHELTER</span>
                <Shield className="h-3 w-3 text-emerald-400" />
              </div>
              <div className="flex flex-col text-[9px] text-amber-300 font-bold">
                <span>SPARK PLUG #3 (WORKBENCH)</span>
                <span className="text-yellow-400">5-GAL DIESEL CANISTER (SHED)</span>
              </div>
            </div>

            {/* 7. Southeast High-Voltage Generator Bunker */}
            <div className="absolute bottom-18 right-4 w-52 h-20 border-2 border-amber-500/80 bg-amber-950/25 p-2 flex flex-col justify-between text-[10px] text-amber-300 rounded shadow">
              <div className="font-bold flex items-center justify-between">
                <span>DIESEL GENERATOR</span>
                <Zap className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              </div>
              <div className="text-[9px] text-zinc-300">REQUIRES 3 PLUGS + DIESEL FUEL</div>
              <div className="text-[9px] text-emerald-400 font-bold">
                POWERS HIGHWAY ESCAPE GATE
              </div>
            </div>

            {/* Central Heart of the Woods Trails */}
            <div className="absolute inset-x-28 top-20 bottom-18 border border-dashed border-emerald-700/40 rounded-full pointer-events-none flex items-center justify-center">
              <span className="text-[10px] tracking-widest text-emerald-600/70 font-bold">
                DEEP PINE TRAILS
              </span>
            </div>

            {/* 8. South Highway Gate (Escape Route) */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-64 h-12 border-2 border-emerald-500 bg-emerald-950/60 flex items-center justify-center gap-2 text-xs font-bold text-emerald-300 rounded shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <DoorClosed className="h-4 w-4 text-emerald-400" />
              <span>SOUTH HIGHWAY GATE [{isPowerRestored ? 'OPEN - ESCAPE!' : 'POWER REQUIRED'}]</span>
            </div>

            {/* Real-time Player Position Radar Blip */}
            <div
              className="absolute h-5 w-5 -ml-2.5 -mt-2.5 rounded-full bg-red-500 border-2 border-white shadow-[0_0_16px_rgba(239,68,68,1)] transition-all duration-200 pointer-events-none flex items-center justify-center z-30"
              style={{
                left: `${Math.max(5, Math.min(95, playerMapX))}%`,
                top: `${Math.max(5, Math.min(95, playerMapY))}%`,
              }}
            >
              <div className="h-2 w-2 rounded-full bg-white animate-ping" />
            </div>
          </div>
        </div>

        {/* Blueprint Legend & Objectives Checklist */}
        <div className="map-legend p-4 bg-zinc-900 text-xs flex items-center justify-between text-zinc-400 flex-wrap gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-red-400 font-bold">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span>YOU</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Zap className="h-3.5 w-3.5" />
              <span>SPARK PLUGS: {fusesFound}/3</span>
            </div>
            <div className="flex items-center gap-1.5 text-sky-400 font-bold">
              <Key className="h-3.5 w-3.5" />
              <span>CABIN KEY: {hasKeycard ? 'OBTAINED' : 'MISSING (AT TRUCK)'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Shield className="h-3.5 w-3.5" />
              <span>HUNTING BLINDS (SAFE HIDING)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Compass className="h-4 w-4" />
              <span>GENERATOR: {isPowerRestored ? 'ACTIVE (GATE OPEN)' : 'OFFLINE'}</span>
            </div>
            <button type="button" onClick={onClose} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded text-xs transition-colors cursor-pointer">
              CLOSE [M]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
