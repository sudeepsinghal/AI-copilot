import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAuthErrorMessage } from '../lib/authErrors';
import { 
  Hexagon, ChevronRight, Sparkles, Database, Mail, FolderHeart, 
  Cloud, TerminalSquare, FileJson, MessageSquare, Workflow
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   CINEMATIC PRODUCT DEMO — A continuous, single-scene animation
   that plays inside a mock app window, showing the full product
   flow using the user's specific enterprise connectors.
   ═══════════════════════════════════════════════════════════════ */

const TOTAL_DURATION = 25; // seconds for one full loop

const CinematicDemo = () => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => (prev + 0.05) % TOTAL_DURATION);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Phase boundaries (in seconds)
  const phase = 
    elapsed < 5 ? 'ingest' :
    elapsed < 10 ? 'extract' :
    elapsed < 15 ? 'structure' :
    elapsed < 20 ? 'chat' :
    'export';

  const phaseProgress = 
    phase === 'ingest' ? elapsed / 5 :
    phase === 'extract' ? (elapsed - 5) / 5 :
    phase === 'structure' ? (elapsed - 10) / 5 :
    phase === 'chat' ? (elapsed - 15) / 5 :
    (elapsed - 20) / 5;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6">
      
      {/* ── Mock App Window (Browser Chrome) ── */}
      <div className="w-full max-w-[500px] rounded-2xl overflow-hidden border border-border/60 bg-[#0a0a0c] shadow-[0_20px_80px_rgba(0,0,0,0.8),0_0_60px_rgba(255,229,0,0.06)]">
        
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-surface/60 border-b border-border/40 relative z-20">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-3 py-0.5 rounded bg-bg/60 text-[10px] text-text-muted font-mono flex items-center gap-1.5">
              <Hexagon size={8} className="text-primary" />
              AI Copilot Studio
            </div>
          </div>
        </div>

        {/* App Content Area */}
        <div className="relative h-[400px] overflow-hidden bg-bg/90">
          
          {/* ──────── PERSISTENT: Workspace Background Grid ──────── */}
          <div className="absolute inset-0 dot-grid opacity-30" />

          {/* ──────── PHASE 1: INGEST & CLASSIFY ──────── */}
          {/* Showing data coming from Drive, SharePoint, Email, REST API */}
          <AnimatePresence>
            {(phase === 'ingest') && (
              <motion.div 
                key="ingest"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.5 } }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {/* Central AI Hub */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [0.8, 1.05, 1], boxShadow: ['0 0 0px transparent', '0 0 40px rgba(255,229,0,0.3)', '0 0 20px rgba(255,229,0,0.1)'] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                    className="w-20 h-20 rounded-full bg-primary/10 border border-primary/50 flex flex-col items-center justify-center glow z-20"
                  >
                    <Hexagon size={24} className="text-primary" />
                    <span className="text-[8px] font-bold mt-1 tracking-widest text-primary">CORE</span>
                  </motion.div>

                  {/* Input Nodes */}
                  <InputNode icon={Cloud} label="Google Drive" delay={0.2} x={-120} y={-80} phaseProgress={phaseProgress} />
                  <InputNode icon={Database} label="SharePoint" delay={0.4} x={120} y={-80} phaseProgress={phaseProgress} />
                  <InputNode icon={Mail} label="Outlook/Gmail" delay={0.6} x={-120} y={80} phaseProgress={phaseProgress} />
                  <InputNode icon={TerminalSquare} label="REST API" delay={0.8} x={120} y={80} phaseProgress={phaseProgress} />

                  {/* Document travelling from an input node */}
                  {phaseProgress > 0.4 && (
                    <motion.div
                      initial={{ x: -120, y: -80, scale: 0.2, opacity: 0 }}
                      animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="absolute z-30 w-16 h-20 bg-surface border border-border shadow-2xl rounded flex items-center justify-center"
                    >
                      <div className="text-[6px] font-mono opacity-50 p-1">Unstructured Invoice Data</div>
                    </motion.div>
                  )}

                  {/* Classification Badge */}
                  {phaseProgress > 0.7 && (
                    <motion.div
                      initial={{ y: 20, opacity: 0, scale: 0.8 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', damping: 12 }}
                      className="absolute z-40 bottom-16 flex items-center gap-1.5 bg-accent/20 border border-accent/50 rounded-full px-4 py-1.5 shadow-[0_0_20px_rgba(255,0,128,0.3)]"
                    >
                      <Sparkles size={12} className="text-accent" />
                      <span className="text-[11px] font-bold text-accent tracking-wide uppercase">Invoice Detected</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ──────── PHASE 2: SMART EXTRACTION ──────── */}
          {/* Laser scanning and data highlighting */}
          <AnimatePresence>
            {phase === 'extract' && (
              <motion.div
                key="extract"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.4 } }}
                className="absolute inset-0 p-6 flex items-center justify-center"
              >
                <div className="w-full max-w-[320px] h-[340px] bg-[#0c0c0f] border border-border/50 rounded-xl relative overflow-hidden p-6">
                  <div className="w-1/3 h-2 bg-border/40 rounded mb-6" />
                  
                  <div className="space-y-4 relative">
                    {[
                      { l: 'Vendor', v: 'Amazon Web Services', d: 0.2 },
                      { l: 'Date', v: 'Oct 15, 2026', d: 0.4 },
                      { l: 'Total', v: '$4,520.00', d: 0.6 },
                    ].map((field, i) => {
                      const active = phaseProgress > field.d;
                      return (
                        <div key={i} className="flex flex-col gap-1">
                          <div className="w-1/4 h-1.5 bg-border/20 rounded" />
                          <div className="relative inline-block w-fit">
                            <span className={`text-xs font-mono transition-colors duration-500 ${active ? 'text-text' : 'text-text-muted/30'}`}>
                              {field.v}
                            </span>
                            {active && (
                              <motion.div
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute -inset-1 border border-primary bg-primary/10 rounded flex items-center justify-end"
                              >
                                <span className="absolute -right-14 text-[6px] font-bold text-primary bg-primary/20 px-1 rounded uppercase tracking-wider">Extracted</span>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Scanning laser line */}
                    <motion.div
                      animate={{ top: ['0%', '100%'] }}
                      transition={{ duration: 2.5, ease: 'linear', repeat: Infinity }}
                      className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_15px_rgba(255,0,128,0.8)] z-10"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ──────── PHASE 3: STRUCTURE DATA ──────── */}
          {/* JSON generation */}
          <AnimatePresence>
            {phase === 'structure' && (
              <motion.div
                key="structure"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.4 } }}
                className="absolute inset-0 p-6 flex flex-col"
              >
                <div className="w-full flex-1 bg-[#0c0c0f] border border-border/50 rounded-xl relative flex flex-col">
                  <div className="px-4 py-2 border-b border-border/30 flex items-center gap-2 bg-surface/30">
                    <FileJson size={12} className="text-primary" />
                    <span className="text-[10px] font-bold">Structured Payload</span>
                  </div>
                  <div className="p-4 font-mono text-[11px] leading-[2]">
                    <span className="text-text-muted/50">{'{'}</span><br/>
                    {[
                      { k: 'source', v: '"Google Drive"', d: 0.1, c: 'text-[#ce9178]' },
                      { k: 'type', v: '"Invoice"', d: 0.3, c: 'text-[#ce9178]' },
                      { k: 'vendor', v: '"AWS"', d: 0.5, c: 'text-[#ce9178]' },
                      { k: 'amount', v: '4520.00', d: 0.7, c: 'text-primary' },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: phaseProgress > item.d ? 1 : 0, x: phaseProgress > item.d ? 0 : -10 }}
                        className="pl-4"
                      >
                        <span className="text-[#9cdcfe]">"{item.k}"</span>
                        <span className="text-text-muted/50">: </span>
                        <span className={item.c}>{item.v}</span>
                        <span className="text-text-muted/50">,</span>
                      </motion.div>
                    ))}
                    <span className="text-text-muted/50">{'}'}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ──────── PHASE 4: CHAT & SEARCH ──────── */}
          {/* Conversational interface */}
          <AnimatePresence>
            {phase === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.4 } }}
                className="absolute inset-0 p-6 flex flex-col justify-end"
              >
                <div className="w-full bg-[#0c0c0f] border border-border/50 rounded-xl flex flex-col h-full shadow-2xl">
                  <div className="p-3 border-b border-border/30 flex items-center gap-2">
                    <MessageSquare size={12} className="text-primary" />
                    <span className="text-[10px] font-bold">Talk to Data</span>
                  </div>
                  <div className="flex-1 p-4 flex flex-col gap-3 justify-end overflow-hidden">
                    {phaseProgress > 0.1 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="self-end bg-surface border border-border/60 rounded-xl rounded-tr-sm px-3 py-2 text-[11px] max-w-[80%]">
                        <TypewriterText text="Did AWS bill us?" active={phaseProgress > 0.1} />
                      </motion.div>
                    )}
                    {phaseProgress > 0.5 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="self-start bg-primary/10 border border-primary/30 rounded-xl rounded-tl-sm px-3 py-2 text-[11px] max-w-[90%] shadow-[0_0_15px_rgba(255,229,0,0.1)]">
                        Yes, an invoice for <strong className="text-primary">$4,520.00</strong> was ingested from Google Drive today.
                        <div className="mt-1 text-[8px] bg-bg/50 px-1 py-0.5 rounded border border-border inline-block text-text-muted">Source: Google Drive/Invoices</div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ──────── PHASE 5: AUTOMATE & EXPORT (Pipeline Builder) ──────── */}
          {/* Visual Node Editor showing Webhooks, Salesforce, Sheets */}
          <AnimatePresence>
            {phase === 'export' && (
              <motion.div
                key="export"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.4 } }}
                className="absolute inset-0 p-6 flex flex-col"
              >
                <div className="w-full h-full bg-[#0a0a0c] border border-border/40 rounded-xl relative overflow-hidden dot-grid">
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-surface/80 px-2 py-1 rounded border border-border/50 backdrop-blur">
                    <Workflow size={10} className="text-primary" />
                    <span className="text-[8px] font-bold tracking-widest uppercase">Pipeline Builder</span>
                  </div>

                  {/* Central Hub Node */}
                  <div className="absolute top-1/2 left-8 -translate-y-1/2 w-28 bg-surface border border-primary/50 rounded-lg p-2 shadow-[0_0_20px_rgba(255,229,0,0.15)] z-20">
                    <div className="text-[9px] font-bold text-primary mb-1">Structured Data</div>
                    <div className="text-[7px] text-text-muted">AWS Invoice Data</div>
                  </div>

                  {/* Lines connecting to outputs */}
                  {phaseProgress > 0.2 && (
                    <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
                      <motion.path 
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }}
                        d="M 140 200 C 200 200, 200 100, 260 100" fill="none" stroke="rgba(255,229,0,0.3)" strokeWidth="2"
                      />
                      <motion.path 
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.2 }}
                        d="M 140 200 C 200 200, 200 200, 260 200" fill="none" stroke="rgba(255,229,0,0.3)" strokeWidth="2"
                      />
                      <motion.path 
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.4 }}
                        d="M 140 200 C 200 200, 200 300, 260 300" fill="none" stroke="rgba(255,229,0,0.3)" strokeWidth="2"
                      />
                      
                      {/* Energy pulses on lines */}
                      {phaseProgress > 0.5 && (
                        <>
                          <circle r="3" fill="#FFE500" filter="drop-shadow(0 0 5px #FFE500)"><animateMotion dur="2s" repeatCount="indefinite" path="M 140 200 C 200 200, 200 100, 260 100" /></circle>
                          <circle r="3" fill="#FFE500" filter="drop-shadow(0 0 5px #FFE500)"><animateMotion dur="2s" repeatCount="indefinite" path="M 140 200 C 200 200, 200 200, 260 200" /></circle>
                          <circle r="3" fill="#FFE500" filter="drop-shadow(0 0 5px #FFE500)"><animateMotion dur="2s" repeatCount="indefinite" path="M 140 200 C 200 200, 200 300, 260 300" /></circle>
                        </>
                      )}
                    </svg>
                  )}

                  {/* Output Nodes */}
                  <OutputNode label="Salesforce CRM" status="Synced" delay={0.4} top="100px" phaseProgress={phaseProgress} />
                  <OutputNode label="Webhook / REST API" status="POST 200 OK" delay={0.6} top="200px" phaseProgress={phaseProgress} />
                  <OutputNode label="Google Sheets" status="Row Added" delay={0.8} top="300px" phaseProgress={phaseProgress} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

