import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileSearch, Cpu, Database, MessageSquare, Download } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useAnimations';

const steps = [
  { icon: UploadCloud, title: "Ingest", desc: "PDFs, Images, Scans, Office Files", detail: "Drag-and-drop or API. We accept 15+ formats including handwritten notes." },
  { icon: FileSearch, title: "Classify", desc: "Auto-detect document type", detail: "AI automatically categorizes invoices, contracts, receipts, and more." },
  { icon: Cpu, title: "Extract", desc: "Smart OCR & Layout Parsing", detail: "Multi-engine OCR with layout-aware extraction preserves tables and structure." },
  { icon: Database, title: "Embed", desc: "Vector DB Storage", detail: "Documents are chunked, embedded, and indexed for instant semantic search." },
  { icon: MessageSquare, title: "Query", desc: "Natural Language Chat", detail: "Ask questions in plain English with cited sources from the original document." },
  { icon: Download, title: "Export", desc: "JSON, APIs, Webhooks", detail: "Push structured data to Salesforce, SAP, Google Sheets, or any webhook." },
];

export default function PipelineFlow() {
  const [activeStep, setActiveStep] = useState(-1);
  const sectionRef = useRef(null);
  const [sectionRef2, isVisible] = useScrollReveal(0.1);

  // Auto-advance steps when in view
  useEffect(() => {
    if (!isVisible) return;
    setActiveStep(0);
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev >= steps.length - 1 ? 0 : prev + 1));
    }, 2500);
    return () => clearInterval(timer);
  }, [isVisible]);

  return (
    <section ref={sectionRef2} className="py-28 relative z-10" id="pipeline">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface/40 mb-6">
            <Cpu size={14} className="text-primary" />
            <span className="text-xs font-medium text-text-muted">End-to-End Pipeline</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            From chaos to clarity in <span className="gradient-text-animated">6 steps</span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            A seamless enterprise-grade pipeline that turns chaotic document folders into a queryable knowledge graph.
          </p>
        </motion.div>

        {/* Pipeline visualization */}
        <div className="relative">
          {/* Horizontal connector line (desktop) */}
          <div className="hidden md:block absolute top-[52px] left-[8%] right-[8%] h-[2px] bg-border/50 z-0" />
          {/* Animated progress on the line */}
          <motion.div
            className="hidden md:block absolute top-[52px] left-[8%] h-[2px] z-[1]"
            style={{ background: 'var(--gradient-primary)' }}
            initial={{ width: '0%' }}
            animate={{ width: activeStep >= 0 ? `${(activeStep / (steps.length - 1)) * 84}%` : '0%' }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === activeStep;
              const isPast = idx < activeStep;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setActiveStep(idx)}
                  className="flex flex-col items-center text-center cursor-pointer group"
                >
                  {/* Node circle */}
                  <motion.div
                    animate={{
                      scale: isActive ? 1.15 : 1,
                      boxShadow: isActive ? '0 0 30px var(--color-primary-glow)' : '0 0 0px transparent',
                    }}
                    className={`w-[72px] h-[72px] rounded-2xl border-2 flex items-center justify-center mb-4 transition-all duration-300 ${
                      isActive ? 'border-primary bg-primary/10' :
                      isPast ? 'border-primary/40 bg-surface' :
                      'border-border bg-surface group-hover:border-primary/30 group-hover:bg-surface-hover'
                    }`}
                  >
                    <Icon size={28} className={`transition-colors duration-300 ${
                      isActive || isPast ? 'text-primary' : 'text-text-muted group-hover:text-text'
                    }`} />
                  </motion.div>

                  <h3 className={`font-bold text-sm mb-1 transition-colors ${isActive ? 'text-text glow-text' : 'text-text-muted'}`}>
                    {step.title}
                  </h3>
                  <p className="text-[11px] text-text-muted leading-tight">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Active step detail card */}
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-12 mx-auto max-w-xl text-center p-6 glass-card"
        >
          <p className="text-text-muted text-sm leading-relaxed">
            {steps[Math.max(0, activeStep)]?.detail}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
