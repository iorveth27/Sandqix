import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Crown } from 'lucide-react';

interface HUDProps {
  isVisible: boolean;
  lives: number;
  score: number;
  highscore: number;
  onPause: () => void;
}

export function HUD({ isVisible, lives, score, highscore, onPause }: HUDProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="absolute inset-0 pointer-events-none z-20 flex flex-col"
        >
          <div className="absolute top-4 left-0 right-0 flex justify-center items-center gap-3 px-4 pointer-events-none">

            {/* Hearts + highscore pill */}
            <div
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl pointer-events-auto"
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(255, 200, 100, 0.3)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              <div className="flex items-center gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 flex items-center justify-center transition-all duration-300"
                    style={{
                      filter: i < lives ? 'none' : 'grayscale(100%) brightness(40%)',
                      transform: i < lives ? 'scale(1)' : 'scale(0.75)',
                    }}
                  >
                    <span className="text-xl leading-none select-none">❤️</span>
                  </div>
                ))}
              </div>
              <span
                className="flex items-center gap-1 font-bold tabular-nums"
                style={{
                  fontSize: '10px',
                  color: 'rgba(253, 230, 138, 0.5)',
                  letterSpacing: '0.05em',
                }}
              >
                <Crown className="w-2.5 h-2.5" style={{ color: 'rgba(253, 230, 138, 0.5)' }} />
                {highscore.toLocaleString()}
              </span>
            </div>

            {/* Score — centered */}
            <div
              className="flex items-center justify-center px-5 py-2 rounded-2xl pointer-events-auto flex-1"
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(255, 200, 100, 0.3)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              <span
                className="text-2xl font-black tabular-nums leading-none"
                style={{
                  color: '#fde68a',
                  textShadow: '0 0 8px rgba(245,166,35,0.8), 0 2px 4px rgba(0,0,0,0.9)',
                }}
              >
                {score.toLocaleString()}
              </span>
            </div>

            {/* Settings button */}
            <button
              onClick={onPause}
              className="w-11 h-11 rounded-2xl flex items-center justify-center pointer-events-auto transition-all duration-150 active:scale-95 group"
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(255, 200, 100, 0.3)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              <Settings
                className="w-5 h-5 transition-transform group-hover:rotate-45 duration-300"
                strokeWidth={2.5}
                style={{ color: '#fde68a', filter: 'drop-shadow(0 0 4px rgba(245,166,35,0.7))' }}
              />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
