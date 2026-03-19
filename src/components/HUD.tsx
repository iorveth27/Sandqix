import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings } from 'lucide-react';

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
          className="absolute inset-0 pointer-events-none z-20 flex flex-col"
        >
          {/* Top Bar */}
          <div className="absolute top-6 left-0 right-0 h-16 pointer-events-none">
            
            {/* Left Header - Hearts */}
            <div className="absolute left-6 top-0 pointer-events-auto flex justify-start items-center">
              <div className="bg-slate-700/80 rounded-full px-3 py-1.5 flex items-center gap-1.5 border-[3px] border-black shadow-[0_4px_0_#1e293b] relative overflow-hidden">
                {/* Glossy highlight for the hearts container */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-2 bg-white/10 rounded-full pointer-events-none" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="relative w-7 h-7 flex items-center justify-center transition-all duration-300"
                    style={{ 
                      filter: i < lives ? 'none' : 'grayscale(100%) brightness(50%)',
                      transform: i < lives ? 'scale(1)' : 'scale(0.8)'
                    }}
                  >
                    <span 
                      className="text-2xl absolute"
                      style={{ textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 4px 0 #000' }}
                    >
                      ❤️
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Center Progress */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 pointer-events-auto flex items-center mt-1">
              {/* Progress Bar Track Wrapper (Provides the white rim + black border to harmonize styles) */}
              <div className="bg-white rounded-full border-[3px] border-black shadow-[0_4px_0_#1e293b] p-1 flex items-center relative">
                {/* Inner Track */}
                <div className="w-32 sm:w-48 md:w-64 h-7 bg-[#A6C8D8] rounded-full relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] flex items-center p-[2px]">
                  
                  {/* Fill */}
                  {capturedPercent > 0 && (
                    <div 
                      className="absolute left-[2px] top-[2px] bottom-[2px] bg-gradient-to-b from-[#8DEB2D] to-[#51BE0D] transition-all duration-300 rounded-full border-[2px] border-[#3F8F0D] shadow-[inset_0_1px_3px_rgba(255,255,255,0.4)] overflow-hidden" 
                      style={{ 
                        width: `calc(${capturedPercent}% - 4px)`,
                        minWidth: '24px'
                      }} 
                    >
                      {/* Inner highlight for glass effect */}
                      <div className="absolute top-[1px] left-[2px] right-[2px] h-[6px] bg-gradient-to-b from-white/70 to-transparent rounded-t-full pointer-events-none" />
                    </div>
                  )}

                  {/* Goal Star at 80% */}
                  <div 
                    className="absolute top-1/2 z-20 flex flex-col items-center justify-center pointer-events-none transition-all duration-300" 
                    style={{ left: '80%', transform: 'translate(-50%, -50%) scale(1.1)' }}
                  >
                    <span 
                      className="text-[20px] leading-none" 
                      style={{ filter: 'drop-shadow(0px 2px 1px rgba(0,0,0,0.5)) drop-shadow(0px -1px 0px rgba(0,0,0,0.3))' }}
                    >
                      ⭐
                    </span>
                  </div>
                </div>

                {/* Percentage Text on the Right (Absolute so it doesn't break center alignment) */}
                <span 
                  className="absolute left-full ml-3 text-[24px] font-black text-white leading-none tracking-tight translate-y-[1px]" 
                  style={{ textShadow: '-2px -2px 0 #000, 0 -2px 0 #000, 2px -2px 0 #000, 2px 0 0 #000, 2px 2px 0 #000, 0 2px 0 #000, -2px 2px 0 #000, -2px 0 0 #000, 0 5px 0 #000' }}
                >
                  {capturedPercent}%
                </span>
              </div>
            </div>

            {/* Right Status - Settings */}
            <div className="absolute right-6 top-0 pointer-events-auto flex justify-end items-center">
              <button
                onClick={onPause}
                className="w-12 h-12 rounded-full bg-[#46bcf3] border-[3px] border-black shadow-[0_4px_0_#1e293b,inset_0_-4px_0_rgba(0,0,0,0.15)] flex items-center justify-center hover:bg-[#3db0e5] active:translate-y-1 active:shadow-[0_1px_0_#1e293b,inset_0_-2px_0_rgba(0,0,0,0.15)] transition-all relative overflow-hidden group"
              >
                {/* Bright white/cyan highlight on the button body */}
                <div className="absolute top-1 left-2.5 w-4 h-2 bg-white/60 rounded-full -rotate-[25deg] pointer-events-none" />
                
                <Settings 
                  className="w-6 h-6 text-[#f8fafc] pointer-events-none transition-transform group-hover:rotate-45 duration-300" 
                  strokeWidth={2.5}
                  style={{ 
                    filter: 'drop-shadow(0px 2px 0px rgba(0,0,0,0.6)) drop-shadow(1px 1px 0px black) drop-shadow(-1px -1px 0px black) drop-shadow(1px -1px 0px black) drop-shadow(-1px 1px 0px black)' 
                  }} 
                />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
