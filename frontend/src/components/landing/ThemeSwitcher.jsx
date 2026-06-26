import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette } from 'lucide-react';

const themes = [
  { id: 'theme-electric', name: 'Electric Voltage', colors: ['#0B00CF', '#FF2D2B'] },
  { id: 'theme-solar', name: 'Solar Flare', colors: ['#FFE500', '#FF0080'] },
  { id: 'theme-ultra', name: 'Ultraviolet', colors: ['#8B00FF', '#CCFF00'] },
];

export default function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('theme-electric');

  const switchTheme = (themeId) => {
    document.documentElement.className = themeId;
    setActive(themeId);
    setOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full glass-panel flex items-center justify-center glow cursor-pointer"
        aria-label="Switch color theme"
      >
        <Palette size={20} className="text-primary" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-16 right-0 glass-panel p-3 flex flex-col gap-2 min-w-[200px]"
          >
            <div className="text-xs font-semibold text-text-muted px-2 mb-1 uppercase tracking-wider">
              Color Theme
            </div>
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => switchTheme(t.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active === t.id
                    ? 'bg-primary/15 text-text'
                    : 'text-text-muted hover:bg-surface-hover hover:text-text'
                }`}
              >
                <div className="flex -space-x-1">
                  {t.colors.map((c, i) => (
                    <div key={i} className="w-4 h-4 rounded-full border-2 border-bg" style={{ background: c }} />
                  ))}
                </div>
                {t.name}
                {active === t.id && (
                  <span className="ml-auto text-xs text-primary">●</span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
