import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import Hero from '../components/landing/Hero';
import TrustBar from '../components/landing/TrustBar';
import UseCases from '../components/landing/UseCases';
import PipelineFlow from '../components/landing/PipelineFlow';
import FeatureTabs from '../components/landing/FeatureTabs';
import Comparison from '../components/landing/Comparison';
import Stats from '../components/landing/Stats';
import Security from '../components/landing/Security';

const LandingPage = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Global Background Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full filter blur-[150px] animate-blob opacity-20"
          style={{ background: 'rgb(var(--color-primary) / 0.3)' }} />
        <div className="absolute top-[30%] right-[-15%] w-[500px] h-[500px] rounded-full filter blur-[150px] animate-blob opacity-15"
          style={{ background: 'rgb(var(--color-accent) / 0.25)', animationDelay: '3s' }} />
        <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full filter blur-[150px] animate-blob opacity-10"
          style={{ background: 'rgb(var(--color-primary) / 0.2)', animationDelay: '5s' }} />
      </div>

      {/* ═══ NAVIGATION ═══ */}
      <nav className="fixed top-0 w-full z-50 flex justify-center pt-4 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-panel w-full max-w-6xl px-6 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5 cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover:shadow-[0_0_20px_var(--color-primary-glow)] transition-shadow">
              <Zap size={18} className="text-bg" />
            </div>
            <span className="font-bold text-lg tracking-tight">AI Copilot</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-muted">
            {['Features', 'Use Cases', 'How it Works', 'Security'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="relative py-1 hover:text-text transition-colors group"
              >
                {item}
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button className="text-sm font-medium text-text-muted hover:text-text transition-colors hidden sm:block">
              Sign In
            </button>
            <Link
              to="/signup"
              className="px-5 py-2 rounded-lg bg-primary text-bg text-sm font-semibold hover:shadow-[0_0_20px_var(--color-primary-glow)] transition-shadow inline-block"
            >
              Get Started
            </Link>
          </div>
        </motion.div>
      </nav>

      {/* ═══ SECTIONS ═══ */}
      <Hero />
      <TrustBar />
      <UseCases />
      <div id="how-it-works"><PipelineFlow /></div>
      <FeatureTabs />
      <Comparison />
      <Stats />
      <Security />

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-32 relative z-10 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 max-w-3xl mx-auto">
            Ready to transform your <span className="gradient-text-animated">document workflow?</span>
          </h2>
          <p className="text-text-muted text-lg max-w-xl mx-auto mb-10">
            Join thousands of teams processing documents smarter, not harder.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="px-8 py-4 rounded-xl bg-primary text-bg font-bold text-base flex items-center gap-2 glow transition-all group hover:scale-[1.03] active:scale-95"
            >
              Start Building Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-10 py-4 rounded-xl border border-border bg-surface/30 text-text font-semibold text-base hover:bg-surface-hover transition-all"
            >
              Book a Demo
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-border/30 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Zap size={12} className="text-bg" />
            </div>
            <span className="font-bold tracking-tight text-sm">AI Copilot</span>
          </div>
          <div className="text-xs text-text-muted">
            © 2026 AI Copilot. Open Source Enterprise IDP.
          </div>
          <div className="flex gap-6 text-xs text-text-muted">
            {['GitHub', 'Documentation', 'Privacy'].map((link) => (
              <a key={link} href="#" className="hover:text-text transition-colors relative group">
                {link}
                <span className="absolute bottom-0 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
