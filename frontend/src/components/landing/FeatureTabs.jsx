import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquareCode, Workflow, ScanLine, ArrowRight } from 'lucide-react';
import { useSpotlight } from '../../hooks/useAnimations';

/* ─────────────────────────────────────
   TAB CONTENT MOCKUPS
   ───────────────────────────────────── */

function ChatMockup() {
  return (
    <div className="h-full rounded-xl border border-border bg-bg flex flex-col overflow-hidden">
      <div className="flex-1 p-5 flex flex-col gap-4 justify-end overflow-hidden">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="self-end max-w-[80%] bg-primary/10 border border-primary/20 rounded-2xl rounded-tr-sm p-4 text-sm"
        >
          Compare the liability clauses across all 3 vendor contracts.
        </motion.div>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
          className="self-start max-w-[90%] bg-surface border border-border rounded-2xl rounded-tl-sm p-4 text-sm leading-relaxed"
        >
          <span className="font-bold text-text">Contract A</span>
          <span className="text-text-muted"> — Liability capped at <span className="text-primary font-medium">$50,000</span> or 12 months of fees. </span>
          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-1 cursor-pointer hover:bg-primary/20">pg 4 ↗</span>
          <br /><br />
          <span className="font-bold text-text">Contract B</span>
          <span className="text-text-muted"> — Unlimited liability for data breaches, capped at <span className="text-accent font-medium">$200,000</span> for service failures. </span>
          <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded ml-1 cursor-pointer hover:bg-accent/20">pg 12 ↗</span>
          <br /><br />
          <span className="font-bold text-text">Contract C</span>
          <span className="text-text-muted"> — No explicit liability clause found. </span>
          <span className="text-[10px] bg-danger/10 text-danger px-1.5 py-0.5 rounded ml-1">⚠ Missing</span>
        </motion.div>
      </div>
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2 bg-surface-hover rounded-lg border border-border px-3 py-2 text-sm text-text-muted">
          <MessageSquareCode size={14} />
          <span className="flex-1">Ask across all your documents...</span>
          <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
            <ArrowRight size={12} className="text-bg" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineMockup() {
  return (
    <div className="h-full rounded-xl border border-border bg-bg dot-grid relative overflow-hidden p-6">
      {/* Pipeline nodes */}
      <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
        className="absolute top-8 left-6 w-44 bg-surface border-2 border-primary rounded-xl p-4 shadow-lg z-10"
      >
        <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">INPUT</div>
        <div className="text-sm text-text font-medium">Gmail Inbox</div>
        <div className="text-[10px] text-text-muted">Auto-fetch attachments</div>
        <div className="absolute top-1/2 right-[-8px] w-4 h-4 bg-primary rounded-full -translate-y-1/2 border-2 border-bg" />
      </motion.div>

      {/* SVG connector lines */}
      <svg className="absolute inset-0 w-full h-full z-0">
        <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 1 }}
          d="M 195 56 C 260 56, 260 130, 310 130" fill="transparent" stroke="rgb(var(--color-primary))" strokeWidth="2" strokeDasharray="4 4"
        />
        <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1, duration: 1 }}
          d="M 510 130 C 560 130, 560 56, 610 56" fill="transparent" stroke="rgb(var(--color-accent))" strokeWidth="2"
        />
      </svg>

      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
        className="absolute top-[90px] left-[310px] w-52 bg-surface border border-border rounded-xl p-4 shadow-lg z-10"
      >
        <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1 flex items-center gap-1">
          <ScanLine size={10} /> PROCESSOR
        </div>
        <div className="text-sm text-text font-medium">Extract Invoice Fields</div>
        <div className="text-[10px] text-text-muted">vendor, amount, date, items</div>
        <div className="absolute top-1/2 left-[-8px] w-4 h-4 bg-border rounded-full -translate-y-1/2 border-2 border-bg" />
        <div className="absolute top-1/2 right-[-8px] w-4 h-4 bg-accent rounded-full -translate-y-1/2 border-2 border-bg" />
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }}
        className="absolute top-8 right-6 w-44 bg-surface border border-success/50 rounded-xl p-4 shadow-lg z-10"
      >
        <div className="text-[10px] font-bold text-success uppercase tracking-wider mb-1">OUTPUT</div>
        <div className="text-sm text-text font-medium">Google Sheets</div>
        <div className="text-[10px] text-text-muted">Auto-append rows</div>
        <div className="absolute top-1/2 left-[-8px] w-4 h-4 bg-success/50 rounded-full -translate-y-1/2 border-2 border-bg" />
      </motion.div>
    </div>
  );
}

