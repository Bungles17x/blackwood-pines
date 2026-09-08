import React, { useState, useEffect } from 'react';
import { Camera, Radio, X, AlertTriangle, ShieldCheck, LogOut } from 'lucide-react';
import * as THREE from 'three';

interface CCTVModalProps {
  creaturePosition: THREE.Vector3;
  onClose: () => void;
}

const CAMERAS = [
  { id: 'CAM_01', name: 'NORTH TRAILHEAD', zone: 'Overlook / Truck', pos: new THREE.Vector3(0, 0, -28) },
  { id: 'CAM_02', name: 'RANGER CABIN', zone: 'West Ridge Cabin', pos: new THREE.Vector3(-28, 0, -16) },
  { id: 'CAM_03', name: 'MONOLITH CIRCLE', zone: 'Ancient Ruins Grove', pos: new THREE.Vector3(-26, 0, -38) },
  { id: 'CAM_04', name: 'MISTY CAMPSITE', zone: 'East Clearing Pond', pos: new THREE.Vector3(24, 0, -32) },
  { id: 'CAM_05', name: 'LOGGING SHELTER', zone: 'Southwest Timber Yard', pos: new THREE.Vector3(-32, 0, 24) },
  { id: 'CAM_06', name: 'GENERATOR BUNKER', zone: 'Southeast Power Grid', pos: new THREE.Vector3(28, 0, 24) },
];

export const CCTVModal: React.FC<CCTVModalProps> = ({ creaturePosition, onClose }) => {
  const [activeCamIndex, setActiveCamIndex] = useState(0);
  const [staticGlitch, setStaticGlitch] = useState(false);

  // Close on ESC, E, Space
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyE' || e.code === 'Space') {
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

  const activeCam = CAMERAS[activeCamIndex];
  // Calculate distance between creature and this camera position
  const distToMonster = activeCam.pos.distanceTo(creaturePosition);
  const isMonsterInFrame = distToMonster < 16.0;

  useEffect(() => {
    // Random camera feed glitching
    const interval = setInterval(() => {
      if (Math.random() < 0.25 || isMonsterInFrame) {
        setStaticGlitch(true);
        setTimeout(() => setStaticGlitch(false), 200);
      }
    }, 1400);
    return () => clearInterval(interval);
  }, [isMonsterInFrame]);

  return (
    <div
      id="cctv-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 font-mono select-none cursor-default"
      onClick={onClose}
    >
      <div
        id="cctv-modal-content"
        className="relative w-full max-w-4xl bg-zinc-950 border-2 border-emerald-500/50 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.2)] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-zinc-900 border-b border-zinc-800 text-emerald-400 text-xs">
          <div className="flex items-center gap-2.5">
            <Camera className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span className="font-bold tracking-widest uppercase">BLACKWOOD PINES // WILDLIFE SURVEILLANCE CAMERAS</span>
          </div>
          <button
            id="cctv-close-btn"
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-800 hover:bg-emerald-800 text-zinc-100 font-bold rounded text-xs transition-colors cursor-pointer border border-zinc-700 active:scale-95"
          >
            <LogOut className="h-4 w-4" /> DISCONNECT [ESC / E]
          </button>
        </div>

        {/* Screen Feed Canvas */}
        <div className="cctv-feed relative h-96 w-full bg-black overflow-hidden flex items-center justify-center">
          {/* Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.7)_50%)] bg-[length:100%_4px] z-10" />

          {/* Glitch filter */}
          {staticGlitch && (
            <div className="absolute inset-0 bg-emerald-500/10 mix-blend-difference pointer-events-none z-20 animate-pulse" />
          )}

          {/* Camera Visualizer Content */}
          <div className="text-center space-y-3 z-0">
            {isMonsterInFrame ? (
              <div className="flex flex-col items-center gap-2 text-red-500 animate-pulse">
                <AlertTriangle className="h-12 w-12 text-red-500" />
                <span className="text-lg font-black tracking-widest">
                  WARNING: UNIDENTIFIED BIOLOGICAL ENTITY DETECTED
                </span>
                <span className="text-xs text-red-400 bg-red-950/80 px-3 py-1 rounded border border-red-800">
                  CREATURE LOCATED IN {activeCam.zone.toUpperCase()} ({activeCam.name}) - DISTANCE ~{Math.round(distToMonster)}m
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-emerald-500/60">
                <ShieldCheck className="h-10 w-10 text-emerald-600/60" />
                <span className="text-sm tracking-wider font-semibold">FEED ACTIVE - NO ANOMALIES DETECTED</span>
                <span className="text-xs text-zinc-500">{activeCam.name}</span>
              </div>
            )}
          </div>

          {/* Camera Info Watermark */}
          <div className="absolute top-4 left-5 text-emerald-400 text-xs space-y-1 z-20">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold">{activeCam.id}</span>
              <span className="text-zinc-500">//</span>
              <span>{activeCam.name}</span>
            </div>
            <div className="text-[10px] text-zinc-400">ZONE: {activeCam.zone}</div>
          </div>

          <div className="absolute bottom-4 left-5 text-[10px] text-zinc-400 z-20 flex items-center gap-2">
            <Radio className="h-3 w-3 text-emerald-500" />
            <span>FREQ: 142.85 MHz // SIGNAL STRENGTH: OPTIMAL</span>
          </div>
        </div>

        {/* Camera Selector Buttons */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {CAMERAS.map((cam, idx) => {
              const camHasMonster = cam.pos.distanceTo(creaturePosition) < 16.0;
              return (
                <button
                  key={cam.id}
                  type="button"
                  onClick={() => setActiveCamIndex(idx)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeCamIndex === idx
                      ? 'bg-emerald-600 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {camHasMonster && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />}
                  {cam.id}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded text-xs transition-colors cursor-pointer"
          >
            DISCONNECT [E / ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
