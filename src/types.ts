export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY';

export type CreatureState = 'DORMANT' | 'PATROL' | 'INVESTIGATE' | 'STALK' | 'CHASE';

export interface LoreNote {
  id: string;
  title: string;
  date: string;
  author: string;
  body: string;
}

export interface Inventory {
  fuses: number; // Spark plugs found (0-3)
  maxFuses: number;
  hasKeycard: boolean; // Ranger Cabin Mortise Key
  hasRadioTube: boolean; // Glass vacuum tube for ham radio
  isRadioRepaired: boolean; // Ham radio online & broadcast heard
  hasFuelCan: boolean; // 5-gallon diesel fuel can
  isGeneratorFueled: boolean; // Diesel poured into generator
  batteries: number;
  bottles: number;
  flares: number;
  hasMap: boolean;
  notesRead: string[];
}

export interface FlashlightState {
  enabled: boolean;
  battery: number; // 0 - 100
  isFlickering: boolean;
  isUVMode: boolean; // UV Blacklight mode
}

export interface GameStats {
  timeSurvivedSeconds: number;
  fusesFound: number;
  batteriesUsed: number;
  distanceTraveledMeters: number;
  chasesEscaped: number;
}

export interface SurvivalVitals {
  bodyTemp: number; // 0 - 100%
  isShivering: boolean;
  windHeading: string;
  windSpeedMph: number;
  recoilPulls: number; // 0 to 3 pulls on generator recoil starter
  isPupilDilated: boolean;
}

export interface GameSettings {
  mouseSensitivity: number;
  soundVolume: number;
  ambientVolume: number;
  difficulty: 'normal' | 'nightmare' | 'story';
  headBobbing: boolean;
  filmGrain: boolean;
}

export interface Chapter {
  id: number;
  numberString: string;
  title: string;
  subtitle: string;
  objective: string;
  location: string;
  briefing: string;
}

export const GAME_CHAPTERS: Chapter[] = [
  {
    id: 1,
    numberString: 'CHAPTER I',
    title: 'THE STRANDED RANGER',
    subtitle: 'North Trailhead // Breakdown',
    objective: 'Search the crashed pickup truck for the Ranger Cabin Key and secure shelter.',
    location: 'Northern Perimeter & Ranger Station',
    briefing: 'Your patrol truck stalled out against an ancient pine tree in heavy mountain fog. Night has fallen, temperatures are dropping rapidly, and an unnatural silence blankets the treeline. Find the cabin key in the truck glove compartment or tailgate.',
  },
  {
    id: 2,
    numberString: 'CHAPTER II',
    title: 'SHROUDED RUNES',
    subtitle: 'Ancient Woods // Monoliths & Shacks',
    objective: 'Scavenge 3 heavy-duty spark plugs hidden among ancient monoliths and logging shacks.',
    location: 'Sector 4 Deep Pines & Stone Circle',
    briefing: 'The ranger cabin power is cut. You must brave the misty deep woods to scavenge 3 heavy-duty spark plugs from workbenches and forgotten hunters shacks. Watch your step: snapping branches alert the antlered stalker.',
  },
  {
    id: 3,
    numberString: 'CHAPTER III',
    title: 'BLOOD & HIGH VOLTAGE',
    subtitle: 'Logging Outpost // Industrial Generator Shed',
    objective: 'Locate the 5-gallon diesel fuel can and prime the heavy Caterpillar generator.',
    location: 'Logging Camp & Southeast Generator Shed',
    briefing: 'With spark plugs secured, locate the 5-gallon red diesel fuel container stored at the abandoned Western logging camp, then transport it to the Southeast power shed to prime and crank the generator.',
  },
  {
    id: 4,
    numberString: 'CHAPTER IV',
    title: 'THE FINAL EVACUATION',
    subtitle: 'Southern Perimeter // Electrified Highway Gate',
    objective: 'Navigate the nocturnal treeline, disengage the magnetic highway gate lock, and escape.',
    location: 'South Forestry Highway Gate',
    briefing: 'High-voltage floodlights ignite across the forest as the generator roars to life. The noise has enraged the entity. sprint to the South Forestry Gate, hit the emergency release switch, and flee the woods.',
  },
];

