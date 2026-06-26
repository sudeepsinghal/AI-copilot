import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Landmark, HeartPulse, Scale, Truck, 
  FileText, CheckCircle2, ShieldCheck, FileSignature, Box, MapPin, Navigation
} from 'lucide-react';

const INDUSTRIES = [
  {
    id: 'finance',
    name: 'Financial Services',
    icon: Landmark,
    description: 'Automate invoice processing, receipt matching, and tax form extraction.',
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: HeartPulse,
    description: 'Digitize patient records, insurance claims, and prescriptions securely.',
  },
  {
    id: 'legal',
    name: 'Legal',
    icon: Scale,
    description: 'Extract key clauses, entities, and dates from contracts and NDAs.',
  },
  {
    id: 'logistics',
    name: 'Logistics',
    icon: Truck,
    description: 'Process shipping manifests, bills of lading, and customs declarations.',
  }
];

/* =========================================================================
   ANIMATION COMPONENTS
   ========================================================================= */

const FinanceAnimation = () => {
  return (
    <div className="w-full h-full flex items-center justify-between px-8">
      {/* Left: Invoice */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
        className="relative w-64 h-80 bg-surface border border-border rounded-lg p-6 shadow-2xl overflow-hidden font-mono text-xs text-text-muted"
      >
        <div className="text-lg font-bold text-text mb-4">INVOICE #4092</div>
        <div className="space-y-2">
          <div className="w-full h-2 bg-border rounded" />
          <div className="w-3/4 h-2 bg-border rounded" />
        </div>
        
        <div className="mt-8 space-y-4">
          <div className="relative">
            <div>Vendor:</div>
            <div className="text-text font-bold">Acme Corp Ltd.</div>
            <motion.div 
              initial={{ width: 0, opacity: 0 }} 
              animate={{ width: '100%', opacity: 1 }} 
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute inset-0 bg-primary/20 border border-primary/50 rounded z-10" 
            />
          </div>
          <div className="w-full h-12 bg-border/50 rounded" />
          <div className="relative">
            <div>Total Amount:</div>
            <div className="text-lg text-text font-bold">$4,500.00</div>
            <motion.div 
              initial={{ width: 0, opacity: 0 }} 
              animate={{ width: '100%', opacity: 1 }} 
              transition={{ delay: 2, duration: 0.5 }}
              className="absolute inset-0 bg-success/20 border border-success/50 rounded z-10" 
            />
          </div>
        </div>

        {/* Laser Scanner */}
        <motion.div 
          className="absolute left-0 right-0 h-[2px] bg-primary shadow-[0_0_15px_var(--color-primary-glow)] z-20"
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>

      {/* Right: Database UI */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
        className="w-80 bg-bg border border-border rounded-xl shadow-xl overflow-hidden flex flex-col"
      >
        <div className="bg-surface border-b border-border px-4 py-3 flex gap-2 items-center">
          <div className="w-3 h-3 rounded-full bg-error" />
          <div className="w-3 h-3 rounded-full bg-primary" />
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="ml-2 text-xs font-bold text-text-muted">Accounts Payable DB</span>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2 text-[10px] text-text-muted font-bold uppercase border-b border-border pb-2">
            <div>Invoice</div><div>Vendor</div><div>Amount</div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-text items-center opacity-50">
            <div>#4091</div><div>Stark Ind.</div><div>$12,000</div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-text items-center bg-surface/50 p-2 rounded-lg relative overflow-hidden">
            <div>#4092</div>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }} className="text-primary font-bold">Acme Corp</motion.div>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.5 }} className="text-success font-bold">$4,500.00</motion.div>
            <motion.div 
              initial={{ left: '-100%' }} animate={{ left: '100%' }} transition={{ duration: 1, delay: 2.5 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const HealthcareAnimation = () => {
  return (
    <div className="w-full h-full flex items-center justify-between px-8">
      {/* Left: Handwritten Patient Form */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
        className="relative w-64 h-80 bg-[#fdfbf7] border border-border rounded-lg p-6 shadow-2xl text-bg"
      >
        <div className="flex justify-between items-center border-b border-border/20 pb-4 mb-4">
          <HeartPulse size={24} className="text-error" />
          <div className="text-xs font-bold">INTAKE FORM</div>
        </div>
        
        <div className="space-y-6 text-sm">
          <div>
            <div className="text-[10px] text-text-muted/60 uppercase">Patient Name</div>
            {/* Wavy lines simulating handwriting */}
            <motion.div 
              initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 1.5, duration: 0.5 }}
              className="w-3/4 h-4 border-b-2 border-dashed border-text/40 mt-1" 
              style={{ backgroundImage: 'radial-gradient(circle at 4px 4px, #333 1px, transparent 0)', backgroundSize: '8px 8px', backgroundRepeat: 'repeat-x' }}
            />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="font-serif italic font-bold mt-[-16px]">John Doe</motion.div>
          </div>
          <div>
            <div className="text-[10px] text-text-muted/60 uppercase">Diagnosis Code</div>
            <motion.div 
              initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 2.5, duration: 0.5 }}
              className="w-1/2 h-4 border-b-2 border-dashed border-text/40 mt-1" 
            />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }} className="font-serif italic font-bold text-error mt-[-16px]">ICD-10: I10</motion.div>
          </div>
        </div>

        {/* Magnifying Glass Scanner */}
        <motion.div 
          className="absolute w-full h-16 bg-accent/10 border-y border-accent/30 backdrop-blur-[2px] z-20 flex items-center shadow-[0_0_20px_var(--color-accent-glow)]"
          animate={{ top: ['0%', '80%', '0%'] }}
          transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
        />
      </motion.div>

      {/* Right: EHR Dashboard */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
        className="w-80 bg-surface border border-border rounded-xl shadow-xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-text">EHR System</div>
            <div className="text-xs text-text-muted">Verified Record</div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-bg border border-border rounded-lg p-3 flex justify-between items-center">
            <span className="text-xs text-text-muted">Name</span>
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }} className="text-sm font-bold">John Doe</motion.span>
          </div>
          <div className="bg-bg border border-border rounded-lg p-3 flex justify-between items-center">
            <span className="text-xs text-text-muted">Condition</span>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2.8 }} className="bg-error/20 text-error border border-error/30 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
              Hypertension
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.2 }} className="w-full flex items-center justify-center gap-2 text-success text-xs font-bold mt-4">
            <CheckCircle2 size={16} /> Data Synced Securely
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

