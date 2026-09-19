import { Inventory, FlashlightState, LoreNote } from '../types';

export interface SaveData {
  timestamp: number;
  timeSurvived: number;
  inventory: Inventory;
  flashlight: FlashlightState;
  notesRead: string[];
  playerPosition: { x: number; y: number; z: number } | null;
  isPowerRestored: boolean;
  chapterId: number;
}

const SAVE_KEY = 'blackwood_pines_save';

export const saveGame = (data: SaveData): boolean => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save game:', error);
    return false;
  }
};

export const loadGame = (): SaveData | null => {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return null;
    
    const data = JSON.parse(saved) as SaveData;
    
    // Validate the save data
    if (!data.timestamp || !data.inventory || !data.flashlight) {
      console.warn('Invalid save data');
      return null;
    }
    
    // Ensure playerPosition exists
    if (!data.playerPosition) {
      data.playerPosition = { x: -1, y: 1.65, z: -20 };
    }
    
    return data;
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
};

export const hasSaveGame = (): boolean => {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
};

export const deleteSaveGame = (): boolean => {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to delete save:', error);
    return false;
  }
};

export const getSaveInfo = (): { timestamp: number; timeSurvived: number } | null => {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return null;
    
    const data = JSON.parse(saved) as SaveData;
    return {
      timestamp: data.timestamp,
      timeSurvived: data.timeSurvived,
    };
  } catch {
    return null;
  }
};
