import React from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useTilt, useSpotlight } from '../../hooks/useAnimations';

const withoutItems = [
  "Weeks writing rigid regex parsers for every new document template.",
  "Basic LLMs hallucinate numbers — no connection to the source document.",
  "No way to search across 10,000 documents simultaneously.",
  "Data locked in 3rd-party servers, failing compliance audits.",
];

const withItems = [
  "Zero templates needed. AI understands document structure like a human.",
  "Every fact is cited with a direct link to the exact page and paragraph.",
  "Vector embeddings enable instant semantic search across millions of pages.",
  "Fully open-source and self-hostable. Your data never leaves your VPC.",
];

function ComparisonCard({ title, items, variant }) {
  const tilt = useTilt(6);
  const spotlight = useSpotlight();
  const isGood = variant === 'good';

  return (
    <motion.div
      ref={(el) => { tilt.ref.current = el; spotlight.ref.current = el; }}
      {...tilt.handlers}
      onMouseMove={(e) => { tilt.handlers.onMouseMove(e); spotlight.onMouseMove(e); }}
      style={tilt.style}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`spotlight p-8 rounded-2xl border relative overflow-hidden ${
        isGood
          ? 'border-primary/30 bg-primary/[0.03]'
          : 'border-border bg-surface/30'
      }`}
    >
      {/* Corner glow for "good" variant */}
      {isGood && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full filter blur-[80px] pointer-events-none" />
      )}

      <h3 className={`text-xl font-bold mb-8 flex items-center gap-3 relative z-10 ${isGood ? 'text-text' : 'text-text-muted'}`}>
        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
          isGood ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
        }`}>
          {isGood ? '✓' : '✕'}
        </span>
        {title}
      </h3>

      <ul className="space-y-5 relative z-10">
        {items.map((item, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: isGood ? 20 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`flex gap-3 text-sm leading-relaxed ${isGood ? 'text-text' : 'text-text-muted'}`}
          >
            {isGood ? <Check className="text-success flex-shrink-0 mt-0.5" size={18} /> : <X className="text-danger flex-shrink-0 mt-0.5" size={18} />}
            {item}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function Comparison() {
  return (
    <section className="py-28 relative z-10 border-y border-border/30">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Why you need a <span className="gradient-text-animated">better engine</span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Traditional OCR is brittle. Pure LLMs hallucinate. We give you the best of both worlds.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ComparisonCard title="Without AI Copilot" items={withoutItems} variant="bad" />
          <ComparisonCard title="With AI Copilot" items={withItems} variant="good" />
        </div>
      </div>
    </section>
  );
}
