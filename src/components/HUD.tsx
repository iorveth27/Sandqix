import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Star } from 'lucide-react';

interface HUDProps {
  isVisible: boolean;
  capturedPercent: number;
  lives: number;
  onPause: () => void;
}

export function HUD({ isVisible, capturedPercent, lives, onPause }: HUDProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="absolute top-6 left-0 right-0 flex flex-row items-center justify-center gap-4 z-20 shrink-0 pointer-events-none"
        >
          {/* Bubble Lives */}
          <div className="bg-black border-2 border-white/10 rounded-full px-5 py-3 flex items-center gap-3 shadow-xl">
            <span className="text-[11px] font-bold tracking-widest uppercase text-white/60 mr-1">Lives</span>
            <div className="flex items-center gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                    i < lives ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 'bg-white/10 shadow-inner'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Bubble Territory progress */}
          <div className="bg-black border-2 border-white/10 rounded-full px-6 py-3 flex items-center gap-6 shadow-xl pointer-events-auto">
            <div className="flex flex-col w-56">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-[11px] font-bold tracking-widest uppercase text-white/60">Territory</span>
                <span className="text-[12px] font-mono font-bold text-amber-400">{capturedPercent}%</span>
              </div>
              <div className="relative h-3 w-full bg-white/10 rounded-full border border-black/50 overflow-hidden shadow-inner">
                {/* Goal marker at 80% */}
                <div className="absolute top-0 bottom-0 z-10 bg-white/30 w-[2px]" style={{ left: '80%' }} />
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                  initial={false}
                  animate={{ width: `${capturedPercent}%` }}
                />
              </div>
            </div>
            
            <button
              onClick={onPause}
              className="w-10 h-10 shrink-0 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all active:scale-95"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
