import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

interface MobileControlsProps {
  onMove: (x: number, y: number) => void;
  onAction: (action: 'interact' | 'flashlight' | 'sprint' | 'crouch' | 'medkit' | 'rations') => void;
  onPause: () => void;
  isMobile: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onAction,
  onPause,
  isMobile,
}) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (!joystickRef.current) return;
      const touch = e.touches[0];
      const rect = joystickRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      touchIdRef.current = touch.identifier;
      setJoystickActive(true);
      
      const x = touch.clientX - centerX;
      const y = touch.clientY - centerY;
      const maxDist = rect.width / 2;
      const dist = Math.sqrt(x * x + y * y);
      const clampedDist = Math.min(dist, maxDist);
      const angle = Math.atan2(y, x);
      
      const clampedX = Math.cos(angle) * clampedDist;
      const clampedY = Math.sin(angle) * clampedDist;
      
      setJoystickPos({ x: clampedX, y: clampedY });
      onMove(clampedX / maxDist, clampedY / maxDist);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!joystickRef.current || touchIdRef.current === null) return;
      
      const touch = Array.from(e.touches).find(t => t.identifier === touchIdRef.current);
      if (!touch) return;
      
      const rect = joystickRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const x = touch.clientX - centerX;
      const y = touch.clientY - centerY;
      const maxDist = rect.width / 2;
      const dist = Math.sqrt(x * x + y * y);
      const clampedDist = Math.min(dist, maxDist);
      const angle = Math.atan2(y, x);
      
      const clampedX = Math.cos(angle) * clampedDist;
      const clampedY = Math.sin(angle) * clampedDist;
      
      setJoystickPos({ x: clampedX, y: clampedY });
      onMove(clampedX / maxDist, clampedY / maxDist);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = Array.from(e.changedTouches).find(t => t.identifier === touchIdRef.current);
      if (touch) {
        touchIdRef.current = null;
        setJoystickActive(false);
        setJoystickPos({ x: 0, y: 0 });
        onMove(0, 0);
      }
    };

    const joystick = joystickRef.current;
    if (joystick) {
      joystick.addEventListener('touchstart', handleTouchStart);
      joystick.addEventListener('touchmove', handleTouchMove);
      joystick.addEventListener('touchend', handleTouchEnd);
      joystick.addEventListener('touchcancel', handleTouchEnd);
    }

    return () => {
      if (joystick) {
        joystick.removeEventListener('touchstart', handleTouchStart);
        joystick.removeEventListener('touchmove', handleTouchMove);
        joystick.removeEventListener('touchend', handleTouchEnd);
        joystick.removeEventListener('touchcancel', handleTouchEnd);
      }
    };
  }, [isMobile, onMove]);

  if (!isMobile) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Virtual Joystick */}
      <div
        ref={joystickRef}
        className="absolute bottom-24 left-8 w-32 h-32 rounded-full bg-black/30 border-2 border-white/20 pointer-events-auto"
      >
        <motion.div
          ref={knobRef}
          className="absolute w-16 h-16 rounded-full bg-white/40 border-2 border-white/60"
          animate={{
            x: joystickPos.x,
            y: joystickPos.y,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            left: '50%',
            top: '50%',
            marginLeft: '-32px',
            marginTop: '-32px',
          }}
        />
      </div>

      {/* Pause Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onPause}
        className="absolute top-4 right-4 w-12 h-12 rounded-full bg-black/50 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold pointer-events-auto"
      >
        II
      </motion.button>
    </div>
  );

};
