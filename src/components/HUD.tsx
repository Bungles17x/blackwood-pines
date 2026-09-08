import React from 'react';
import { FlashlightState, Inventory, SurvivalVitals } from '../types';
import { Battery, BatteryCharging, Key, Zap, FileText, Eye, Radio, Wine, Flame, Map, Shield, Sun, Fuel, Wind, Thermometer, Pause } from 'lucide-react';

interface HUDProps {
  flashlight: FlashlightState;
  inventory: Inventory;
  stamina: number;
  showStamina: boolean;
  distanceToMonster: number;
  hearingLevel: number;
  hearingColor: 'red' | 'yellow' | 'green';
  prompt: string | null;
  bannerMessage?: string | null;
  isDying?: boolean;
  isPowerRestored: boolean;
  isPlayerHiding: boolean;
  isCrouching?: boolean;
  activeLean: 'left' | 'right' | null;
  isHoldingBreath?: boolean;
  breathHoldRatio?: number;
  vitals?: SurvivalVitals;
  isFlashlightTappable?: boolean;
  onTapFlashlight?: () => void;
  onHoldBreath?: (holding: boolean) => void;
  onToggleFlashlight: () => void;
  onToggleUV: () => void;
  onUseBattery: () => void;
  onThrowBottle: () => void;
  onUseFlare: () => void;
  onOpenMap: () => void;
  onInteract: () => void;
  onPause?: () => void;
  onJump?: () => void;
  onToggleCrouch?: () => void;
  onHoldSprint?: (sprinting: boolean) => void;
  onVirtualMove?: (f: boolean, b: boolean, l: boolean, r: boolean) => void;
}

