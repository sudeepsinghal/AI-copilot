import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Server, Lock, Code, Eye, Key } from 'lucide-react';
import { useTilt, useSpotlight } from '../../hooks/useAnimations';

const badges = [
  { icon: Server, title: 'Self-Hostable', desc: 'Deploy entirely within your own AWS, GCP, or Azure VPC. Documents never leave your infrastructure.', color: 'primary' },
  { icon: Lock, title: 'No LLM Training', desc: 'Your sensitive data, invoices, and contracts are never used to train public AI models. Ever.', color: 'accent' },
  { icon: Code, title: '100% Open Source', desc: 'Inspect every line of code. Run your own security audits. Verify our claims independently.', color: 'success' },
];

function SecurityCard({ item, index }) {
  const tilt = useTilt(5);
  const spotlight = useSpotlight();
  const Icon = item.icon;

  return (
    <motion.div
      ref={(el) => { tilt.ref.current = el; spotlight.ref.current = el; }}
      {...tilt.handlers}
      onMouseMove={(e) => { tilt.handlers.onMouseMove(e); spotlight.onMouseMove(e); }}
      style={tilt.style}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15 }}
      className="spotlight p-7 rounded-2xl border border-border bg-surface/20 relative overflow-hidden group"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-${item.color}/10 border border-${item.color}/20 group-hover:shadow-[0_0_20px_var(--color-primary-glow)] transition-shadow duration-300`}>
        <Icon size={24} className={`text-${item.color}`} />
      </div>
      <h3 className="font-bold text-lg mb-2 text-text relative z-10">{item.title}</h3>
      <p className="text-text-muted text-sm leading-relaxed relative z-10">{item.desc}</p>
    </motion.div>
  );
}

export default function Security() {
  return (
    <section id="security" className="py-28 relative z-10 bg-surface/20">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-bg/50 mb-6">
            <Shield size={14} className="text-success" />
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Enterprise Security</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Your data stays <span className="gradient-text-animated">yours — always.</span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Built for regulated industries where data sovereignty isn't optional.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {badges.map((badge, i) => (
            <SecurityCard key={i} item={badge} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