function OcrMockup() {
  return (
    <div className="h-full rounded-xl border border-border bg-bg flex overflow-hidden relative">
      {/* Left: scanned doc */}
      <div className="w-1/2 p-5 border-r border-border relative overflow-hidden">
        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">Original Scan</div>
        <div className="space-y-2 font-mono text-[10px] text-text-muted/60 leading-relaxed">
          <div className="font-sans text-sm font-bold text-text/40 mb-3">INVOICE #8847</div>
          <div className="h-1.5 w-[70%] bg-text-muted/15 rounded" />
          <div className="h-1.5 w-[50%] bg-text-muted/15 rounded" />
          <div className="h-1.5 w-[80%] bg-text-muted/15 rounded" />
          <div className="mt-4 grid grid-cols-2 gap-y-1.5 gap-x-4">
            <div className="h-1.5 bg-text-muted/10 rounded" />
            <div className="h-1.5 bg-text-muted/10 rounded" />
            <div className="h-1.5 bg-text-muted/10 rounded" />
            <div className="h-1.5 bg-text-muted/10 rounded" />
            <div className="h-1.5 bg-text-muted/10 rounded" />
            <div className="h-1.5 bg-text-muted/10 rounded" />
          </div>
        </div>
        {/* Scanning line */}
        <motion.div
          animate={{ top: ['5%', '90%', '5%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="scan-line"
        />
      </div>
      {/* Right: structured output */}
      <div className="w-1/2 p-5">
        <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-3">Extracted Output</div>
        <motion.div className="font-mono text-[11px] space-y-1 bg-surface-hover p-3 rounded-lg border border-border">
          {[
            { k: 'invoice_id', v: '"8847"', d: 0.5 },
            { k: 'vendor', v: '"Acme Corp"', d: 0.8 },
            { k: 'date', v: '"2024-09-15"', d: 1.1 },
            { k: 'line_items', v: '[...]', d: 1.4 },
            { k: 'total', v: '$14,800.00', d: 1.7 },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: item.d }}>
              <span className="text-accent">{item.k}</span>
              <span className="text-text-muted">: </span>
              <span className="text-text">{item.v}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   TABS COMPONENT
   ───────────────────────────────────── */
const tabs = [
  { id: 'chat', icon: MessageSquareCode, title: 'Talk to Documents', desc: 'Cross-document Q&A with cited sources. Ask in plain English, get verified answers.', mockup: ChatMockup },
  { id: 'pipeline', icon: Workflow, title: 'Visual Pipelines', desc: 'Drag & drop nodes to build automated workflows. Connect any input to any output.', mockup: PipelineMockup },
  { id: 'ocr', icon: ScanLine, title: 'Smart OCR', desc: 'Multi-engine OCR auto-switches between fast parsing and deep scan based on document quality.', mockup: OcrMockup },
];

export default function FeatureTabs() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <section id="features" className="py-28 relative z-10">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            One platform. <span className="gradient-text-animated">Three superpowers.</span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Everything you need to go from unstructured chaos to production-grade intelligence.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8 items-stretch" style={{ minHeight: '480px' }}>
          {/* Tab selectors */}
          <div className="w-full lg:w-[340px] flex flex-col gap-3 flex-shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const spotlight = useSpotlight();

              return (
                <button
                  key={tab.id}
                  ref={spotlight.ref}
                  onMouseMove={spotlight.onMouseMove}
                  onClick={() => setActiveTab(tab.id)}
                  className={`spotlight text-left p-5 rounded-xl transition-all duration-300 border relative overflow-hidden ${
                    isActive
                      ? 'bg-surface/60 border-primary/40 shadow-lg'
                      : 'bg-transparent border-transparent hover:bg-surface/30 hover:border-border/50'
                  }`}
                >
                  <div className={`flex items-center gap-3 mb-2 font-bold text-base relative z-10 ${isActive ? 'text-primary' : 'text-text'}`}>
                    <Icon size={20} />
                    {tab.title}
                  </div>
                  <p className={`text-sm leading-relaxed relative z-10 ${isActive ? 'text-text-muted' : 'text-text-muted/60'}`}>
                    {tab.desc}
                  </p>
                  {isActive && (
                    <motion.div layoutId="active-tab-indicator" className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-r" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 relative min-h-[400px]">
            <AnimatePresence mode="wait">
              {tabs.map((tab) =>
                tab.id === activeTab ? (
                  <motion.div
                    key={tab.id}
                    initial={{ opacity: 0, scale: 0.97, x: 15 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.97, x: -15 }}
                    transition={{ duration: 0.35 }}
                    className="absolute inset-0"
                  >
                    <div className="h-full glass-panel p-1.5 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                      <tab.mockup />
                    </div>
                  </motion.div>
                ) : null
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