export const HUD: React.FC<HUDProps> = ({
  flashlight,
  inventory,
  stamina,
  showStamina,
  distanceToMonster,
  hearingLevel,
  hearingColor,
  prompt,
  bannerMessage,
  isDying,
  isPowerRestored,
  isPlayerHiding,
  isCrouching = false,
  activeLean,
  isHoldingBreath = false,
  breathHoldRatio = 1.0,
  vitals,
  isFlashlightTappable = false,
  onTapFlashlight,
  onHoldBreath,
  onToggleFlashlight,
  onToggleUV,
  onUseBattery,
  onThrowBottle,
  onUseFlare,
  onOpenMap,
  onInteract,
  onPause,
  onJump,
  onToggleCrouch,
  onHoldSprint,
  onVirtualMove,
}) => {
  // Calculate EMF Signal Level (1 to 5 bars) based purely on creature distance
  const emfLevel = distanceToMonster < 6 ? 5 : distanceToMonster < 10 ? 4 : distanceToMonster < 15 ? 3 : distanceToMonster < 20 ? 2 : distanceToMonster < 25 ? 1 : 0;
  const hearingLabel = hearingColor === 'red' ? 'LOUD' : hearingColor === 'yellow' ? 'AUDIBLE' : 'QUIET';
  const hasInteractionPrompt = Boolean(prompt);
  const isPickupHoodPrompt = Boolean(prompt && /pickup hood|open pickup/i.test(prompt));
  const showMobileReplenish = flashlight.enabled && !flashlight.isUVMode && flashlight.battery < 25;

  return (
    <div id="game-hud" className="pointer-events-none absolute inset-0 select-none overflow-hidden font-mono text-white">
      <div className="mobile-battery-status pointer-events-none absolute left-4 top-4 z-40 items-center gap-2 rounded-lg border border-zinc-500/80 bg-black/75 px-3 py-2 shadow-lg backdrop-blur-sm">
        <Battery
          className={`h-5 w-5 ${
            flashlight.battery > 50
              ? 'text-emerald-400'
              : flashlight.battery > 20
              ? 'text-amber-400'
              : 'text-red-500 animate-pulse'
          }`}
        />
        <span className="text-xs font-bold text-zinc-100">{Math.round(flashlight.battery)}%</span>
      </div>
      <div className="mobile-sensor-status pointer-events-none absolute left-4 top-[4.5rem] z-40 flex items-center gap-3 rounded-lg border border-zinc-500/80 bg-black/75 px-3 py-2 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <Radio className={`h-4 w-4 ${emfLevel >= 4 ? 'text-red-500 animate-pulse' : emfLevel >= 2 ? 'text-amber-400' : 'text-emerald-400'}`} />
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <span
                key={level}
                className={`h-3 w-1.5 rounded-sm ${
                  level <= emfLevel
                    ? level >= 4
                      ? 'bg-red-500'
                      : level >= 3
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                    : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="h-5 w-px bg-zinc-700" />
        <div className="flex min-w-[5rem] flex-col gap-1">
          <div className="flex items-center justify-between gap-2 text-[9px] font-bold tracking-wider">
            <span className="text-zinc-400">HEARING</span>
            <span className={hearingColor === 'red' ? 'text-red-400' : hearingColor === 'yellow' ? 'text-amber-300' : 'text-emerald-300'}>
              {hearingLabel}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-sm bg-zinc-800">
            <div
              className={`h-full transition-[width,background-color] duration-150 ${hearingColor === 'red' ? 'bg-red-500' : hearingColor === 'yellow' ? 'bg-amber-400' : 'bg-emerald-400'}`}
              style={{ width: `${Math.max(0, Math.min(100, hearingLevel))}%` }}
            />
          </div>
        </div>
      </div>
      <button
        aria-label="Pause game"
        onClick={onPause}
        className="mobile-pause-button pointer-events-auto absolute right-4 top-4 z-40 h-12 w-12 items-center justify-center rounded-lg border border-zinc-500/80 bg-black/75 text-zinc-100 shadow-lg backdrop-blur-sm"
      >
        <Pause className="h-5 w-5" />
      </button>
      {/* Jumpscare Death Overlay */}
      {isDying && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden bg-red-950/60 animate-pulse flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(200,0,0,0.9)_100%)]" />
          <div className="relative text-center px-6 py-4 rounded-xl bg-black/80 border-2 border-red-600 shadow-[0_0_50px_rgba(239,68,68,0.8)]">
            <div className="text-red-500 font-black tracking-widest text-3xl sm:text-5xl uppercase drop-shadow-[0_0_20px_rgba(255,0,0,1)]">
              PREY SLAIN
            </div>
            <p className="text-zinc-400 text-xs mt-2 tracking-widest uppercase">The Wendigo claimed another soul</p>
          </div>
        </div>
      )}

      {/* Narrative Atmospheric Banner */}
      {bannerMessage && !isDying && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[90%] pointer-events-none transition-all duration-500">
          <div
            className={`px-5 py-2.5 rounded-lg backdrop-blur-md border text-center text-xs tracking-wider shadow-2xl font-semibold flex items-center justify-center gap-2.5 ${
              bannerMessage.includes('AWAKENED')
                ? 'bg-red-950/90 border-red-600/90 text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.5)] animate-pulse'
                : 'bg-black/85 border-amber-500/40 text-amber-200 shadow-black/80'
            }`}
          >
            <span>{bannerMessage}</span>
          </div>
        </div>
      )}
      {/* 1. Hunting Blind Hiding Slit Overlay */}
      {isPlayerHiding && (
        <div className="absolute inset-0 pointer-events-none z-30 bg-black/95 flex flex-col justify-between">
          <div className="h-[30%] bg-zinc-950 border-b-4 border-zinc-800 shadow-2xl flex items-center justify-center">
            <span className="text-xs text-zinc-300 font-bold tracking-widest flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" /> CONCEALED IN HUNTING BLIND // BREATH MUTED [PRESS E TO EXIT]
            </span>
          </div>
          <div className="h-[30%] bg-zinc-950 border-t-4 border-zinc-800 shadow-2xl" />
        </div>
      )}

      {/* Hypothermia Frost Vignette & Shivering Alert */}
      {vitals?.isShivering && (
        <div className="absolute inset-0 pointer-events-none z-25 border-[14px] border-cyan-500/20 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(6,182,212,0.2)_100%)] animate-pulse">
          <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-cyan-950/90 border border-cyan-500/80 text-cyan-200 px-4 py-1.5 rounded-full text-[10px] tracking-widest font-bold uppercase shadow-[0_0_20px_rgba(6,182,212,0.5)]">
            HYPOTHERMIA CRITICAL // TEETH CHATTERING // SEEK CABIN FIREPLACE
          </div>
        </div>
      )}

      {/* 2. UV Blacklight Purple Glow Ambiance */}
      {flashlight.isUVMode && flashlight.enabled && (
        <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.7)_0%,transparent_80%)]" />
      )}

      {/* 3. Lean indicator corner shifts */}
      {activeLean && (
        <div className="absolute top-1/2 left-8 -translate-y-1/2 bg-black/50 border border-zinc-700 px-2 py-1 rounded text-[10px] text-zinc-400">
          PEEKING {activeLean.toUpperCase()}
        </div>
      )}

      {/* 4. VHS / Camcorder Scanlines & Noise */}
      <div
        id="vhs-scanlines"
        className="pointer-events-none absolute inset-0 opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.6)_50%)] bg-[length:100%_4px]"
      />

      {/* 5. Top Camcorder HUD Info */}
      <div className="hud-top-info absolute top-5 left-6 right-6 flex items-start justify-between">
        {/* REC Indicator, EMF Detector & Real Survival Vitals */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="h-3 w-3 rounded-full bg-red-600 animate-ping" />
            <span className="text-sm font-bold tracking-widest text-red-500">REC</span>
            <span className="text-xs text-zinc-400 tracking-wider hidden sm:inline">BLACKWOOD PINES // TRAIL-01</span>
          </div>

          {/* EMF Walkie-Talkie Detector Widget */}
          <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md border border-zinc-800 px-3 py-1.5 rounded-lg">
            <Radio className={`h-3.5 w-3.5 ${emfLevel > 0 ? 'text-amber-400 animate-pulse' : 'text-zinc-500'}`} />
            <span className="text-[10px] tracking-wider text-zinc-400 font-bold">EMF SIGNAL:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <span
                  key={lvl}
                  className={`h-2.5 w-1.5 rounded-xs transition-colors duration-150 ${
                    lvl <= emfLevel
                      ? lvl >= 4
                        ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                        : lvl >= 3
                        ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                        : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                      : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
            {emfLevel >= 3 && (
              <span className="text-[10px] text-red-400 font-bold animate-pulse">INTERFERENCE</span>
            )}
          </div>

          {/* Creature hearing sensor: intensity combines movement noise and proximity. */}
          <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md border border-zinc-800 px-3 py-1.5 rounded-lg min-w-[172px]">
            <Radio className={`h-3.5 w-3.5 ${hearingColor === 'red' ? 'text-red-500 animate-pulse' : hearingColor === 'yellow' ? 'text-amber-400' : 'text-emerald-400'}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] tracking-wider text-zinc-400 font-bold">HEARING</span>
                <span className={`text-[9px] font-bold ${hearingColor === 'red' ? 'text-red-400' : hearingColor === 'yellow' ? 'text-amber-300' : 'text-emerald-300'}`}>
                  {hearingLabel}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-sm bg-zinc-800">
                <div
                  className={`h-full transition-[width,background-color] duration-150 ${hearingColor === 'red' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : hearingColor === 'yellow' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.65)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.55)]'}`}
                  style={{ width: `${hearingLevel}%` }}
                />
              </div>
            </div>
          </div>

          {/* Real Physiological & Ambient Survival Vitals */}
          {vitals && (
            <div className="flex items-center gap-2.5 bg-black/70 backdrop-blur-md border border-zinc-800 px-3 py-1.5 rounded-lg text-xs">
              <div className="flex items-center gap-1.5" title="Core Body Temperature (Warm by Fireplace)">
                <Thermometer className={`h-3.5 w-3.5 ${vitals.isShivering ? 'text-cyan-400 animate-pulse' : vitals.bodyTemp < 60 ? 'text-amber-400' : 'text-emerald-400'}`} />
                <span className="text-[10px] text-zinc-400 font-bold">CORE:</span>
                <span className={`text-[11px] font-bold ${vitals.isShivering ? 'text-cyan-300' : 'text-zinc-200'}`}>
                  {(34.0 + (vitals.bodyTemp / 100) * 3.0).toFixed(1)}°C
                </span>
              </div>

              <div className="h-3 w-px bg-zinc-800" />

              <div className="flex items-center gap-1.5" title="Mountain Wind Vector (Creature tracks scent upwind)">
                <Wind className="h-3.5 w-3.5 text-sky-400" />
                <span className="text-[10px] text-zinc-400 font-bold">WIND:</span>
                <span className="text-[11px] text-sky-200 font-bold">
                  {vitals.windHeading} {vitals.windSpeedMph} MPH
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Battery & Flashlight HUD */}
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-sm border border-zinc-800/80 px-4 py-2 rounded-lg pointer-events-auto">
          {/* Tap Loose Flashlight Casing Button */}
          {(flashlight.isFlickering || isFlashlightTappable) && (
            <button
              id="tap-casing-btn"
              onClick={onTapFlashlight}
              disabled={isDying}
              title="Strike flashlight casing to fix loose battery contact [F]"
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded bg-amber-500 hover:bg-amber-400 text-black animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.7)] cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5 fill-black" />
              <span>TAP CASING [F]</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <Battery
              className={`h-5 w-5 ${
                flashlight.battery > 50
                  ? 'text-emerald-400'
                  : flashlight.battery > 20
                  ? 'text-amber-400'
                  : 'text-red-500 animate-pulse'
              }`}
            />
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Torch Power</span>
              <span className="text-xs font-bold">{Math.round(flashlight.battery)}%</span>
            </div>
          </div>

          <div className="h-8 w-px bg-zinc-800" />

          {/* UV Light Toggle */}
          <button
            id="uv-toggle-btn"
            onClick={onToggleUV}
            disabled={isDying}
            title="Toggle UV Blacklight [T]"
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer ${
              flashlight.isUVMode
                ? 'bg-purple-950 border-purple-500 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            <span>UV [T]</span>
          </button>

          <div className="h-8 w-px bg-zinc-800" />

          {/* Spare Batteries */}
          {showMobileReplenish && (
            <div className="flex items-center gap-2">
              <button
                id="reload-battery-btn"
                onClick={onUseBattery}
                disabled={isDying || inventory.batteries <= 0}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border font-bold transition-colors cursor-pointer ${
                  flashlight.battery <= 20
                    ? 'animate-pulse bg-red-600 border-red-200 text-black shadow-[0_0_16px_rgba(239,68,68,0.9)]'
                    : 'animate-pulse bg-amber-400 border-amber-200 text-black shadow-[0_0_14px_rgba(245,158,11,0.85)]'
                }`}
                title="Reload flashlight (R)"
              >
                <BatteryCharging className="h-3.5 w-3.5" />
                <span>RELOAD [R] ({inventory.batteries})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 6. Tactical Objective Guide (Top Left) */}
      <div className="hud-objective absolute top-20 left-6 max-w-xs bg-black/75 backdrop-blur-md border border-zinc-800/90 p-3 rounded-lg text-xs space-y-1.5 pointer-events-auto shadow-2xl">
        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">SURVIVAL DIRECTIVES</span>
        <ul className="space-y-1 text-zinc-300 text-[11px]">
          <li className="flex items-center gap-1.5">
            <span className={inventory.hasKeycard ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
              {inventory.hasKeycard ? '✓' : '○'}
            </span>
            <span className={inventory.hasKeycard ? 'line-through text-zinc-500' : 'text-zinc-200'}>
              Find Ranger Cabin Key (Pickup Truck)
            </span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className={inventory.fuses === 3 ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
              {inventory.fuses === 3 ? '✓' : '○'}
            </span>
            <span className={inventory.fuses === 3 ? 'line-through text-zinc-500' : 'text-zinc-200'}>
              Scavenge 3 Spark Plugs ({inventory.fuses}/3)
            </span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className={inventory.hasFuelCan ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
              {inventory.hasFuelCan ? '✓' : '○'}
            </span>
            <span className={inventory.hasFuelCan ? 'line-through text-zinc-500' : 'text-zinc-200'}>
              Retrieve 5-Gal Diesel Canister (Logging Camp)
            </span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className={inventory.isRadioRepaired ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
              {inventory.isRadioRepaired ? '✓' : '○'}
            </span>
            <span className={inventory.isRadioRepaired ? 'line-through text-zinc-500' : 'text-zinc-400'}>
              Optional: Repair Ham Radio (Vacuum Tube)
            </span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className={isPowerRestored ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
              {isPowerRestored ? '✓' : '○'}
            </span>
            <span className={isPowerRestored ? 'line-through text-zinc-500' : 'text-zinc-200'}>
              Prime & Crank Generator (Needs Plugs & Fuel)
            </span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className={isPowerRestored ? 'text-amber-400 animate-pulse font-bold' : 'text-zinc-600'}>
              {isPowerRestored ? '▶' : '○'}
            </span>
            <span className={isPowerRestored ? 'text-amber-300 font-bold animate-pulse' : 'text-zinc-600'}>
              Escape South Highway Gate
            </span>
          </li>
        </ul>
      </div>

      {/* 7. Center Reticle & Interactive Prompt */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {/* Crosshair dot */}
        <div
          className={`h-1.5 w-1.5 rounded-full transition-transform duration-150 ${
            prompt ? 'bg-amber-400 scale-150 ring-4 ring-amber-400/30' : 'bg-white/60'
          }`}
        />

        {/* Interaction Prompt Box */}
        {prompt && (
          <div
            id="interaction-prompt-pill"
            className={`mt-6 flex items-center gap-2.5 backdrop-blur-md px-4 py-2 rounded-full text-xs font-semibold tracking-wide shadow-xl animate-fade-in pointer-events-auto cursor-pointer ${
              hasInteractionPrompt
                ? 'bg-amber-500 border-2 border-amber-200 px-6 py-3 text-sm font-black text-black shadow-[0_0_28px_rgba(245,158,11,0.9)]'
                : 'bg-black/85 border border-amber-500/60 text-amber-300'
            }`}
            onClick={isDying ? undefined : onInteract}
          >
            <Eye className={`h-4 w-4 animate-pulse ${hasInteractionPrompt ? 'text-black' : 'text-amber-400'}`} />
            <span>{isPickupHoodPrompt ? 'OPEN HOOD [E]' : prompt}</span>
          </div>
        )}
      </div>

      {/* 8. Bottom Bar: Inventory items & Survival Gear */}
      <div className="hud-bottom-bar absolute bottom-6 left-6 right-6 flex items-end justify-between">
        {/* Inventory Tray */}
        <div className="hud-inventory flex items-center gap-2 bg-black/80 backdrop-blur-md border border-zinc-800/80 p-2 rounded-xl pointer-events-auto overflow-x-auto max-w-[70vw]">
          {/* Spark Plugs slot */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
            <Zap className={`h-4 w-4 ${inventory.fuses > 0 ? 'text-amber-400' : 'text-zinc-600'}`} />
            <div className="flex flex-col text-[9px]">
              <span className="text-zinc-400">PLUGS</span>
              <span className="font-bold text-white">{inventory.fuses} / 3</span>
            </div>
          </div>

          {/* Diesel Fuel Can slot */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
            <Fuel className={`h-4 w-4 ${inventory.hasFuelCan ? 'text-amber-400' : 'text-zinc-600'}`} />
            <div className="flex flex-col text-[9px]">
              <span className="text-zinc-400">DIESEL</span>
              <span className={`font-bold ${inventory.hasFuelCan ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {inventory.hasFuelCan ? '5-GAL' : 'NONE'}
              </span>
            </div>
          </div>

          {/* Keycard slot */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
            <Key className={`h-4 w-4 ${inventory.hasKeycard ? 'text-amber-400' : 'text-zinc-600'}`} />
            <div className="flex flex-col text-[9px]">
              <span className="text-zinc-400">KEY</span>
              <span className={`font-bold ${inventory.hasKeycard ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {inventory.hasKeycard ? 'CABIN' : 'NONE'}
              </span>
            </div>
          </div>

          {/* Radio Tube / Ham Radio slot */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
            <Radio className={`h-4 w-4 ${inventory.isRadioRepaired ? 'text-emerald-400' : inventory.hasRadioTube ? 'text-amber-400' : 'text-zinc-600'}`} />
            <div className="flex flex-col text-[9px]">
              <span className="text-zinc-400">RADIO</span>
              <span className={`font-bold ${inventory.isRadioRepaired ? 'text-emerald-400' : inventory.hasRadioTube ? 'text-amber-300' : 'text-zinc-500'}`}>
                {inventory.isRadioRepaired ? 'ONLINE' : inventory.hasRadioTube ? 'TUBE' : 'DEAD'}
              </span>
            </div>
          </div>

          {/* Bottles slot (Sound Distraction) */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
            <Wine className={`h-4 w-4 ${inventory.bottles > 0 ? 'text-emerald-400' : 'text-zinc-600'}`} />
            <div className="flex flex-col text-[9px]">
              <span className="text-zinc-400">BOTTLE [G]</span>
              <span className="font-bold text-white">{inventory.bottles}</span>
            </div>
          </div>

          {/* Flare slot (Creature Repellent) */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
            <Flame className={`h-4 w-4 ${inventory.flares > 0 ? 'text-orange-400' : 'text-zinc-600'}`} />
            <div className="flex flex-col text-[9px]">
              <span className="text-zinc-400">FLARE [X]</span>
              <span className="font-bold text-white">{inventory.flares}</span>
            </div>
          </div>

          {/* Map Sheet slot */}
          <button
            id="hud-map-btn"
            onClick={onOpenMap}
            disabled={isDying}
            title="Open Facility Map [M]"
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 cursor-pointer transition-colors shrink-0"
          >
            <Map className="h-4 w-4 text-sky-400" />
            <div className="flex flex-col text-[9px] text-left">
              <span className="text-zinc-400">MAP</span>
              <span className="font-bold text-sky-300">[M]</span>
            </div>
          </button>

          {/* Notes slot */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
            <FileText className="h-4 w-4 text-sky-400" />
            <div className="flex flex-col text-[9px]">
              <span className="text-zinc-400">LOGS</span>
              <span className="font-bold text-white">{inventory.notesRead.length} / 5</span>
            </div>
          </div>
        </div>

        {/* Quick Touch Controls for Mobile/Trackpad */}
        <div className="hud-quick-controls flex items-center gap-2 pointer-events-auto">
          <button
            id="hud-flashlight-btn"
            onClick={onToggleFlashlight}
            disabled={isDying}
            className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              flashlight.enabled
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
            }`}
          >
            LIGHT [F]
          </button>
          {inventory.bottles > 0 && (
            <button
              id="hud-throw-btn"
              onClick={onThrowBottle}
              disabled={isDying}
              className="px-3 py-2 rounded-lg border border-emerald-600 bg-emerald-950/60 text-emerald-300 text-xs font-semibold cursor-pointer transition-all"
            >
              THROW [G]
            </button>
          )}
          {inventory.flares > 0 && (
            <button
              id="hud-flare-btn"
              onClick={onUseFlare}
              disabled={isDying}
              className="px-3 py-2 rounded-lg border border-orange-600 bg-orange-950/60 text-orange-300 text-xs font-semibold cursor-pointer transition-all"
            >
              FLARE [X]
            </button>
          )}
          <button
            id="hud-sprint-btn"
            onPointerDown={() => onHoldSprint?.(true)}
            onPointerUp={() => onHoldSprint?.(false)}
            onPointerCancel={() => onHoldSprint?.(false)}
            onPointerLeave={() => onHoldSprint?.(false)}
            disabled={isDying}
            className="px-3 py-2 rounded-lg border border-amber-600 bg-amber-950/60 text-amber-300 text-xs font-semibold cursor-pointer transition-all select-none"
          >
            SPRINT [SHIFT]
          </button>
          <button
            id="hud-crouch-btn"
            onClick={onToggleCrouch}
            disabled={isDying}
            className={`px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
              isCrouching
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
            }`}
          >
            CROUCH [C]
          </button>
          <button
            id="hud-breath-btn"
            onMouseDown={() => onHoldBreath?.(true)}
            onMouseUp={() => onHoldBreath?.(false)}
            onMouseLeave={() => onHoldBreath?.(false)}
            onTouchStart={() => onHoldBreath?.(true)}
            onTouchEnd={() => onHoldBreath?.(false)}
            disabled={isDying}
            title="Hold to stifle breathing & suppress cold air vapor [ALT / H]"
            className={`px-3 py-2 rounded-lg border text-xs font-semibold select-none cursor-pointer transition-all flex items-center gap-1.5 ${
              isHoldingBreath
                ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.4)] ring-1 ring-cyan-400'
                : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
            }`}
          >
            <Wind className={`h-3.5 w-3.5 ${isHoldingBreath ? 'text-cyan-300 animate-pulse' : 'text-zinc-400'}`} />
            <span>BREATH [ALT/H]</span>
          </button>
          <button
            id="hud-jump-btn"
            onClick={onJump}
            disabled={isDying}
            className="px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer transition-all"
          >
            JUMP [SPACE]
          </button>
          <button
            id="hud-interact-btn"
            onClick={onInteract}
            disabled={isDying}
            className={`px-4 py-2 rounded-lg font-bold text-xs shadow-lg transition-all cursor-pointer ${
              hasInteractionPrompt
                ? 'bg-amber-400 hover:bg-amber-300 text-black border-2 border-amber-100 shadow-[0_0_18px_rgba(245,158,11,0.85)] animate-pulse'
                : 'bg-zinc-100 hover:bg-white text-black'
            }`}
          >
            {isPickupHoodPrompt ? 'OPEN HOOD [E]' : 'ACTION [E]'}
          </button>
          {showMobileReplenish && (
            <button
              id="mobile-reload-btn"
              onClick={onUseBattery}
              disabled={isDying || inventory.batteries <= 0}
              aria-label={`Reload flashlight (${inventory.batteries} spare batteries)`}
              title={`Reload flashlight (${inventory.batteries} spare batteries)`}
              className={`mobile-reload-button animate-pulse items-center justify-center gap-1.5 rounded-lg border-2 px-3 py-2 text-xs font-black text-black shadow-lg transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 ${
                flashlight.battery <= 20
                  ? 'border-red-200 bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.95)]'
                  : 'border-amber-200 bg-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.9)]'
              }`}
            >
              <BatteryCharging className="h-4 w-4" />
              <span>RELOAD</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile movement pad */}
      <div className="mobile-control-pad pointer-events-auto absolute bottom-5 left-5">
        <div className="relative h-32 w-32 rounded-full border border-zinc-600/80 bg-black/55 shadow-2xl backdrop-blur-sm">
          <button aria-label="Move forward" className="absolute left-11 top-2 h-10 w-10 rounded-full border border-zinc-500 bg-zinc-800/80 text-lg text-zinc-200 active:bg-emerald-700" onPointerDown={() => onVirtualMove?.(true, false, false, false)} onPointerUp={() => onVirtualMove?.(false, false, false, false)} onPointerCancel={() => onVirtualMove?.(false, false, false, false)}>^</button>
          <button aria-label="Move left" className="absolute left-2 top-11 h-10 w-10 rounded-full border border-zinc-500 bg-zinc-800/80 text-lg text-zinc-200 active:bg-emerald-700" onPointerDown={() => onVirtualMove?.(false, false, true, false)} onPointerUp={() => onVirtualMove?.(false, false, false, false)} onPointerCancel={() => onVirtualMove?.(false, false, false, false)}>&lt;</button>
          <button aria-label="Move right" className="absolute right-2 top-11 h-10 w-10 rounded-full border border-zinc-500 bg-zinc-800/80 text-lg text-zinc-200 active:bg-emerald-700" onPointerDown={() => onVirtualMove?.(false, false, false, true)} onPointerUp={() => onVirtualMove?.(false, false, false, false)} onPointerCancel={() => onVirtualMove?.(false, false, false, false)}>&gt;</button>
          <button aria-label="Move backward" className="absolute bottom-2 left-11 h-10 w-10 rounded-full border border-zinc-500 bg-zinc-800/80 text-lg text-zinc-200 active:bg-emerald-700" onPointerDown={() => onVirtualMove?.(false, true, false, false)} onPointerUp={() => onVirtualMove?.(false, false, false, false)} onPointerCancel={() => onVirtualMove?.(false, false, false, false)}>v</button>
        </div>
      </div>

      {/* 9. Sprint Stamina & Breath Oxygen Meters */}
      <div className="hud-meters absolute bottom-20 left-6 w-56 pointer-events-auto flex flex-col gap-1.5">
        {/* Breath Holding Oxygen Meter */}
        {isHoldingBreath ? (
          <div className="flex flex-col gap-1 bg-black/80 backdrop-blur-md p-2 rounded-lg border border-cyan-500/50 shadow-lg">
            <div className="flex justify-between items-center text-[9px] font-bold text-cyan-300 tracking-wider">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                HOLDING BREATH (SILENT)
              </span>
              <span>{Math.round(breathHoldRatio * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
              <div
                className={`h-full transition-all duration-75 ${
                  breathHoldRatio > 0.35 ? 'bg-cyan-400' : 'bg-red-500 animate-pulse'
                }`}
                style={{ width: `${Math.max(0, breathHoldRatio * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          distanceToMonster < 16 && (
            <div className="text-[9px] px-2 py-1 rounded bg-zinc-900/90 border border-cyan-500/40 text-cyan-300 flex items-center justify-between">
              <span>PROXIMITY ALERT</span>
              <span className="font-bold text-cyan-200">[HOLD ALT] Mute Breath</span>
            </div>
          )
        )}

        {isCrouching && (
          <div className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-600/60 text-emerald-300 font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>STEALTH CROUCH // FOOTSTEPS MUTED</span>
          </div>
        )}

        {showStamina && (
          <div className="stamina-meter flex flex-col gap-1 rounded-lg border border-zinc-700/80 bg-black/80 p-2 shadow-lg backdrop-blur-md">
            <div className="flex justify-between text-[10px] text-zinc-400 font-bold">
              <span>STAMINA (SHIFT)</span>
              <span>{Math.round(stamina)}%</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  stamina > 40 ? 'bg-zinc-300' : stamina > 15 ? 'bg-amber-500' : 'bg-red-500 animate-pulse'
                }`}
                style={{ width: `${stamina}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