const LegalAnimation = () => {
  return (
    <div className="w-full h-full flex items-center justify-between px-8">
      {/* Left: Contract */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
        className="relative w-64 h-80 bg-surface border border-border rounded-lg p-6 shadow-2xl overflow-hidden"
      >
        <div className="text-center font-serif text-sm font-bold border-b border-border pb-2 mb-4">NON-DISCLOSURE AGREEMENT</div>
        <div className="space-y-2 text-[8px] text-text-muted leading-relaxed font-serif text-justify">
          <div className="w-full h-1 bg-border rounded" />
          <div className="w-full h-1 bg-border rounded" />
          <div className="w-3/4 h-1 bg-border rounded" />
          <br/>
          <div className="relative">
            The Receiving Party agrees to maintain the Confidential Information in strict confidence for a period of <span className="font-bold text-text">five (5) years</span> from the Effective Date, and shall not disclose such information to any third party without prior written consent.
            <motion.div 
              className="absolute inset-0 bg-primary/30 mix-blend-screen origin-left"
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1, duration: 1 }}
            />
          </div>
          <br/>
          <div className="w-full h-1 bg-border rounded" />
          <div className="w-1/2 h-1 bg-border rounded" />
        </div>
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
          <FileSignature size={24} className="text-text-muted" />
          <div className="w-16 h-8 border-b border-border" />
        </div>
      </motion.div>

      {/* Right: Compliance UI */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
        className="w-80 bg-bg border border-border rounded-xl shadow-xl overflow-hidden"
      >
        <div className="bg-surface px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="text-xs font-bold">Contract Analysis</div>
          <div className="bg-success/20 text-success text-[10px] px-2 py-0.5 rounded font-bold">COMPLIANT</div>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={16} className="text-success mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-text">Parties Identified</div>
              <div className="text-[10px] text-text-muted">Standard Clause present</div>
            </div>
          </div>
          <motion.div 
            initial={{ opacity: 0.5, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.2 }}
            className="flex items-start gap-3 bg-surface border border-primary/30 p-3 rounded-lg relative overflow-hidden"
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.5 }} className="mt-0.5 flex-shrink-0">
              <CheckCircle2 size={16} className="text-primary" />
            </motion.div>
            <div className="z-10">
              <div className="text-xs font-bold text-text">Term Duration</div>
              <div className="text-[10px] text-primary font-mono mt-1">Found: 5 Years</div>
            </div>
            <motion.div className="absolute inset-0 bg-primary/5" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

