import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { HorrorEngine } from './game/horrorEngine';
import { HUD } from './components/HUD';
import { TitleScreen } from './components/TitleScreen';
import { PauseMenu } from './components/PauseMenu';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { NoteModal } from './components/NoteModal';
import { CCTVModal } from './components/CCTVModal';
import { MapModal } from './components/MapModal';
import {
  GameState,
  Inventory,
  FlashlightState,
  LoreNote,
  GameSettings,
  Chapter,
  GAME_CHAPTERS,
  SurvivalVitals,
} from './types';
import { horrorAudio } from './audio/horrorAudio';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<HorrorEngine | null>(null);

  // High-level Game State
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [currentChapterId, setCurrentChapterId] = useState<number>(1);
  const [activeChapterCard, setActiveChapterCard] = useState<Chapter | null>(null);
  const [activeNote, setActiveNote] = useState<LoreNote | null>(null);
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [isHiding, setIsHiding] = useState(false);
  const [activeLean, setActiveLean] = useState<'left' | 'right' | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(
    'The woods are quiet... for now. Search the trails for generator spark plugs.'
  );
  const [isDying, setIsDying] = useState<boolean>(false);
  const [showCctv, setShowCctv] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // HUD & Stats
  const [inventory, setInventory] = useState<Inventory>({
    fuses: 0,
    maxFuses: 3,
    hasKeycard: false,
    hasRadioTube: false,
    isRadioRepaired: false,
    hasFuelCan: false,
    isGeneratorFueled: false,
    batteries: 2,
    bottles: 1,
    flares: 1,
    hasMap: false,
    notesRead: [],
  });

  const [flashlight, setFlashlight] = useState<FlashlightState>({
    enabled: true,
    battery: 100,
    isFlickering: false,
    isUVMode: false,
  });

  const [stamina, setStamina] = useState(100);
  const [showStamina, setShowStamina] = useState(false);
  const [isSprinting, setIsSprinting] = useState(false);
  const staminaHideTimerRef = useRef<number | null>(null);
  const [distanceToMonster, setDistanceToMonster] = useState(30);
  const [hearingLevel, setHearingLevel] = useState(0);
  const [hearingColor, setHearingColor] = useState<'red' | 'yellow' | 'green'>('green');
  const [timeSurvivedSeconds, setTimeSurvivedSeconds] = useState(0);
  const [isCrouching, setIsCrouching] = useState(false);
  const [isHoldingBreath, setIsHoldingBreath] = useState(false);
  const [breathHoldRatio, setBreathHoldRatio] = useState(1.0);
  const [survivalVitals, setSurvivalVitals] = useState<SurvivalVitals | undefined>(undefined);
  const [isFlashlightTappable, setIsFlashlightTappable] = useState(false);

  // Game Settings
  const [settings, setSettings] = useState<GameSettings>({
    mouseSensitivity: 1.0,
    soundVolume: 0.8,
    ambientVolume: 0.7,
    difficulty: 'normal',
    headBobbing: true,
    filmGrain: true,
  });

  // Track run time
  useEffect(() => {
    let timer: number;
    if (gameState === 'PLAYING') {
      timer = window.setInterval(() => {
        setTimeSurvivedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (staminaHideTimerRef.current !== null) {
      window.clearTimeout(staminaHideTimerRef.current);
      staminaHideTimerRef.current = null;
    }

    if (!showStamina || isSprinting || stamina < 100) return;

    staminaHideTimerRef.current = window.setTimeout(() => {
      setShowStamina(false);
      staminaHideTimerRef.current = null;
    }, 1500);

    return () => {
      if (staminaHideTimerRef.current !== null) {
        window.clearTimeout(staminaHideTimerRef.current);
        staminaHideTimerRef.current = null;
      }
    };
  }, [isSprinting, showStamina, stamina]);

  const triggerChapterAnnouncement = (chapterId: number) => {
    const chap = GAME_CHAPTERS.find((c) => c.id === chapterId);
    if (!chap) return;
    setActiveChapterCard(chap);
    horrorAudio.playMenuSelect();
    setTimeout(() => {
      setActiveChapterCard((prev) => (prev?.id === chapterId ? null : prev));
    }, 4500);
  };

  // Mount 3D Three.js Engine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new HorrorEngine(containerRef.current);
    engineRef.current = engine;

    // Connect Engine callbacks
    engine.onPromptChange = (p) => setInteractPrompt(p);
    engine.onInventoryChange = (inv) => {
      setInventory(inv);

      // Dynamic Chapter Progression
      setCurrentChapterId((prevId) => {
        if (prevId === 1 && inv.hasKeycard) {
          triggerChapterAnnouncement(2);
          return 2;
        }
        if (prevId === 2 && inv.fuses >= 3) {
          triggerChapterAnnouncement(3);
          return 3;
        }
        return prevId;
      });
    };
    engine.onFlashlightChange = (f) => setFlashlight(f);
    engine.onStaminaChange = (s) => setStamina(s);
    engine.onSprintingChange = (sprinting) => {
      setIsSprinting(sprinting);
      if (sprinting) revealStamina();
    };
    engine.onJump = () => revealStamina();
    engine.onFearChange = (_fr, dist) => {
      setDistanceToMonster(dist);
    };
    engine.onHearingChange = (level) => setHearingLevel(level);
    engine.onHearingColorChange = (color) => setHearingColor(color);
    engine.onHidingChange = (h) => setIsHiding(h);
    engine.onCrouchChange = (c) => setIsCrouching(c);
    engine.onBreathHoldChange = (holding, ratio) => {
      setIsHoldingBreath(holding);
      setBreathHoldRatio(ratio);
    };
    engine.onVitalsChange = (v) => setSurvivalVitals(v);
    engine.onFlashlightTappable = (t) => setIsFlashlightTappable(t);
    engine.onLeanChange = (l) => setActiveLean(l);
    engine.onCctvOpen = () => {
      setShowCctv(true);
      engine.setModalOpen(true);
    };
    engine.onMapOpen = () => {
      setShowMap(true);
      engine.setModalOpen(true);
    };
    engine.onNoteOpen = (note) => {
      setActiveNote(note);
      engine.setModalOpen(true);
    };
    engine.onBannerMessage = (msg) => {
      setBannerMessage(msg);
      // If power restored, advance to Chapter 4
      if (engine.isPowerRestored) {
        setCurrentChapterId((prevId) => {
          if (prevId < 4) {
            triggerChapterAnnouncement(4);
            return 4;
          }
          return prevId;
        });
      }
    };
    engine.onDeathStart = () => setIsDying(true);
    engine.onGameOver = () => {
      setIsDying(false);
      setGameState('GAMEOVER');
      engine.pause();
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    };
    engine.onVictory = () => {
      setGameState('VICTORY');
      engine.pause();
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    };

    // Keyboard Shortcuts for Game State
    let hadPointerLock = false;
    const handlePointerLockChange = () => {
      const hasPointerLock = document.pointerLockElement === engine.renderer.domElement;
      if (hasPointerLock) {
        hadPointerLock = true;
        return;
      }

      if (hadPointerLock && !engine.isModalOpen && !engine.isDying) {
        setGameState((prev) => {
          if (prev !== 'PLAYING') return prev;
          engine.pause();
          return 'PAUSED';
        });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        setGameState((prev) => {
          if (prev === 'PLAYING') {
            engine.pause();
            if (document.pointerLockElement) {
              document.exitPointerLock();
            }
            return 'PAUSED';
          }
          if (prev === 'PAUSED') {
            engine.start();
            try {
              engine.renderer.domElement.requestPointerLock();
            } catch {}
            return 'PLAYING';
          }
          return prev;
        });
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      window.removeEventListener('keydown', handleKeyDown);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Sync settings whenever they change
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.settings = settings;
    }
  }, [settings]);

  // Modal close handlers
  const handleCloseNote = () => {
    setActiveNote(null);
    if (engineRef.current) {
      engineRef.current.setModalOpen(false);
      try {
        engineRef.current.renderer.domElement.requestPointerLock();
      } catch {}
    }
  };

  const handleCloseCctv = () => {
    setShowCctv(false);
    if (engineRef.current) {
      engineRef.current.setModalOpen(false);
      try {
        engineRef.current.renderer.domElement.requestPointerLock();
      } catch {}
    }
  };

  const handleCloseMap = () => {
    setShowMap(false);
    if (engineRef.current) {
      engineRef.current.setModalOpen(false);
      try {
        engineRef.current.renderer.domElement.requestPointerLock();
      } catch {}
    }
  };

  // Update Settings in Engine
  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (engineRef.current) {
        engineRef.current.settings = updated;
      }
      if (newSettings.soundVolume !== undefined) {
        horrorAudio.setMasterVolume(newSettings.soundVolume);
      }
      return updated;
    });
  };

  const revealStamina = () => {
    setShowStamina(true);
    if (staminaHideTimerRef.current !== null) {
      window.clearTimeout(staminaHideTimerRef.current);
      staminaHideTimerRef.current = null;
    }
  };

  // Start game from title with selected chapter
  const handleStartGame = (chapterId: number = 1) => {
    if (!engineRef.current) return;
    setCurrentChapterId(chapterId);
    setTimeSurvivedSeconds(0);
    setActiveNote(null);
    setInteractPrompt(null);
    setShowCctv(false);
    setShowMap(false);
    setIsHiding(false);
    setIsDying(false);
    setActiveLean(null);

    setGameState('PLAYING');
    horrorAudio.init();
    engineRef.current.resetGame(chapterId);
    engineRef.current.start();
    triggerChapterAnnouncement(chapterId);

    try {
      engineRef.current.renderer.domElement.requestPointerLock();
    } catch {
      // Browser may require user gesture on canvas
    }
  };

  // Resume game from pause
  const handleResumeGame = () => {
    if (!engineRef.current) return;
    setGameState('PLAYING');
    engineRef.current.start();
    try {
      engineRef.current.renderer.domElement.requestPointerLock();
    } catch {
      // ignore
    }
  };

  const handlePauseGame = () => {
    if (!engineRef.current || gameState !== 'PLAYING') return;
    engineRef.current.pause();
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    setGameState('PAUSED');
  };

  // Return to Main Menu from Pause
  const handleReturnToMainMenu = () => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    if (engineRef.current) {
      engineRef.current.pause();
    }
    horrorAudio.stopHeartbeat();
    horrorAudio.stopRadioStatic();
    setActiveChapterCard(null);
    setShowCctv(false);
    setShowMap(false);
    setActiveNote(null);
    setGameState('TITLE');
  };

  // Restart current chapter after death or from pause
  const handleRestartGame = () => {
    handleTryAgain();
  };

  const handleTryAgain = () => {
    setCurrentChapterId(1);
    setTimeSurvivedSeconds(0);
    setActiveNote(null);
    setInteractPrompt(null);
    setShowCctv(false);
    setShowMap(false);
    setIsHiding(false);
    setIsDying(false);
    setActiveLean(null);
    engineRef.current.resetGame(1);
    setGameState('PLAYING');
    horrorAudio.init();
    engineRef.current.start();
    triggerChapterAnnouncement(1);

    try {
      engineRef.current.renderer.domElement.requestPointerLock();
    } catch {
      // Browser may require user gesture on canvas
    }
  };

  const activeChapterData =
    GAME_CHAPTERS.find((c) => c.id === currentChapterId) || GAME_CHAPTERS[0];

  return (
    <div id="game-root" className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D WebGL Canvas Mount Container */}
      <div
        id="canvas-container"
        ref={containerRef}
        className="w-full h-full cursor-crosshair"
      />

      {/* Cinematic Chapter Announcement Splash Card */}
      {activeChapterCard && (
        <div
          id="chapter-splash-card"
          className="fixed inset-0 z-30 pointer-events-none flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px] transition-all duration-700 animate-fadeIn"
        >
          <div className="text-center space-y-3 p-6 sm:p-10 max-w-xl mx-auto border-y border-emerald-500/50 bg-zinc-950/85 shadow-[0_0_50px_rgba(16,185,129,0.25)] rounded-lg">
            <div className="text-xs text-emerald-400 font-mono font-bold tracking-[0.3em] uppercase">
              {activeChapterCard.numberString}
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-zinc-100 font-mono tracking-widest uppercase drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              {activeChapterCard.title}
            </h2>
            <div className="text-xs sm:text-sm text-zinc-400 font-sans tracking-wide">
              {activeChapterCard.subtitle}
            </div>
            <div className="pt-3 border-t border-zinc-800/90 text-xs text-emerald-300 font-mono">
              <strong className="text-white">DIRECTIVE: </strong>
              {activeChapterCard.objective}
            </div>
          </div>
        </div>
      )}

      {/* In-Game HUD overlay */}
      {(gameState === 'PLAYING' || isDying) && (
        <HUD
          flashlight={flashlight}
          inventory={inventory}
          stamina={stamina}
          showStamina={showStamina}
          distanceToMonster={distanceToMonster}
          hearingLevel={hearingLevel}
          hearingColor={hearingColor}
          prompt={interactPrompt}
          bannerMessage={bannerMessage}
          isDying={isDying}
          isPowerRestored={engineRef.current?.isPowerRestored ?? false}
          isPlayerHiding={isHiding}
          isCrouching={isCrouching}
          activeLean={activeLean}
          isHoldingBreath={isHoldingBreath}
          breathHoldRatio={breathHoldRatio}
          vitals={survivalVitals}
          isFlashlightTappable={isFlashlightTappable}
          onTapFlashlight={() => engineRef.current?.tapFlashlight()}
          onHoldBreath={(h) => engineRef.current?.setHoldingBreath(h)}
          onToggleFlashlight={() => engineRef.current?.toggleFlashlight()}
          onToggleUV={() => engineRef.current?.toggleUVMode()}
          onUseBattery={() => engineRef.current?.useBattery()}
          onThrowBottle={() => engineRef.current?.throwBottle()}
          onUseFlare={() => engineRef.current?.useFlare()}
          onOpenMap={() => {
            setShowMap(true);
            engineRef.current?.setModalOpen(true);
          }}
          onInteract={() => engineRef.current?.interact()}
          onPause={handlePauseGame}
          onJump={() => {
            engineRef.current?.jump();
          }}
          onToggleCrouch={() => engineRef.current?.toggleCrouch()}
          onHoldSprint={(sprinting) => {
            engineRef.current?.setSprinting(sprinting);
          }}
          onVirtualMove={(f, b, l, r) => engineRef.current?.setVirtualMove(f, b, l, r)}
        />
      )}

      {/* CCTV Security Feed Monitor Modal */}
      {showCctv && (
        <CCTVModal
          creaturePosition={engineRef.current?.creature.position ?? new THREE.Vector3()}
          onClose={handleCloseCctv}
        />
      )}

      {/* Forest Trail Topographic Map Modal */}
      {showMap && (
        <MapModal
          playerPosition={engineRef.current?.playerPosition ?? null}
          hasKeycard={inventory.hasKeycard}
          fusesFound={inventory.fuses}
          isPowerRestored={engineRef.current?.isPowerRestored ?? false}
          onClose={handleCloseMap}
        />
      )}

      {/* Lore Note Reader Modal */}
      {activeNote && (
        <NoteModal
          note={activeNote}
          onClose={handleCloseNote}
        />
      )}

      {/* Title Screen */}
      {gameState === 'TITLE' && (
        <TitleScreen
          onStartGame={handleStartGame}
          settings={settings}
          onUpdateSettings={updateSettings}
        />
      )}

      {/* Pause Menu with Chapter Intel & Main Menu Return */}
      {gameState === 'PAUSED' && (
        <PauseMenu
          onResume={handleResumeGame}
          onRestart={handleRestartGame}
          onMainMenu={handleReturnToMainMenu}
          currentChapter={activeChapterData}
          settings={settings}
          onUpdateSettings={updateSettings}
        />
      )}

      {/* Game Over Screen */}
      {gameState === 'GAMEOVER' && (
        <GameOverModal
          onRetry={handleTryAgain}
          inventory={inventory}
          timeSurvivedSeconds={timeSurvivedSeconds}
          onMainMenu={handleReturnToMainMenu}
        />
      )}

      {/* Victory Screen */}
      {gameState === 'VICTORY' && (
        <VictoryModal
          onPlayAgain={handleTryAgain}
          onBackToMenu={handleReturnToMainMenu}
          inventory={inventory}
          timeTakenSeconds={timeSurvivedSeconds}
        />
      )}
    </div>
  );
}
