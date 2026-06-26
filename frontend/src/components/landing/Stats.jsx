import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '../../hooks/useAnimations';

function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const [ref, isVisible] = useScrollReveal(0.3);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now();
    const numTarget = parseFloat(target);

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(numTarget * eased * 10) / 10);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }, [isVisible, target, duration]);

  return (
    <span ref={ref}>
      {Number.isInteger(parseFloat(target)) ? Math.round(count) : count.toFixed(1)}
      {suffix}
    </span>
  );
}

const stats = [
  { value: 95, suffix: '%+', label: 'Extraction Accuracy', desc: 'Outperforming standard OCR' },
  { value: 10, suffix: 'x', label: 'Faster Processing', desc: 'Compared to manual entry' },
  { value: 15, suffix: '+', label: 'Formats Supported', desc: 'PDF, DOCX, Images, Scans' },
  { value: 100, suffix: '%', label: 'Open Source', desc: 'Auditable and self-hostable' },
];

export default function Stats() {
  return (
    <section className="py-24 relative z-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col items-center text-center p-6 rounded-xl border border-transparent hover:border-border/50 hover:bg-surface/20 transition-all duration-300"
            >
              <div className="text-4xl md:text-5xl font-black gradient-text-animated mb-2">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="font-semibold text-text text-sm mb-1">{stat.label}</div>
              <div className="text-xs text-text-muted">{stat.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
