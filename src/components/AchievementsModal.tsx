import React from 'react';
import { Trophy, X } from 'lucide-react';
import { getAchievements } from '../utils/achievementSystem';

interface AchievementsModalProps {
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ onClose }) => {
  const { achievements, totalUnlocked } = getAchievements();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md select-none font-mono text-white p-4">
      <div className="max-w-2xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h2 className="text-xl font-bold tracking-wider text-zinc-100 uppercase">
              ACHIEVEMENTS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="bg-zinc-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Progress</span>
            <span className="text-sm font-bold text-amber-400">
              {totalUnlocked} / {achievements.length}
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all"
              style={{ width: `${(totalUnlocked / achievements.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Achievements List */}
        <div className="space-y-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border transition-all ${
                achievement.unlocked
                  ? 'bg-amber-950/30 border-amber-700/50'
                  : 'bg-zinc-900/50 border-zinc-800 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    achievement.unlocked ? 'bg-amber-500/20' : 'bg-zinc-800'
                  }`}
                >
                  <Trophy
                    className={`h-5 w-5 ${
                      achievement.unlocked ? 'text-amber-400' : 'text-zinc-600'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <h3
                    className={`font-bold text-sm ${
                      achievement.unlocked ? 'text-amber-300' : 'text-zinc-500'
                    }`}
                  >
                    {achievement.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {achievement.description}
                  </p>
                  {achievement.unlocked && achievement.unlockedAt && (
                    <p className="text-[10px] text-zinc-500 mt-2">
                      Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