// Helper component for Input Nodes in Phase 1
const InputNode = ({ icon: Icon, label, delay, x, y, phaseProgress }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: phaseProgress > delay ? 1 : 0, scale: phaseProgress > delay ? 1 : 0 }}
      transition={{ type: "spring" }}
      className="absolute flex flex-col items-center gap-1 z-10"
      style={{ x, y }}
    >
      <div className="w-10 h-10 rounded-xl bg-surface/80 border border-border flex items-center justify-center shadow-lg">
        <Icon size={16} className="text-text-muted" />
      </div>
      <span className="text-[7px] font-bold text-text-muted uppercase tracking-wider">{label}</span>
    </motion.div>
  );
};

// Helper component for Output Nodes in Phase 5
const OutputNode = ({ label, status, delay, top, phaseProgress }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: phaseProgress > delay ? 1 : 0, x: phaseProgress > delay ? 0 : -20 }}
      className="absolute right-6 w-36 bg-surface/80 border border-border/80 rounded-lg p-2 flex flex-col gap-1 z-20 backdrop-blur-sm"
      style={{ top, transform: 'translateY(-50%)' }}
    >
      <div className="text-[9px] font-bold text-text">{label}</div>
      {phaseProgress > delay + 0.2 && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="text-[7px] text-success font-mono bg-success/10 border border-success/30 px-1 py-0.5 rounded w-fit"
        >
          ✓ {status}
        </motion.div>
      )}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   TYPEWRITER TEXT
   ═══════════════════════════════════════════════════════════════ */