const LogisticsAnimation = () => {
  return (
    <div className="w-full h-full flex items-center justify-between px-8">
      {/* Left: Bill of Lading */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
        className="relative w-64 h-80 bg-[#e8e6e1] text-bg border border-border rounded-lg p-6 shadow-2xl overflow-hidden"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="font-black text-xl tracking-tighter">FREIGHT</div>
          <Box size={24} className="text-bg/50" />
        </div>

        {/* Barcode */}
        <div className="w-full h-12 flex gap-1 items-end justify-center mb-6 relative">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`bg-bg ${i%2===0 ? 'w-1' : i%3===0 ? 'w-2' : 'w-0.5'} h-full`} />
          ))}
          {/* Laser Scanner */}
          <motion.div 
            className="absolute top-0 bottom-0 w-[2px] bg-error shadow-[0_0_10px_rgba(255,0,0,0.8)] z-10"
            animate={{ left: ['0%', '100%', '0%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs font-bold mb-4">
          <div>
            <div className="text-[8px] text-bg/60 uppercase">Tracking No.</div>
            <motion.div initial={{ opacity: 0.5 }} animate={{ opacity: 1, scale: [1, 1.1, 1], color: '#d946ef' }} transition={{ delay: 1 }} className="font-mono">TRK-9982</motion.div>
          </div>
          <div>
            <div className="text-[8px] text-bg/60 uppercase">Weight</div>
            <motion.div initial={{ opacity: 0.5 }} animate={{ opacity: 1, scale: [1, 1.1, 1], color: '#d946ef' }} transition={{ delay: 1.5 }}>1,250 kg</motion.div>
          </div>
        </div>

        <div className="w-full h-24 border border-bg/20 rounded flex items-center justify-center text-bg/30 font-bold uppercase text-xs">
          [ Customs Stamp ]
        </div>
      </motion.div>

      {/* Right: Tracking Dashboard */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
        className="w-80 bg-surface border border-border rounded-xl shadow-xl overflow-hidden"
      >
        {/* Map Header */}
        <div className="h-24 bg-[#0a192f] relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
          <motion.div initial={{ x: -50, y: 10 }} animate={{ x: 0, y: 0 }} transition={{ delay: 2 }} className="absolute z-10 text-primary">
            <MapPin size={24} fill="currentColor" />
          </motion.div>
          <motion.svg className="absolute w-full h-full text-primary/30" viewBox="0 0 100 50">
            <motion.path d="M 10 40 Q 50 10 90 20" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" 
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 2, duration: 1 }}
            />
          </motion.svg>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="text-[10px] text-text-muted uppercase">Status</div>
              <motion.div 
                initial={{ color: 'var(--color-text-muted)' }} animate={{ color: 'var(--color-primary)' }} transition={{ delay: 1.2 }}
                className="text-sm font-bold flex items-center gap-2"
              >
                <Navigation size={14} className="animate-pulse" /> In Transit
              </motion.div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-text-muted uppercase">Shipment</div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="font-mono text-xs font-bold">TRK-9982</motion.div>
            </div>
          </div>
          
          <div className="w-full bg-bg rounded-full h-2 mb-2 overflow-hidden">
            <motion.div initial={{ width: '10%' }} animate={{ width: '65%' }} transition={{ delay: 2.5, duration: 1, type: 'spring' }} className="h-full bg-primary rounded-full" />
          </div>
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>Origin</span>
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7 }} className="font-bold">1,250 kg</motion.span>
            <span>Destination</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};


/* =========================================================================
   MAIN COMPONENT
   ========================================================================= */

export default function UseCases() {
  const [activeIndustry, setActiveIndustry] = useState(INDUSTRIES[0]);

  return (
    <section className="py-24 relative z-10 overflow-hidden" id="use-cases">
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black mb-4 tracking-tight"
          >
            Built for every industry <br/>
            <span className="gradient-text-animated">buried in paperwork.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-text-muted max-w-2xl mx-auto"
          >
            Select an industry below to see how AI Copilot transforms unstructured documents into actionable structured data.
          </motion.p>
        </div>

        {/* Animation Display Area */}
        <div className="w-full h-[400px] md:h-[450px] glass-panel mb-12 relative flex items-center justify-center overflow-hidden bg-bg/50">
          <div className="absolute inset-0 dot-grid opacity-20" />
          
          <AnimatePresence mode="wait">
            {activeIndustry.id === 'finance' && <FinanceAnimation key="finance" />}
            {activeIndustry.id === 'healthcare' && <HealthcareAnimation key="healthcare" />}
            {activeIndustry.id === 'legal' && <LegalAnimation key="legal" />}
            {activeIndustry.id === 'logistics' && <LogisticsAnimation key="logistics" />}
          </AnimatePresence>
        </div>

        {/* Industry Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {INDUSTRIES.map((industry) => {
            const isActive = activeIndustry.id === industry.id;
            const Icon = industry.icon;
            return (
              <motion.div
                key={industry.id}
                onClick={() => setActiveIndustry(industry)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`cursor-pointer rounded-xl p-6 border transition-all duration-300 ${
                  isActive 
                    ? 'bg-surface border-primary/50 shadow-[0_0_30px_rgba(255,229,0,0.1)]' 
                    : 'bg-surface/30 border-border hover:bg-surface/50 hover:border-border/80'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg mb-4 flex items-center justify-center ${
                  isActive ? 'bg-primary/20 text-primary' : 'bg-bg text-text-muted'
                }`}>
                  <Icon size={24} />
                </div>
                <h3 className={`font-bold text-lg mb-2 ${isActive ? 'text-text' : 'text-text-muted'}`}>
                  {industry.name}
                </h3>
                <p className="text-sm text-text-muted/80 leading-relaxed">
                  {industry.description}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
