import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bug, Play, RotateCcw } from 'lucide-react';

interface OverlaysProps {
  gameState: 'PLAYING' | 'GAMEOVER' | 'WIN';
  isPaused: boolean;
  capturedPercent: number;
  sparksEnabled: boolean;
  bossEnabled: boolean;
  fuseEnabled: boolean;
  onToggleSparks: () => void;
  onToggleBoss: () => void;
  onToggleFuse: () => void;
  onRestart: () => void;
  onResume: () => void;
}

export function Overlays({ gameState, isPaused, capturedPercent, sparksEnabled, bossEnabled, fuseEnabled, onToggleSparks, onToggleBoss, onToggleFuse, onRestart, onResume }: OverlaysProps) {
  return (
    <AnimatePresence>
      {gameState === 'GAMEOVER' && (
        <motion.div
          key="gameover"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 bg-black/80 backdrop-blur-2xl p-10 rounded-[48px] border-2 border-white/10 flex flex-col items-center gap-6 shadow-[0_0_40px_rgba(0,0,0,0.8)] text-white"
        >
          <h2 className="text-4xl font-sans font-bold tracking-tight">Game Over</h2>
          <p className="text-white/60 text-center text-sm font-medium uppercase tracking-widest">You captured {capturedPercent}% of the territory.</p>
          <button
            onClick={onRestart}
            className="flex items-center justify-center w-full py-4 bg-amber-500 text-black rounded-full font-bold text-lg transition-all hover:bg-amber-400 active:scale-95 shadow-[0_0_20px_rgba(251,191,36,0.3)] mt-2"
          >
            <RotateCcw className="mr-2 w-5 h-5" />
            Try Again
          </button>
        </motion.div>
      )}

      {gameState === 'WIN' && (
        <motion.div
          key="win"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 bg-black/80 backdrop-blur-2xl p-10 rounded-[48px] border-2 border-white/10 flex flex-col items-center gap-6 shadow-[0_0_40px_rgba(0,0,0,0.8)] text-white"
        >
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)]">
            <Bug className="w-10 h-10 text-black" />
          </div>
          <h2 className="text-4xl font-sans font-bold tracking-tight">Victory!</h2>
          <p className="text-white/60 text-center text-sm font-medium uppercase tracking-widest">You captured the territory.</p>
          <button
            onClick={onRestart}
            className="flex items-center justify-center w-full py-4 bg-emerald-500 text-black rounded-full font-bold text-lg transition-all hover:bg-emerald-400 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] mt-2"
          >
            <RotateCcw className="mr-2 w-5 h-5" />
            Play Again
          </button>
        </motion.div>
      )}

      {isPaused && (
        <motion.div
          key="pause"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-black/80 backdrop-blur-2xl p-10 rounded-[48px] border-2 border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col items-center gap-8 max-w-[320px] w-full text-white"
          >
            <div className="text-center">
              <h2 className="text-4xl font-sans font-bold mb-2">Paused</h2>
              <p className="text-white/50 text-sm font-medium tracking-wide uppercase">Sandbox settings</p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              {/* Toggles */}
              {[
                { label: 'Sparks', enabled: sparksEnabled, onToggle: onToggleSparks },
                { label: 'Boss', enabled: bossEnabled, onToggle: onToggleBoss },
                { label: 'Fuse', enabled: fuseEnabled, onToggle: onToggleFuse },
              ].map(({ label, enabled, onToggle }) => (
                <button
                  key={label}
                  onClick={onToggle}
                  className="w-full flex items-center justify-between px-6 py-4 rounded-full bg-white/5 border border-white/10 text-white font-bold transition-all hover:bg-white/10 active:scale-95"
                >
                  <span className="text-sm tracking-wide">{label}</span>
                  <div className={`w-12 h-7 rounded-full transition-colors relative shadow-inner ${enabled ? 'bg-amber-500' : 'bg-white/20'}`}>
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-black shadow transition-transform ${enabled ? 'translate-x-[22px]' : 'translate-x-1'}`} />
                  </div>
                </button>
              ))}

              <button
                onClick={onResume}
                className="w-full py-4 bg-amber-500 text-black rounded-full font-bold transition-all hover:bg-amber-400 active:scale-95 flex items-center justify-center gap-2 mt-2"
              >
                <Play className="w-5 h-5 fill-current" />
                Resume
              </button>
              <button
                onClick={onRestart}
                className="w-full py-4 bg-white/10 text-white border border-white/20 rounded-full font-bold transition-all hover:bg-white/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Restart
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
