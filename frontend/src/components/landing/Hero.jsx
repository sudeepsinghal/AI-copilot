import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Play, UploadCloud, ScanLine, FileJson, 
  MessageSquare, Settings2, FileText, Share2, Layers, Tag, Download
} from 'lucide-react';

/* ────────────────────────────────────────
   HERO BACKGROUND: Processing Matrix
   ──────────────────────────────────────── */


// Concept C: Processing Matrix
const BgMatrix = () => (
  <div className="absolute inset-0 z-0 overflow-hidden opacity-30">
    <div className="absolute top-1/2 left-0 right-0 h-px bg-primary shadow-[0_0_20px_var(--color-primary-glow)]" />
    
    {[...Array(40)].map((_, i) => (
      <motion.div
        key={`rain-${i}`}
        className="absolute text-[8px] font-mono text-text-muted/50"
        style={{ left: `${Math.random() * 100}%` }}
        initial={{ y: -100 }}
        animate={{ y: window.innerHeight }}
        transition={{ duration: 3 + Math.random() * 5, repeat: Infinity, ease: 'linear', delay: Math.random() * 5 }}
      >
        [raw_text_block]
      </motion.div>
    ))}

    {[...Array(20)].map((_, i) => (
      <motion.div
        key={`json-${i}`}
        className="absolute text-[10px] font-mono text-primary font-bold"
        style={{ left: `${Math.random() * 100}%` }}
        initial={{ y: window.innerHeight / 2 }}
        animate={{ y: window.innerHeight + 100 }}
        transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, ease: 'linear', delay: Math.random() * 2 }}
      >
        {"{ data: true }"}
      </motion.div>
    ))}
  </div>
);

/* ────────────────────────────────────────
   SPLIT-PANEL INTERACTIVE DEMO (5 PILLARS)
   ──────────────────────────────────────── */
const DEMO_STEPS = [
  {
    id: 'ingest',
    title: 'Ingest & Classify',
    icon: UploadCloud,
    desc: 'Instantly ingest any file type (PDF, image, docx) and automatically classify it based on its content, without manual sorting.',
  },
  {
    id: 'extract',
    title: 'Smart Extraction',
    icon: ScanLine,
    desc: 'Our proprietary OCR engines clean up messy scans and handwriting, preparing the document for deep AI extraction.',
  },
  {
    id: 'structure',
    title: 'Structure Data',
    icon: FileJson,
    desc: 'Large Language Models identify and extract the exact fields you need, turning unstructured text into structured, actionable data.',
  },
  {
    id: 'chat',
    title: 'Chat & Search',
    icon: MessageSquare,
    desc: 'Talk directly to your documents. Ask complex questions and get answers instantly, backed by precise page citations.',
  },
  {
    id: 'automate',
    title: 'Automate & Export',
    icon: Settings2,
    desc: 'Don\'t just extract data—act on it. Visually build pipelines that route your structured data to the tools your team already uses.',
  }
];

const STEP_DURATION = 10000; // 10 seconds per step

