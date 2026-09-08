import React, { useEffect, useState } from 'react';
import {
  Volume2,
  ShieldAlert,
  Compass,
  Play,
  MapPin,
  Sliders,
  Keyboard,
  BookOpen,
  Skull,
  Shield,
  Zap,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Chapter, GAME_CHAPTERS, GameSettings } from '../types';
import { horrorAudio } from '../audio/horrorAudio';

interface TitleScreenProps {
  onStartGame: (chapterId?: number) => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

type MenuTab = 'play' | 'chapters' | 'dossier' | 'map' | 'controls' | 'settings';

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<MenuTab>('play');
  const [selectedChapterId, setSelectedChapterId] = useState<number>(1);

  const handleTabChange = (tab: MenuTab) => {
    horrorAudio.playMenuSelect();
    setActiveTab(tab);
  };

  const handleStart = (chapId?: number) => {
    horrorAudio.playMenuSelect();
    onStartGame(chapId ?? selectedChapterId);
  };

  const handleHover = () => {
    horrorAudio.playMenuHover();
  };

  useEffect(() => {
    const handleTitleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code === 'Enter') {
        event.preventDefault();
        handleStart();
      } else if (event.code === 'Tab') {
        event.preventDefault();
        handleTabChange('dossier');
      }
    };

