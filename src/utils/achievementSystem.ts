export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface AchievementData {
  achievements: Achievement[];
  totalUnlocked: number;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_survivor',
    title: 'First Steps',
    description: 'Survive for 1 minute',
    unlocked: false,
  },
  {
    id: 'spark_plug_hunter',
    title: 'Spark Plug Hunter',
    description: 'Collect all 3 spark plugs',
    unlocked: false,
  },
  {
    id: 'fuel_master',
    title: 'Fuel Master',
    description: 'Fuel the generator',
    unlocked: false,
  },
  {
    id: 'escape_artist',
    title: 'Escape Artist',
    description: 'Escape Blackwood Pines',
    unlocked: false,
  },
  {
    id: 'lore_collector',
    title: 'Lore Collector',
    description: 'Read all field notes',
    unlocked: false,
  },
  {
    id: 'night_survivor',
    title: 'Night Survivor',
    description: 'Survive for 5 minutes',
    unlocked: false,
  },
  {
    id: 'artifact_hunter',
    title: 'Artifact Hunter',
    description: 'Collect a mysterious artifact',
    unlocked: false,
  },
  {
    id: 'perfect_escape',
    title: 'Perfect Escape',
    description: 'Escape without being injured',
    unlocked: false,
  },
  {
    id: 'hoarder',
    title: 'Hoarder',
    description: 'Collect 10 items',
    unlocked: false,
  },
  {
    id: 'explorer',
    title: 'Explorer',
    description: 'Visit all areas of the map',
    unlocked: false,
  },
];

const ACHIEVEMENT_KEY = 'blackwood_pines_achievements';

export const getAchievements = (): AchievementData => {
  try {
    const saved = localStorage.getItem(ACHIEVEMENT_KEY);
    if (!saved) {
      return {
        achievements: ACHIEVEMENTS,
        totalUnlocked: 0,
      };
    }
    
    const data = JSON.parse(saved) as AchievementData;
    return data;
  } catch {
    return {
      achievements: ACHIEVEMENTS,
      totalUnlocked: 0,
    };
  }
};

export const unlockAchievement = (achievementId: string): boolean => {
  try {
    const data = getAchievements();
    const achievement = data.achievements.find(a => a.id === achievementId);
    
    if (!achievement || achievement.unlocked) return false;
    
    achievement.unlocked = true;
    achievement.unlockedAt = Date.now();
    data.totalUnlocked = data.achievements.filter(a => a.unlocked).length;
    
    localStorage.setItem(ACHIEVEMENT_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
};

export const checkAchievements = (gameState: {
  timeSurvived: number;
  sparkPlugsCollected: number;
  fuelAdded: boolean;
  escaped: boolean;
  notesRead: number;
  artifactsCollected: number;
  itemsCollected: number;
  isInjured: boolean;
  areasVisited: number;
}): string[] => {
  const newlyUnlocked: string[] = [];
  
  // Time-based achievements
  if (gameState.timeSurvived >= 60) {
    if (unlockAchievement('first_survivor')) {
      newlyUnlocked.push('first_survivor');
    }
  }
  
  if (gameState.timeSurvived >= 300) {
    if (unlockAchievement('night_survivor')) {
      newlyUnlocked.push('night_survivor');
    }
  }
  
  // Item-based achievements
  if (gameState.sparkPlugsCollected >= 3) {
    if (unlockAchievement('spark_plug_hunter')) {
      newlyUnlocked.push('spark_plug_hunter');
    }
  }
  
  if (gameState.fuelAdded) {
    if (unlockAchievement('fuel_master')) {
      newlyUnlocked.push('fuel_master');
    }
  }
  
  if (gameState.artifactsCollected >= 1) {
    if (unlockAchievement('artifact_hunter')) {
      newlyUnlocked.push('artifact_hunter');
    }
  }
  
  if (gameState.itemsCollected >= 10) {
    if (unlockAchievement('hoarder')) {
      newlyUnlocked.push('hoarder');
    }
  }
  
  // Story achievements
  if (gameState.escaped) {
    if (unlockAchievement('escape_artist')) {
      newlyUnlocked.push('escape_artist');
    }
    
    if (!gameState.isInjured) {
      if (unlockAchievement('perfect_escape')) {
        newlyUnlocked.push('perfect_escape');
      }
    }
  }
  
  if (gameState.notesRead >= 4) {
    if (unlockAchievement('lore_collector')) {
      newlyUnlocked.push('lore_collector');
    }
  }
  
  if (gameState.areasVisited >= 10) {
    if (unlockAchievement('explorer')) {
      newlyUnlocked.push('explorer');
    }
  }
  
  return newlyUnlocked;
};

export const resetAchievements = (): void => {
  try {
    localStorage.removeItem(ACHIEVEMENT_KEY);
  } catch {
    // Ignore errors
  }
};
