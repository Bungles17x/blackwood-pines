import React from 'react';
import { Play, RotateCcw, Volume2, Sliders, X, Home, BookOpen, MapPin, Compass, Save, Download } from 'lucide-react';
import { Chapter, GameSettings } from '../types';
import { horrorAudio } from '../audio/horrorAudio';
import { hasSaveGame, getSaveInfo } from '../utils/saveSystem';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  currentChapter?: Chapter;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onSaveGame?: () => void;
  onLoadGame?: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onMainMenu,
  currentChapter,
  settings,
  onUpdateSettings,
  onSaveGame,
  onLoadGame,
}) => {
  const handleHover = () => {
    horrorAudio.playMenuHover();
  };

  const handleResume = () => {
    horrorAudio.playMenuSelect();
    onResume();
  };

  const handleRestart = () => {
    horrorAudio.playMenuSelect();
    onRestart();
  };

  const handleMainMenu = () => {
    horrorAudio.playMenuSelect();
    onMainMenu();
  };

  return (
    <div
      id="pause-menu"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md select-none font-mono text-white p-4 animate-fade-in"
    >
      <div className="max-w-lg w-full max-h-[calc(100vh-2rem)] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-7 space-y-6 shadow-2xl">
        {/* Header with Title & Close */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-xl font-bold tracking-wider text-zinc-100 uppercase">
              OPERATION PAUSED
            </h2>
          </div>
          <button
            id="close-pause-btn"
            onClick={handleResume}
            onMouseEnter={handleHover}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Chapter Intel Card */}
        {currentChapter && (
          <div className="pause-chapter-intel bg-zinc-900/70 border border-zinc-800 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 tracking-wider uppercase">
                <BookOpen className="h-3.5 w-3.5" />
                <span>{currentChapter.numberString}</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-sans tracking-wide">
                ACTIVE PROGRESSION
              </span>
            </div>
            <h3 className="text-sm font-bold text-zinc-100 tracking-wide">
              {currentChapter.title}
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-sans">
              <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>{currentChapter.location}</span>
            </div>
            <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-300 font-sans">
              <strong className="text-emerald-300 font-mono text-[10px] uppercase">DIRECTIVE: </strong>
              {currentChapter.objective}
            </div>
          </div>
        )}

        {currentChapter && (
          <div className="mobile-pause-objectives border border-emerald-700/60 bg-emerald-950/30 p-4 rounded-xl space-y-2">
            <div className="text-[10px] font-bold tracking-[0.2em] text-emerald-400 uppercase">
              Current Objectives
            </div>
            <div className="text-sm font-bold text-zinc-100">{currentChapter.title}</div>
            <div className="border-t border-emerald-900/70 pt-2 text-xs leading-relaxed text-emerald-100/80">
              {currentChapter.objective}
            </div>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="space-y-2.5">
          <button
            id="resume-btn"
            onClick={handleResume}
            onMouseEnter={handleHover}
            className="w-full flex items-center justify-center gap-2.5 py-3 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold text-sm tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>RESUME EXPEDITION</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              id="restart-btn"
              onClick={handleRestart}
              onMouseEnter={handleHover}
              className="flex items-center justify-center gap-2 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
                <span>RESTART</span>
            </button>

            {/* Menu Button as Requested */}
            <button
              id="menu-btn"
              onClick={handleMainMenu}
              onMouseEnter={handleHover}
              className="flex items-center justify-center gap-2 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <Home className="h-3.5 w-3.5 text-emerald-400" />
              <span>MAIN MENU</span>
            </button>
          </div>

          {/* Save/Load Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              id="save-btn"
              onClick={() => {
                horrorAudio.playMenuSelect();
                onSaveGame?.();
              }}
              onMouseEnter={handleHover}
              className="flex items-center justify-center gap-2 py-2.5 bg-blue-900/50 hover:bg-blue-800/50 border border-blue-800 hover:border-blue-700 text-zinc-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <Save className="h-3.5 w-3.5 text-blue-400" />
              <span>SAVE</span>
            </button>

            <button
              id="load-btn"
              onClick={() => {
                horrorAudio.playMenuSelect();
                onLoadGame?.();
              }}
              onMouseEnter={handleHover}
              disabled={!hasSaveGame()}
              className="flex items-center justify-center gap-2 py-2.5 bg-purple-900/50 hover:bg-purple-800/50 border border-purple-800 hover:border-purple-700 text-zinc-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-3.5 w-3.5 text-purple-400" />
              <span>LOAD</span>
            </button>
          </div>

          {/* Save Game Info */}
          {hasSaveGame() && (
            <div className="text-[10px] text-zinc-500 text-center">
              Save available: {getSaveInfo() ? `${Math.floor(getSaveInfo()!.timeSurvived / 60)}m ${getSaveInfo()!.timeSurvived % 60}s` : 'Unknown'}
            </div>
          )}
        </div>

        {/* Tactical Quick Settings */}
        <div className="pause-settings space-y-3.5 pt-3 border-t border-zinc-900">
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-bold uppercase tracking-wider">
            <Sliders className="h-3.5 w-3.5 text-emerald-400" />
            <span>FIELD CALIBRATION</span>
          </div>

          {/* Mouse Sensitivity */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>LOOK SENSITIVITY</span>
              <span className="text-emerald-400 font-bold">{settings.mouseSensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="2.5"
              step="0.1"
              value={settings.mouseSensitivity}
              onChange={(e) => onUpdateSettings({ mouseSensitivity: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Master Volume */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>AUDIO VOLUME</span>
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

          {/* Head Bobbing toggle */}
          <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
            <span>HEAD-BOB LOCOMOTION</span>
            <button
              onClick={() => onUpdateSettings({ headBobbing: !settings.headBobbing })}
              className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                settings.headBobbing
                  ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}
            >
              {settings.headBobbing ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>

        {/* Controls Cheatsheet */}
        <div className="pause-cheatsheet text-[11px] text-zinc-500 space-y-1 pt-2 border-t border-zinc-900">
          <p>[F] Tactical Light • [T] UV Blacklight • [Shift] Sprint</p>
          <p>[C] Stealth Crouch • [G] Glass Distraction • [X] Flare</p>
        </div>
      </div>
    </div>
  );
};
