import React, { useEffect, useState } from 'react';
import { Cpu, ChevronDown } from 'lucide-react';
import { api } from '../../lib/api';

/**
 * Compact LLM provider + model picker, populated from the backend /providers
 * endpoint. Only providers with a configured key (or a running Ollama) are
 * selectable. Selection is reported up via onChange({ provider, model }) and
 * remembered in localStorage.
 */
const LS_KEY = 'aicop_llm_choice';

export default function ProviderSelector({ value, onChange }) {
  const [providers, setProviders] = useState({});
  const [open, setOpen] = useState(false);
  const [defaultProvider, setDefaultProvider] = useState('groq');

  useEffect(() => {
    api
      .getProviders()
      .then((res) => {
        setProviders(res);
        setDefaultProvider(res.default_provider || 'groq');
        if (!value?.provider) {
          // Restore last choice or fall back to the backend default
          const saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
          if (saved?.provider) onChange?.(saved);
          else {
            const p = res.default_provider || 'groq';
            onChange?.({ provider: p, model: (res[p]?.models || [])[0] || null });
          }
        }
      })
      .catch(() => {});
  }, []);

  // Build list of usable providers
  const usable = Object.entries(providers).filter(([name, meta]) => {
    if (typeof meta !== 'object' || meta === null) return false;
    if (name === 'ollama') return meta.running && (meta.models || []).length > 0;
    return meta.configured;
  });

  const select = (provider, model) => {
    const choice = { provider, model };
    onChange?.(choice);
    localStorage.setItem(LS_KEY, JSON.stringify(choice));
    setOpen(false);
  };

  const currentProvider = value?.provider || defaultProvider;
  const currentModel = value?.model || (providers[currentProvider]?.models || [])[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:bg-surface-hover transition-colors text-xs text-text-muted max-w-[220px]"
        title="Choose LLM provider and model"
      >
        <Cpu size={13} className="text-primary flex-shrink-0" />
        <span className="truncate">
          {currentProvider}
          {currentModel ? ` · ${currentModel}` : ''}
        </span>
        <ChevronDown size={13} className="flex-shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-30 w-72 max-h-80 overflow-y-auto glass-panel border border-border rounded-xl p-2 shadow-2xl">
            {usable.length === 0 && (
              <p className="text-xs text-text-muted px-2 py-3">
                No providers configured. Add an API key (e.g. GROQ_API_KEY) to the backend .env.
              </p>
            )}
            {usable.map(([name, meta]) => (
              <div key={name} className="mb-1.5">
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-text-muted flex items-center justify-between">
                  <span>{name}</span>
                  {meta.kind && <span className="text-primary/70">{meta.kind}</span>}
                </div>
                {(meta.models || []).map((m) => {
                  const active = currentProvider === name && currentModel === m;
                  return (
                    <button
                      key={m}
                      onClick={() => select(name, m)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors truncate ${
                        active ? 'bg-primary/15 text-primary' : 'hover:bg-surface-hover text-text'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