function SplitPanelDemo() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveStep((prev) => (prev + 1) % DEMO_STEPS.length);
    }, STEP_DURATION);
    return () => clearTimeout(timer);
  }, [activeStep]);

  const step = DEMO_STEPS[activeStep];

  return (
    <div className="w-full h-[500px] flex rounded-2xl overflow-hidden border border-border bg-surface/50 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      
      {/* LEFT PANEL: VISUAL ANIMATION (60%) */}
      <div className="w-3/5 relative overflow-hidden bg-bg/80 border-r border-border">
        <AnimatePresence mode="wait">
          
          {step.id === 'ingest' && (
            <motion.div key="ingest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center p-8">
              <div className="flex gap-6 items-center">
                <motion.div className="w-16 h-20 bg-surface border border-border rounded shadow-xl flex items-center justify-center -rotate-12"><FileText size={24} className="text-text-muted" /></motion.div>
                <ArrowRight size={24} className="text-primary opacity-50" />
                <div className="flex flex-col gap-4">
                  <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-3 bg-primary/10 border border-primary/30 px-4 py-2 rounded-lg"><Tag size={16} className="text-primary"/> <span className="text-sm font-bold text-primary">Invoices</span></motion.div>
                  <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-3 bg-accent/10 border border-accent/30 px-4 py-2 rounded-lg"><Tag size={16} className="text-accent"/> <span className="text-sm font-bold text-accent">Contracts</span></motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {step.id === 'extract' && (
            <motion.div key="extract" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center p-8">
              <div className="relative w-64 h-80 bg-surface border border-border rounded-lg p-6 font-serif text-sm text-text-muted/40 shadow-2xl overflow-hidden">
                <div className="mb-4">Invoice #9923</div>
                <div className="h-2 w-full bg-border rounded mb-2"></div>
                <div className="h-2 w-3/4 bg-border rounded mb-8"></div>
                <div>Total: $4,500.00</div>
                
                {/* Laser scan */}
                <motion.div animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 4, ease: 'linear', repeat: Infinity }} className="absolute left-0 w-full h-[2px] bg-primary shadow-[0_0_20px_var(--color-primary-glow)] z-10" />
                
                {/* Cleaned text appearing */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="absolute bottom-6 right-6 bg-bg border border-primary/30 px-3 py-1 rounded text-primary font-mono text-xs font-bold">
                  Data Cleaned ✓
                </motion.div>
              </div>
            </motion.div>
          )}

          {step.id === 'structure' && (
            <motion.div key="structure" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center p-8 bg-[#1e1e1e]">
              <div className="font-mono text-sm leading-relaxed text-[#d4d4d4] w-full max-w-md">
                <div><span className="text-[#569cd6]">{"{"}</span></div>
                <div className="pl-4">
                  <span className="text-[#9cdcfe]">"document_type"</span>: <span className="text-[#ce9178]">"Invoice"</span>,<br/>
                  <span className="text-[#9cdcfe]">"confidence_score"</span>: <span className="text-[#b5cea8]">0.98</span>,<br/>
                  <span className="text-[#9cdcfe]">"extracted_fields"</span>: <span className="text-[#569cd6]">{"{"}</span>
                </div>
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="pl-8 bg-primary/20 -mx-4 px-4 py-1 border-l-2 border-primary">
                  <span className="text-[#9cdcfe]">"vendor"</span>: <span className="text-[#ce9178]">"Acme Corp"</span>,
                </motion.div>
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 }} className="pl-8 bg-accent/20 -mx-4 px-4 py-1 border-l-2 border-accent">
                  <span className="text-[#9cdcfe]">"total_amount"</span>: <span className="text-[#b5cea8]">4500.00</span>
                </motion.div>
                <div className="pl-4"><span className="text-[#569cd6]">{"}"}</span></div>
                <div><span className="text-[#569cd6]">{"}"}</span></div>
              </div>
            </motion.div>
          )}

          {step.id === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col p-8 justify-end gap-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="self-end max-w-[80%] bg-primary/20 border border-primary/30 rounded-2xl rounded-tr-sm p-3 text-sm">
                Does this contract auto-renew?
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="self-start max-w-[90%] bg-surface border border-border rounded-2xl rounded-tl-sm p-4 text-sm leading-relaxed">
                Yes, the contract auto-renews for a 12-month term unless canceled 30 days prior.
                <div className="mt-2 inline-flex items-center gap-1 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded border border-primary/30">
                  <Layers size={10}/> Section 4.2
                </div>
              </motion.div>
              <div className="mt-4 bg-surface border border-border rounded-lg p-3 text-sm text-text-muted flex items-center gap-2">
                <MessageSquare size={16}/> Ask anything...
              </div>
            </motion.div>
          )}

          {step.id === 'automate' && (
            <motion.div key="automate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-surface border border-border rounded-xl flex items-center justify-center shadow-[0_0_30px_var(--color-primary-glow)]">
                  <FileJson size={24} className="text-primary" />
                </div>
                <div className="relative w-24 h-px bg-border">
                  <motion.div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary" animate={{ left: ['0%', '100%'] }} transition={{ duration: 1.5, repeat: Infinity }} />
                </div>
                <div className="flex flex-col gap-4">
                  <div className="w-12 h-12 bg-surface border border-border rounded-lg flex items-center justify-center"><Share2 size={16} className="text-accent" /></div>
                  <div className="w-12 h-12 bg-surface border border-border rounded-lg flex items-center justify-center"><Download size={16} className="text-success" /></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT PANEL: EXPLANATION SIDEBAR (40%) */}
      <div className="w-2/5 bg-surface/50 flex flex-col justify-center p-6 gap-2">
        {DEMO_STEPS.map((s, idx) => {
          const isActive = idx === activeStep;
          const Icon = s.icon;
          
          return (
            <div 
              key={s.id}
              onClick={() => setActiveStep(idx)}
              className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border ${isActive ? 'bg-bg border-primary/30 shadow-lg' : 'bg-transparent border-transparent hover:bg-bg/50'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-primary/20 text-primary' : 'bg-surface border border-border text-text-muted'}`}>
                  <Icon size={16} />
                </div>
                <h3 className={`font-bold text-sm ${isActive ? 'text-text' : 'text-text-muted'}`}>
                  {s.title}
                </h3>
              </div>
              
              <AnimatePresence>
                {isActive && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-text-muted leading-relaxed mt-2 pl-11">
                      {s.desc}
                    </p>
                    {/* Progress Bar inside active step */}
                    <div className="mt-4 h-[2px] w-full bg-surface rounded overflow-hidden">
                      <motion.div 
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: STEP_DURATION / 1000, ease: 'linear' }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────
   HERO SECTION
   ──────────────────────────────────────── */
const wordVariants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
  visible: (i) => ({
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' }
  }),
};

export default function Hero() {
  
  const line1 = ['The', 'AI', 'brain', 'for'];
  const line2 = ['enterprise', 'document', 'workflows.'];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-40 pb-16 z-10 overflow-hidden">
      
      {/* Background: Processing Matrix */}
      <BgMatrix />

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-6xl mx-auto">
        
        {/* Main headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-center tracking-tighter leading-[1.05] mb-8 max-w-5xl">
          <span className="block drop-shadow-2xl">
            {line1.map((word, i) => (
              <motion.span key={i} custom={i} variants={wordVariants} initial="hidden" animate="visible" className="inline-block mr-[0.3em] text-text">
                {word}
              </motion.span>
            ))}
          </span>
          <span className="block drop-shadow-[0_0_30px_var(--color-primary-glow)]">
            {line2.map((word, i) => (
              <motion.span key={i} custom={i + line1.length} variants={wordVariants} initial="hidden" animate="visible" className="inline-block mr-[0.3em] gradient-text-animated">
                {word}
              </motion.span>
            ))}
          </span>
        </h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-lg md:text-xl text-text-muted text-center max-w-2xl mb-12 leading-relaxed bg-bg/20 backdrop-blur-sm rounded-xl p-2"
        >
          Extract structured data instantly. Unlock the actionable intelligence trapped inside your messy documents and scale your automation.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-24"
        >
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 40px var(--color-primary-glow)' }}
            whileTap={{ scale: 0.97 }}
            className="px-8 py-4 rounded-xl bg-primary text-bg font-bold text-base flex items-center gap-2 glow transition-all group"
          >
            Start Building Free
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-8 py-4 rounded-xl border border-border bg-surface/80 backdrop-blur-md text-text font-semibold text-base flex items-center gap-2 hover:bg-surface-hover hover:border-primary/30 transition-all"
          >
            <Play size={16} />
            Watch Demo
          </motion.button>
        </motion.div>

        {/* New Interactive Split-Panel Demo */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.8, ease: 'easeOut' }}
          className="w-full max-w-5xl relative z-20"
        >
          {/* Outer glow ring */}
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-b from-primary/20 via-transparent to-accent/20 opacity-40 blur-xl" />
          <SplitPanelDemo />
        </motion.div>

      </div>
    </section>
  );
}