const TypewriterText = ({ text, speed = 40, startDelay = 0, active }) => {
  const [displayed, setDisplayed] = useState('');
  
  useEffect(() => {
    if (!active) return;
    setDisplayed('');
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(interval);
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [active, text, speed, startDelay]);

  return <span>{displayed}<span className="animate-pulse text-primary">|</span></span>;
};

/* ═══════════════════════════════════════════════════════════════
   ANIMATED BACKGROUND
   ═══════════════════════════════════════════════════════════════ */
const AnimatedBackground = () => (
  <>
    <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />
    <motion.div
      animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
      transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] bg-primary/8 pointer-events-none"
    />
    <motion.div
      animate={{ x: [0, -25, 0], y: [0, 30, 0] }}
      transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[150px] bg-accent/8 pointer-events-none"
    />
  </>
);

/* ═══════════════════════════════════════════════════════════════
   SHIMMER BUTTON
   ═══════════════════════════════════════════════════════════════ */
const ShimmerButton = ({ children, className = '', ...props }) => (
  <motion.button
    whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(255,229,0,0.35)' }}
    whileTap={{ scale: 0.97 }}
    className={`relative overflow-hidden ${className}`}
    {...props}
  >
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
      animate={{ x: ['-150%', '250%'] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
    />
    <span className="relative z-10 flex items-center justify-center gap-2">
      {children}
    </span>
  </motion.button>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN SIGN UP PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function AuthPage() {
  const { 
    signup, login, loginWithGoogle, loginWithGithub, 
    checkEmailExists, sendMagicLink, checkIsMagicLink, 
    loginWithMagicLink, setNewPassword 
  } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'

  const taglineWords = ['From', 'raw', 'docs', 'to', 'real', 'answers.'];

  useEffect(() => {
    if (checkIsMagicLink(window.location.href)) {
      setStep(4);
      const savedEmail = window.localStorage.getItem('emailForSignIn');
      if (savedEmail) {
        setEmail(savedEmail);
      }
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    if (step === 1) {
      try {
        setLoading(true);
        const methods = await checkEmailExists(email);
        if (methods.length > 0) {
          setAuthMode('login');
          setStep(2);
        } else {
          // New User! Send magic link.
          await sendMagicLink(email);
          window.localStorage.setItem('emailForSignIn', email);
          setStep(3); // "Check your email"
        }
      } catch (err) {
        // If email enumeration protection is ON, fetchSignInMethodsForEmail throws an error
        setError(getAuthErrorMessage(err.code) || "Please check your email and try again.");
      }
      setLoading(false);
      return;
    }

    if (step === 4) {
      try {
        setLoading(true);
        let emailToUse = email;
        if (!emailToUse) {
           emailToUse = window.prompt("Please confirm your email address");
        }
        await loginWithMagicLink(emailToUse, window.location.href);
        await setNewPassword(password);
        window.localStorage.removeItem('emailForSignIn');
        navigate('/workspace');
      } catch (err) {
        setError(getAuthErrorMessage(err.code) || err.message);
      }
      setLoading(false);
      return;
    }

    // Step 2: Login
    if (step === 2) {
      try {
        setLoading(true);
        await login(email, password);
        navigate('/workspace'); // Or dashboard
      } catch (err) {
        setError(getAuthErrorMessage(err.code));
      }
      setLoading(false);
    }
  }

  async function handleGoogle() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/workspace');
    } catch (err) {
      setError(getAuthErrorMessage(err.code));
    }
    setLoading(false);
  }

  async function handleGithub() {
    try {
      setError('');
      setLoading(true);
      await loginWithGithub();
      navigate('/workspace');
    } catch (err) {
      setError(getAuthErrorMessage(err.code));
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen w-full bg-bg text-text font-sans overflow-hidden">
      
      {/* ═══ LEFT PANE: CINEMATIC DEMO ═══ */}
      <div className="hidden lg:flex flex-col w-1/2 relative overflow-hidden">
        
        <AnimatedBackground />

        {/* Brand Header */}
        <div className="p-8 relative z-10">
          <Link to="/" className="flex items-center gap-3 group w-fit">
            <motion.div 
              whileHover={{ rotate: 30 }}
              className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary group-hover:shadow-[0_0_20px_var(--color-primary-glow)] transition-all"
            >
              <Hexagon size={18} fill="currentColor" />
            </motion.div>
            <span className="font-black text-xl tracking-tight">AI Copilot</span>
          </Link>
        </div>

        {/* Cinematic Demo */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <CinematicDemo />
        </div>

        {/* Bottom tagline */}
        <div className="p-8 pb-12 relative z-10 text-center">
          <h2 className="text-3xl font-black tracking-tighter mb-3">
            {taglineWords.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: 'easeOut' }}
                className={`inline-block mr-[0.3em] ${i >= 4 ? 'gradient-text-animated' : ''}`}
              >
                {word}
              </motion.span>
            ))}
          </h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-sm text-text-muted/70 max-w-xs mx-auto leading-relaxed"
          >
            Connect, extract, query, and automate your documents — all on autopilot.
          </motion.p>
        </div>
      </div>

      {/* ═══ RIGHT PANE: PREMIUM FORM ═══ */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#08080a] relative border-l border-border/20">
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[120px] bg-primary/5 pointer-events-none" />

        <div className="absolute top-8 left-8 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <Hexagon size={14} fill="currentColor" />
            </div>
            <span className="font-black tracking-tight">AI Copilot</span>
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm relative z-10"
        >
          <div className="mb-10">
            <motion.h1 
              key={step + authMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-black tracking-tighter mb-3 gradient-text-animated"
            >
              {step === 1 ? 'Welcome' : 
               step === 3 ? 'Check your email' :
               step === 4 ? 'Create your account' :
               authMode === 'login' ? 'Welcome back' : 'Create your account'}
            </motion.h1>
            <motion.p 
              key={"desc" + step + authMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-text-muted text-sm"
            >
              {step === 1 ? 'Enter your email to sign in or create an account.' :
               step === 3 ? 'We sent a verification link to ' + email :
               step === 4 ? 'Set a secure password to finish creating your account.' :
               authMode === 'login' ? 'Enter your password to log in.' : 
               'Create a password to start automating.'}
            </motion.p>
          </div>

          <form className="space-y-4 mb-6" onSubmit={handleSubmit}>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-3 rounded-xl">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-1.5">
                  <label className="text-[11px] font-bold text-text-muted/80 tracking-wide uppercase ml-0.5">Email</label>
                  <input 
                    type="email" 
                    placeholder="name@company.com" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface/30 border border-border/60 rounded-xl px-4 py-3.5 text-sm text-text placeholder-text-muted/30 outline-none focus:border-primary/60 focus:bg-surface/50 focus:shadow-[0_0_20px_rgba(255,229,0,0.08),inset_0_0_20px_rgba(255,229,0,0.03)] transition-all duration-300"
                  />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-1.5">
                  <div className="flex items-center justify-between ml-0.5 mb-1.5">
                    <label className="text-[11px] font-bold text-text-muted/80 tracking-wide uppercase">Password</label>
                    <button type="button" onClick={() => { setStep(1); setPassword(''); setError(''); }} className="text-[10px] text-primary hover:underline font-bold">Edit Email</button>
                  </div>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface/30 border border-border/60 rounded-xl px-4 py-3.5 text-sm text-text placeholder-text-muted/30 outline-none focus:border-primary/60 focus:bg-surface/50 focus:shadow-[0_0_20px_rgba(255,229,0,0.08),inset_0_0_20px_rgba(255,229,0,0.03)] transition-all duration-300"
                    autoFocus
                  />
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-4 gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary glow border border-primary/30">
                    <Mail size={24} />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs text-text-muted text-center max-w-xs">
                      Click the link we sent to your inbox. You can close this tab safely.
                    </p>
                    <button 
                      type="button" 
                      onClick={() => { setStep(1); setError(''); }} 
                      className="text-[11px] text-primary hover:underline font-bold"
                    >
                      Need to use a different email?
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-1.5">
                  <label className="text-[11px] font-bold text-text-muted/80 tracking-wide uppercase ml-0.5">Set Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface/30 border border-border/60 rounded-xl px-4 py-3.5 text-sm text-text placeholder-text-muted/30 outline-none focus:border-primary/60 focus:bg-surface/50 focus:shadow-[0_0_20px_rgba(255,229,0,0.08),inset_0_0_20px_rgba(255,229,0,0.03)] transition-all duration-300"
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {step !== 3 && (
              <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <ShimmerButton disabled={loading} className="w-full bg-primary text-[#0a0a0a] font-black text-sm py-3.5 rounded-xl mt-2 glow disabled:opacity-50">
                  {step === 1 ? 'Continue' : step === 4 ? 'Complete Setup' : 'Sign In'}
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </ShimmerButton>
              </motion.div>
            )}
          </form>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-border/60" />
            <span className="text-[10px] text-text-muted/50 font-bold tracking-widest uppercase">or</span>
            <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-border/60" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="space-y-2.5">
            <motion.button 
              onClick={handleGoogle}
              disabled={loading}
              whileHover={{ scale: 1.01, borderColor: 'rgba(255,229,0,0.3)' }} 
              whileTap={{ scale: 0.98 }} 
              className="w-full bg-surface/20 border border-border/40 hover:bg-surface/40 rounded-xl py-3 flex items-center justify-center gap-3 transition-all text-sm font-semibold disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </motion.button>
            <motion.button 
              onClick={handleGithub}
              disabled={loading}
              whileHover={{ scale: 1.01, borderColor: 'rgba(255,229,0,0.3)' }} 
              whileTap={{ scale: 0.98 }} 
              className="w-full bg-surface/20 border border-border/40 hover:bg-surface/40 rounded-xl py-3 flex items-center justify-center gap-3 transition-all text-sm font-semibold disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Continue with GitHub
            </motion.button>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