    window.addEventListener('keydown', handleTitleKeyDown);
    return () => window.removeEventListener('keydown', handleTitleKeyDown);
  }, [selectedChapterId]);

  const currentChapter = GAME_CHAPTERS.find((c) => c.id === selectedChapterId) || GAME_CHAPTERS[0];

  return (
    <div
      id="title-screen"
      className="fixed inset-0 z-40 flex flex-col justify-between bg-black select-none font-mono text-white p-4 sm:p-8 overflow-y-auto"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at center top, rgba(15, 23, 42, 0.75) 0%, rgba(5, 10, 15, 0.95) 60%, rgba(2, 4, 8, 1) 100%)',
      }}
    >
      {/* Dynamic Animated Fog and Storm Ambience Gradients */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.25)_0%,transparent_60%)]" />
      <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.2)_0%,transparent_60%)]" />

      {/* Cinematic 35mm Scanline / Film Grain Texture */}
      {settings.filmGrain && (
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.6)_50%)] bg-[length:100%_4px]" />
      )}

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            <ShieldAlert className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] tracking-widest text-emerald-400 font-bold uppercase">
              US FORESTRY SERVICE // SECTOR 4 QUARANTINE
            </div>
            <div className="text-xs text-zinc-400 font-medium">
              BLACKWOOD PINES NATIONAL PARK // EPISODIC SURVIVAL OPERATION
            </div>
          </div>
        </div>

        {/* Spatial Audio Advisory Badge */}
        <div className="flex items-center gap-2.5 bg-zinc-900/90 border border-zinc-800 px-3.5 py-1.5 rounded-full text-xs text-zinc-300 shadow-sm">
          <Volume2 className="h-4 w-4 text-emerald-400 animate-pulse shrink-0" />
          <span className="text-[11px] tracking-wide">3D SPATIAL AUDIO ACTIVE // HEADPHONES RECOMMENDED</span>
        </div>
      </header>

      {/* Main Center Content Container */}
      <main className="relative z-10 w-full max-w-6xl mx-auto my-auto py-6 flex flex-col items-center">
        {/* Title Presentation */}
        <div className="text-center mb-6">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-widest text-zinc-100 uppercase drop-shadow-[0_4px_24px_rgba(16,185,129,0.25)]">
            BLACKWOOD PINES
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto tracking-wider font-sans">
            A photorealistic episodic survival horror simulation. Evade the antlered stalker, restore the mountain power grid, and escape.
          </p>
        </div>

        {/* Cinematic Navigation Tabs */}
        <nav className="flex flex-wrap items-center justify-center gap-2 mb-6 bg-zinc-950/80 border border-zinc-800/90 p-1.5 rounded-xl shadow-lg">
          {[
            { id: 'play', label: 'DEPLOYMENT', icon: Play },
            { id: 'chapters', label: 'CHAPTERS', icon: Layers },
            { id: 'dossier', label: 'SURVIVAL DOSSIER', icon: BookOpen },
            { id: 'map', label: 'FOREST MAP', icon: Compass },
            { id: 'controls', label: 'CONTROLS', icon: Keyboard },
            { id: 'settings', label: 'FIELD SETTINGS', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as MenuTab)}
                onMouseEnter={handleHover}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-900/60 border border-emerald-500/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-transparent border border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab Content Display */}
        <div className="w-full max-w-4xl bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md min-h-[400px] flex flex-col justify-between">
          {/* TAB 1: PLAY / DEPLOYMENT */}
          {activeTab === 'play' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Selected Chapter Banner */}
              <div className="bg-zinc-900/70 border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <Layers className="h-3.5 w-3.5" />
                    <span>STARTING POINT: {currentChapter.numberString}</span>
                  </div>
                  <h3 className="text-sm font-bold text-zinc-100">{currentChapter.title}</h3>
                  <p className="text-[11px] text-zinc-400 font-sans">{currentChapter.objective}</p>
                </div>
                <button
                  onClick={() => handleTabChange('chapters')}
                  onMouseEnter={handleHover}
                  className="self-start sm:self-center px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <span>CHANGE CHAPTER</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div>
                <div className="text-xs text-emerald-400 font-bold tracking-wider uppercase mb-1">
                  OPERATION READINESS // SELECT THREAT DIFFICULTY
                </div>
                <p className="text-xs text-zinc-400">
                  Choose the threat parameters of the anomaly before descending into the woods.
                </p>
              </div>

              {/* Difficulty Cards */}
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'story',
                    title: 'RANGER INVESTIGATION',
                    badge: 'STORY',
                    desc: 'Reduced creature stalk speed, muted branch snapping, and faster stamina recovery. Focus on exploration and lore.',
                  },
                  {
                    id: 'normal',
                    title: 'BLACKWOOD EXPEDITION',
                    badge: 'STANDARD',
                    desc: 'Authentic wilderness survival. Creature reacts to footstep vibrations, dynamic night storms, and realistic endurance.',
                  },
                  {
                    id: 'nightmare',
                    title: 'NOCTURNAL NIGHTMARE',
                    badge: 'LETHAL',
                    desc: 'Hyper-sensitive predator hearing, volatile diesel stalls, accelerated battery drain, and lethal stalker aggression.',
                  },
                ].map((diff) => {
                  const isSelected = settings.difficulty === diff.id;
                  return (
                    <div
                      key={diff.id}
                      onClick={() => {
                        horrorAudio.playMenuSelect();
                        onUpdateSettings({ difficulty: diff.id as any });
                      }}
                      onMouseEnter={handleHover}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-zinc-900 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/50'
                          : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/70'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              isSelected
                                ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                            }`}
                          >
                            {diff.badge}
                          </span>
                          {isSelected && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />}
                        </div>
                        <h3 className="text-sm font-bold text-zinc-100">{diff.title}</h3>
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">{diff.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Deployment Action Button */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800/80">
                <div className="text-xs text-zinc-400">
                  <span className="text-emerald-400 font-bold">STATUS:</span> Field equipment calibrated. Ready to enter wilderness.
                </div>
                <button
                  id="start-game-btn"
                  onClick={() => handleStart()}
                  onMouseEnter={handleHover}
                  className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-3 px-10 py-4 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold text-sm tracking-widest uppercase rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all transform hover:scale-[1.02] cursor-pointer"
                >
                  <Play className="h-5 w-5 fill-current transition-transform group-hover:translate-x-0.5" />
                  <span>COMMENCE EXPEDITION</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CHAPTERS SELECTION */}
          {activeTab === 'chapters' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <div className="text-xs text-emerald-400 font-bold tracking-wider uppercase mb-1">
                  EPISODIC CHAPTER CAMPAIGN // SELECT EXPEDITION PHASE
                </div>
                <p className="text-xs text-zinc-400">
                  Experience the full expedition sequence or deploy directly into specific operation phases with matching gear.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {GAME_CHAPTERS.map((chap) => {
                  const isSelected = selectedChapterId === chap.id;
                  return (
                    <div
                      key={chap.id}
                      onClick={() => {
                        horrorAudio.playMenuSelect();
                        setSelectedChapterId(chap.id);
                      }}
                      onMouseEnter={handleHover}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-zinc-900 border-emerald-500 ring-1 ring-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                          : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/70'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              isSelected
                                ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                            }`}
                          >
                            {chap.numberString}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-sans">{chap.location}</span>
                        </div>
                        <h4 className="text-sm font-bold text-zinc-100">{chap.title}</h4>
                        <p className="text-[11px] text-zinc-400 font-sans leading-relaxed line-clamp-3">
                          {chap.briefing}
                        </p>
                        <div className="pt-2 border-t border-zinc-800/80 text-[10px] text-emerald-300">
                          <strong>DIRECTIVE: </strong> {chap.objective}
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-zinc-800/60 flex items-center justify-between">
                        <span className="text-[11px] text-zinc-400">
                          {isSelected ? 'Ready for deployment' : 'Click to select'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStart(chap.id);
                          }}
                          onMouseEnter={handleHover}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-bold tracking-wider uppercase transition-colors cursor-pointer"
                        >
                          LAUNCH CHAPTER
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SURVIVAL DOSSIER */}
          {activeTab === 'dossier' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <div className="text-xs text-red-400 font-bold tracking-wider uppercase mb-1">
                  ANOMALOUS THREAT REPORT // SPECIMEN 09
                </div>
                <p className="text-xs text-zinc-400">
                  Declassified ranger field notes detailing the hostile entity occupying the Blackwood pines.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                {/* Creature Profile */}
                <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 font-bold text-red-400">
                    <Skull className="h-4 w-4" />
                    <span>THE ANTLERED STALKER ("WENDIGO")</span>
                  </div>
                  <ul className="space-y-2 text-zinc-300 font-sans text-[11px] leading-relaxed">
                    <li className="flex items-start gap-1.5">
                      <span className="text-red-400 font-bold">•</span>
                      <span><strong className="text-white">Acoustic Sensitivity:</strong> Heavy sprinting snaps dry pine branches and alerts the entity across 14 meters. Sneak with [C] to dampen footfalls.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-red-400 font-bold">•</span>
                      <span><strong className="text-white">Tapetum Lucidum:</strong> Direct flashlight beams illuminate its predatory retinas with an unearthly reflection before it charges.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-red-400 font-bold">•</span>
                      <span><strong className="text-white">Magnesium Aversion:</strong> The creature will retreat when confronted with high-heat magnesium flares [X].</span>
                    </li>
                  </ul>
                </div>

                {/* Primary Evacuation Checklist */}
                <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 font-bold text-amber-400">
                    <Zap className="h-4 w-4" />
                    <span>FIELD EVACUATION PROTOCOL</span>
                  </div>
                  <ol className="space-y-2 text-zinc-300 font-sans text-[11px] leading-relaxed list-decimal list-inside">
                    <li><strong className="text-white">Ranger Key:</strong> Inspect the stalled pickup truck at the North trail head.</li>
                    <li><strong className="text-white">Spark Plugs:</strong> Scavenge 3 plugs hidden in forest workbenches and shacks.</li>
                    <li><strong className="text-white">Diesel Fuel:</strong> Retrieve the 5-gallon fuel can from the logging camp.</li>
                    <li><strong className="text-white">Grid Restoration:</strong> Fuel, plug, and prime the heavy Caterpillar generator.</li>
                    <li><strong className="text-white">Highway Gate:</strong> Release the magnetic South Gate lock to escape.</li>
                  </ol>
                </div>
              </div>

              {/* Survival Tactics */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-xl flex flex-wrap gap-4 text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <span><strong>Hunting Blinds [E]:</strong> Fully conceals you from creature patrol lines.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span><strong>UV Light [T]:</strong> Reveals hidden occult blood markings on ancient bark.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FOREST MAP */}
          {activeTab === 'map' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <div className="text-xs text-emerald-400 font-bold tracking-wider uppercase mb-1">
                  TOPOGRAPHIC SECTOR RECONNAISSANCE
                </div>
                <p className="text-xs text-zinc-400">
                  Park layout overview indicating verified safe shelters, power nodes, and evacuation points.
                </p>
              </div>

              {/* Stylized Tactical Map Graphic */}
              <div className="relative w-full h-56 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />

                <div className="relative w-full h-full text-[10px] font-mono">
                  <div className="absolute top-4 right-1/4 flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/60 px-2 py-1 rounded text-emerald-300">
                    <MapPin className="h-3 w-3" />
                    <span>RANGER CABIN (NORTH)</span>
                  </div>

                  <div className="absolute top-6 left-1/6 flex items-center gap-1.5 bg-purple-950/80 border border-purple-500/60 px-2 py-1 rounded text-purple-300">
                    <MapPin className="h-3 w-3" />
                    <span>ANCIENT MONOLITHS</span>
                  </div>

                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-zinc-950 border border-zinc-700 px-2 py-1 rounded text-zinc-300">
                    <Compass className="h-3 w-3 text-amber-400" />
                    <span>CENTRAL TRAIL FORK</span>
                  </div>

                  <div className="absolute bottom-16 left-12 flex items-center gap-1.5 bg-amber-950/80 border border-amber-500/60 px-2 py-1 rounded text-amber-300">
                    <MapPin className="h-3 w-3" />
                    <span>LOGGING CAMP (WEST)</span>
                  </div>

                  <div className="absolute bottom-16 right-16 flex items-center gap-1.5 bg-amber-950/80 border border-amber-500/60 px-2 py-1 rounded text-amber-300">
                    <Zap className="h-3 w-3 text-amber-400" />
                    <span>DIESEL GENERATOR</span>
                  </div>

                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-red-950/80 border border-red-500/60 px-2 py-1 rounded text-red-300">
                    <ShieldAlert className="h-3 w-3" />
                    <span>HIGHWAY ESCAPE GATE (SOUTH)</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-zinc-400 font-sans">
                Tip: Press <span className="text-white font-mono bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">[M]</span> during the game to open your active compass-oriented field map.
              </div>
            </div>
          )}

          {/* TAB 5: CONTROLS */}
          {activeTab === 'controls' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <div className="text-xs text-emerald-400 font-bold tracking-wider uppercase mb-1">
                  OPERATIVE TACTICAL CONTROLS
                </div>
                <p className="text-xs text-zinc-400">
                  Review complete keyboard and mouse bindings for movement, evasion, and survival.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {[
                  { key: 'W, A, S, D', label: 'Navigate Wilderness' },
                  { key: 'Mouse', label: 'Look & Aim Light' },
                  { key: 'Shift (Hold)', label: 'Sprint (Noisy)' },
                  { key: 'C / Ctrl', label: 'Stealth Crouch (Mutes Sound)' },
                  { key: 'Space', label: 'Jump Obstacle' },
                  { key: 'Q / E', label: 'Lean Corners' },
                  { key: 'F', label: 'Tactical Flashlight' },
                  { key: 'T', label: 'UV Blacklight' },
                  { key: 'R', label: 'Install Battery' },
                  { key: 'G', label: 'Hurl Glass Bottle' },
                  { key: 'X', label: 'Ignite Flare' },
                  { key: 'E', label: 'Interact / Hide in Blind' },
                  { key: 'M', label: 'Forest Trail Map' },
                  { key: 'Tab', label: 'View Lore Dossier' },
                  { key: 'Esc', label: 'Pause / Options' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-zinc-900/70 border border-zinc-800 px-3 py-2 rounded-lg">
                    <span className="text-zinc-400 text-[11px]">{item.label}</span>
                    <span className="font-bold text-white bg-zinc-950 border border-zinc-700 px-1.5 py-0.5 rounded text-[10px]">
                      {item.key}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <div className="text-xs text-emerald-400 font-bold tracking-wider uppercase mb-1">
                  TACTICAL FIELD SETTINGS & AUDIO
                </div>
                <p className="text-xs text-zinc-400">
                  Calibrate your camera response, audio mixing, and visual fidelity filters.
                </p>
              </div>

              <div className="space-y-4 max-w-lg">
                {/* Mouse Sensitivity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300">Look Sensitivity:</span>
                    <span className="text-emerald-400 font-bold">{settings.mouseSensitivity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={settings.mouseSensitivity}
                    onChange={(e) => onUpdateSettings({ mouseSensitivity: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Sound Volume */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300">Master Sound Volume:</span>
                    <span className="text-emerald-400 font-bold">{Math.round(settings.soundVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.soundVolume}
                    onChange={(e) => onUpdateSettings({ soundVolume: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Ambient Atmosphere Volume */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300">Forest Wind & Storm Volume:</span>
                    <span className="text-emerald-400 font-bold">{Math.round(settings.ambientVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.ambientVolume}
                    onChange={(e) => onUpdateSettings({ ambientVolume: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.headBobbing}
                      onChange={(e) => onUpdateSettings({ headBobbing: e.target.checked })}
                      className="rounded accent-emerald-500 cursor-pointer"
                    />
                    <span>Head-Bob Walking Physics</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.filmGrain}
                      onChange={(e) => onUpdateSettings({ filmGrain: e.target.checked })}
                      className="rounded accent-emerald-500 cursor-pointer"
                    />
                    <span>35mm Film Grain / Vignette</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Footer Bar */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-900 pt-3">
        <div>BLACKWOOD PINES // VERSION 2.5.0 CHAPTER ENGINE</div>
        <div>PRESS ENTER OR CLICK COMMENCE TO BEGIN EXPEDITION</div>
      </footer>
    </div>
  );
};
