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
          className="h-20 flex flex-row items-center justify-between px-8 bg-stone-950/50 border-b border-white/5 z-20 shrink-0"
        >
          {/* Lives */}
          <div className="flex items-center gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i < lives ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-white/10'
                }`}
              />
            ))}
            <span className="text-[10px] font-bold tracking-widest uppercase text-white/40 ml-1">Lives</span>
          </div>

          {/* Territory progress */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-1.5 w-48">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold tracking-widest uppercase text-white/60">Territory</span>
                <span className="text-[10px] font-mono text-white/40">{capturedPercent}%</span>
              </div>
              <div className="relative h-2.5 w-full bg-white/10 rounded-full border border-white/5">
                {/* Goal marker at 80% */}
                <div className="absolute top-1/2 -translate-y-1/2 z-10" style={{ left: '80%' }}>
                  <div className="relative -translate-x-1/2">
                    <Star className={`w-4 h-4 fill-current ${capturedPercent >= 80 ? 'text-yellow-400' : 'text-white/20'}`} />
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-white/20" />
                  </div>
                </div>
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                  initial={false}
                  animate={{ width: `${capturedPercent}%` }}
                />
              </div>
            </div>

            <button
              onClick={onPause}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-90"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
