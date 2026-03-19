import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Direction, type Point } from '../types';

interface JoystickProps {
  onMove: (dir: Direction) => void;
}

export function Joystick({ onMove }: JoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [basePos, setBasePos] = useState<Point | null>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number, clientY: number) => {
    if (!basePos || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dx = clientX - rect.left - basePos.x;
    const dy = clientY - rect.top - basePos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 32;

    if (dist > maxDist) {
      const angle = Math.atan2(dy, dx);
      const moveDist = dist - maxDist;
      setBasePos({
        x: basePos.x + Math.cos(angle) * moveDist,
        y: basePos.y + Math.sin(angle) * moveDist,
      });
      setKnobPos({ x: Math.cos(angle) * maxDist, y: Math.sin(angle) * maxDist });
    } else {
      setKnobPos({ x: dx, y: dy });
    }

    if (dist > maxDist * 0.3) {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      onMove(absX > absY ? (dx > 0 ? Direction.RIGHT : Direction.LEFT) : (dy > 0 ? Direction.DOWN : Direction.UP));
    }
  };

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const point = 'touches' in e ? e.touches[0] : e;
    setBasePos({ x: point.clientX - rect.left, y: point.clientY - rect.top });
    setKnobPos({ x: 0, y: 0 });
    setIsDragging(true);
  };

  useEffect(() => {
    const handleGlobalMove = (e: TouchEvent | MouseEvent) => {
      if (!isDragging) return;
      const point = 'touches' in e ? e.touches[0] : e;
      handleMove(point.clientX, point.clientY);
    };

    const handleGlobalEnd = () => {
      onMove(Direction.NONE);
      setIsDragging(false);
      setBasePos(null);
      setKnobPos({ x: 0, y: 0 });
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMove);
      window.addEventListener('mouseup', handleGlobalEnd);
      window.addEventListener('touchmove', handleGlobalMove);
      window.addEventListener('touchend', handleGlobalEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [isDragging, basePos]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-10 pointer-events-auto"
      onMouseDown={handleStart}
      onTouchStart={handleStart}
    >
      {basePos && (
        <div
          className="absolute w-16 h-16 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 flex items-center justify-center pointer-events-none"
          style={{ left: basePos.x - 32, top: basePos.y - 32, transform: 'translate3d(0,0,0)' }}
        >
          <motion.div
            className="w-7 h-7 bg-white/40 rounded-full shadow-lg border border-white/20"
            animate={{ x: knobPos.x, y: knobPos.y }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          />
        </div>
      )}
    </div>
  );
}
