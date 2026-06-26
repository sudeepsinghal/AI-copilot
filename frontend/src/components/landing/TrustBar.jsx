import React from 'react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '../../hooks/useAnimations';

const logos = [
  { name: 'ACME CORP', style: 'font-serif font-bold' },
  { name: 'GLOBEX', style: 'font-sans font-black tracking-tighter' },
  { name: 'SYNERGY', style: 'font-sans font-light tracking-[0.3em]' },
  { name: 'MASSIVE', style: 'font-sans font-bold' },
  { name: 'DATAFLOW', style: 'font-mono font-medium' },
  { name: 'NEXUS AI', style: 'font-sans font-extrabold italic' },
];

export default function TrustBar() {
  const [ref, isVisible] = useScrollReveal(0.2);

  return (
    <section ref={ref} className="py-16 border-y border-border/30 relative z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          className="text-xs font-semibold text-text-muted mb-10 uppercase tracking-[0.2em] text-center"
        >
          Trusted by forward-thinking teams worldwide
        </motion.p>

        {/* Scrolling logo marquee */}
        <div className="relative w-full overflow-hidden">
          {/* Left/Right fade masks */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-bg to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-bg to-transparent z-10" />

          <div className="flex animate-[scroll_20s_linear_infinite] hover:[animation-play-state:paused]">
            {[...logos, ...logos].map((logo, i) => (
              <div
                key={i}
                className="flex-shrink-0 mx-12 text-xl text-text-muted/30 hover:text-text-muted/70 transition-all duration-500 cursor-default select-none"
              >
                <span className={logo.style}>{logo.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Small stat pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 mt-12"
        >
          {[
            { val: '1M+', label: 'Documents Processed' },
            { val: '99.9%', label: 'Uptime' },
            { val: '<500ms', label: 'Avg Response' },
          ].map((stat, i) => (
            <div key={i} className="px-5 py-2 rounded-full border border-border/50 bg-surface/30 flex items-center gap-2 text-sm">
              <span className="font-bold text-primary">{stat.val}</span>
              <span className="text-text-muted text-xs">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* CSS for marquee */}
      <style>{`
        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
