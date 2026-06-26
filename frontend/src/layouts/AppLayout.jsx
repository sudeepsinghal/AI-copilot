import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FolderKanban, CheckSquare, 
  Workflow, Cpu, Settings, LogOut, Hexagon
} from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/workspace', label: 'Workspace', icon: FolderKanban },
  { path: '/review', label: 'Review Queue', icon: CheckSquare },
  { path: '/pipelines', label: 'Pipelines', icon: Workflow },
  { path: '/models', label: 'Custom Models', icon: Cpu },
];

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen w-full bg-bg overflow-hidden text-text font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 h-full bg-surface border-r border-border flex flex-col relative z-20">
        
        {/* Logo / Brand */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-border/50">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_var(--color-primary-glow)]">
            <Hexagon size={18} fill="currentColor" />
          </div>
          <span className="font-black tracking-tight text-lg">AI Copilot</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group
                  ${isActive ? 'text-text font-medium' : 'text-text-muted hover:text-text hover:bg-surface-hover'}
                `}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-lg z-0"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon size={18} className={`relative z-10 ${isActive ? 'text-primary' : 'group-hover:text-text'}`} />
                <span className="relative z-10 text-sm">{item.label}</span>
                
                {/* Active left border indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border/50 space-y-2">
          <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors">
            <Settings size={18} />
            <span className="text-sm">Settings</span>
          </button>
          <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors">
            <LogOut size={18} />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-full relative overflow-hidden bg-[#0d0d0d]">
        <Outlet />
      </main>

    </div>
  );
}
