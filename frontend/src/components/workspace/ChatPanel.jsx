import React, { useEffect, useRef, useState } from 'react';
import { Send, Loader2, User, Sparkles, FileText } from 'lucide-react';
import { api } from '../../lib/api';
import ProviderSelector from './ProviderSelector';

/**
 * Chat thread for a single conversation. Loads its history, sends questions to
 * /ask with the conversation_id (so the backend keeps memory + scopes retrieval
 * to the conversation's document), and renders answers with their sources.
 *
 * Citations are clickable — onCitationClick(source) lets the parent scroll the
 * document viewer to the cited page + line.
 */
export default function ChatPanel({
  conversation,
  documentName,
  onFirstMessage,
  onCitationClick,
  llmChoice,
  onLlmChange,
}) {
  const [messages, setMessages] = useState(conversation?.messages || []);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    setMessages(conversation?.messages || []);
    setError('');
  }, [conversation?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = async () => {
    const query = input.trim();
    if (!query || sending || !conversation?.id) return;

    const wasEmpty = messages.length === 0;
    setInput('');
    setError('');
    setMessages((m) => [...m, { role: 'user', content: query, _local: true }]);
    setSending(true);

    try {
      const res = await api.ask({
        query,
        conversationId: conversation.id,
        provider: llmChoice?.provider,
        model: llmChoice?.model,
      });
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: res.answer, sources: res.sources, provider: res.provider },
      ]);
      if (wasEmpty) onFirstMessage?.(); // title was auto-set server-side; refresh sidebar
    } catch (e) {
      setError(e.message || 'Something went wrong.');
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: `⚠️ ${e.message || 'Request failed.'}`, _error: true },
      ]);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-2.5 flex items-center gap-2 flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-success animate-pulse flex-shrink-0" />
        <h3 className="font-semibold text-sm truncate">{conversation?.title || 'Chat'}</h3>
        {documentName && (
          <span className="inline-flex items-center gap-1 text-xs text-text-muted truncate min-w-0">
            <FileText size={12} className="flex-shrink-0" /> <span className="truncate">{documentName}</span>
          </span>
        )}
        <div className="ml-auto flex-shrink-0">
          <ProviderSelector value={llmChoice} onChange={onLlmChange} />
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && !sending && (
          <div className="h-full flex flex-col items-center justify-center text-text-muted text-center">
            <Sparkles size={28} className="text-primary/60 mb-3" />
            <p className="text-sm">
              Ask anything about {documentName ? `“${documentName}”` : 'your documents'}.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                m.role === 'user' ? 'bg-primary/20 text-primary' : 'bg-surface border border-border text-text-muted'
              }`}
            >
              {m.role === 'user' ? <User size={15} /> : <Sparkles size={15} />}
            </div>
            <div className={`max-w-[80%] ${m.role === 'user' ? 'text-right' : ''}`}>
              <div
                className={`inline-block px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap text-left ${
                  m.role === 'user'
                    ? 'bg-primary/15 border border-primary/20'
                    : m._error
                    ? 'bg-danger/10 border border-danger/30 text-danger'
                    : 'bg-surface border border-border/60'
                }`}
              >
                {m.content}
              </div>
              {m.sources?.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted/70">Citations — click to verify</p>
                  <div className="flex flex-wrap gap-1.5">
                    {m.sources.map((s, j) => (
                      <button
                        key={j}
                        onClick={() => onCitationClick?.(s)}
                        title={s.snippet}
                        className="inline-flex items-center gap-1 text-[10px] text-text-muted bg-surface border border-border/50 rounded px-1.5 py-1 hover:border-primary/50 hover:text-primary transition-colors max-w-full"
                      >
                        <FileText size={10} className="flex-shrink-0" />
                        <span className="truncate">{s.filename || 'source'}</span>
                        {s.page_number ? <span className="flex-shrink-0">· p{s.page_number}</span> : null}
                        {s.line_start ? (
                          <span className="flex-shrink-0">
                            · L{s.line_start}
                            {s.line_end && s.line_end !== s.line_start ? `–${s.line_end}` : ''}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted flex-shrink-0">
              <Sparkles size={15} />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-surface border border-border/60 text-sm text-text-muted">
              <Loader2 size={14} className="animate-spin" /> Thinking…
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 flex-shrink-0">
        {error && <p className="text-xs text-danger mb-2 px-1">{error}</p>}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Ask a question…"
            disabled={sending}
            className="flex-1 resize-none bg-surface border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 max-h-32"
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className="w-10 h-10 rounded-xl bg-primary text-bg flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex-shrink-0"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
