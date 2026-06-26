import React, { useEffect, useRef, useState } from 'react';
import { Loader2, FileText, AlertCircle, Download, FileSearch, FileType2 } from 'lucide-react';
import { api } from '../../lib/api';

/**
 * Tabbed document viewer:
 *  - "Text"     — extracted text rendered per page with a line-number gutter.
 *                 Citations jump here (scroll to page+line, flash highlight).
 *                 Works for every format (PDF, DOCX, TXT, scanned).
 *  - "Original" — the real file (PDF in an iframe, images inline).
 *
 * `jumpTarget` = { docId, page, line_start, line_end, ts } — set by clicking a
 * citation in the chat. `ts` forces re-trigger even for the same line.
 */
export default function DocumentViewer({ document: doc, jumpTarget }) {
  const [tab, setTab] = useState('text');
  const [pages, setPages] = useState(null);
  const [pagesState, setPagesState] = useState('loading'); // loading|ready|error
  const [pagesError, setPagesError] = useState('');
  const [blobUrl, setBlobUrl] = useState(null);
  const [blobState, setBlobState] = useState('idle'); // idle|loading|ready|error
  const [highlight, setHighlight] = useState(null); // {page, start, end}
  const scrollRef = useRef(null);
  const blobUrlRef = useRef(null);

  const ext = (doc?.file_type || doc?.type || '').toLowerCase();
  const isPdf = ext.includes('pdf');
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].some((t) => ext.includes(t));

  // Load extracted pages (text tab)
  useEffect(() => {
    if (!doc?.id) return;
    setPagesState('loading');
    setPages(null);
    api
      .getDocumentPages(doc.id)
      .then((res) => {
        setPages(res.pages || []);
        setPagesState('ready');
      })
      .catch((e) => {
        setPagesError(e.message || 'Could not load document text.');
        setPagesState('error');
      });
  }, [doc?.id]);

  // Lazily load the original file blob when the Original tab is opened
  useEffect(() => {
    if (tab !== 'original' || !doc?.id || blobUrl) return;
    let cancelled = false;
    setBlobState('loading');
    api
      .getDocumentBlobUrl(doc.id)
      .then((u) => {
        if (cancelled) return URL.revokeObjectURL(u);
        blobUrlRef.current = u;
        setBlobUrl(u);
        setBlobState('ready');
      })
      .catch(() => {
        if (!cancelled) setBlobState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [tab, doc?.id, blobUrl]);

  // Reset blob when the document changes
  useEffect(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setBlobUrl(null);
    setBlobState('idle');
    setTab('text');
  }, [doc?.id]);

  // React to a citation jump
  useEffect(() => {
    if (!jumpTarget || jumpTarget.docId !== doc?.id) return;
    setTab('text');
    setHighlight({ page: jumpTarget.page || 1, start: jumpTarget.line_start, end: jumpTarget.line_end });
    const id = `evline-${jumpTarget.page || 1}-${jumpTarget.line_start || 1}`;
    const timer = setTimeout(() => {
      const el = window.document.getElementById(id);
      if (el && scrollRef.current) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [jumpTarget?.ts]);

  const renderText = () => {
    if (pagesState === 'loading')
      return (
        <Center>
          <Loader2 size={26} className="animate-spin text-primary mb-3" />
          <p className="text-sm text-text-muted">Loading text…</p>
        </Center>
      );
    if (pagesState === 'error')
      return (
        <Center>
          <AlertCircle size={26} className="text-danger mb-3" />
          <p className="text-sm text-text-muted">{pagesError}</p>
        </Center>
      );
    if (!pages?.length)
      return (
        <Center>
          <FileText size={26} className="text-text-muted mb-3" />
          <p className="text-sm text-text-muted">No extracted text available.</p>
        </Center>
      );

    return (
      <div ref={scrollRef} className="h-full overflow-y-auto px-3 py-3 font-mono text-[13px] leading-relaxed">
        {pages.map((pg) => {
          const lines = (pg.text || '').split('\n');
          return (
            <div key={pg.page} className="mb-6">
              <div className="sticky top-0 z-10 bg-surface/90 backdrop-blur px-2 py-1 mb-2 text-[11px] uppercase tracking-wider text-text-muted border-b border-border/50">
                Page {pg.page}
              </div>
              {lines.map((line, idx) => {
                const lineNo = idx + 1;
                const isHl =
                  highlight &&
                  highlight.page === pg.page &&
                  lineNo >= (highlight.start || 0) &&
                  lineNo <= (highlight.end || highlight.start || 0);
                return (
                  <div
                    key={lineNo}
                    id={`evline-${pg.page}-${lineNo}`}
                    className={`flex gap-3 px-2 rounded transition-colors ${
                      isHl ? 'bg-primary/20 ring-1 ring-primary/40' : ''
                    }`}
                  >
                    <span className="select-none text-text-muted/50 w-8 text-right flex-shrink-0">{lineNo}</span>
                    <span className="whitespace-pre-wrap break-words flex-1">{line || ' '}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderOriginal = () => {
    if (blobState === 'loading' || blobState === 'idle')
      return (
        <Center>
          <Loader2 size={26} className="animate-spin text-primary mb-3" />
          <p className="text-sm text-text-muted">Loading original…</p>
        </Center>
      );
    if (blobState === 'error')
      return (
        <Center>
          <AlertCircle size={26} className="text-danger mb-3" />
          <p className="text-sm text-text-muted">Could not load the original file.</p>
        </Center>
      );
    if (isPdf) {
      const src = highlight?.page ? `${blobUrl}#page=${highlight.page}` : blobUrl;
      return <iframe title={doc.name} src={src} className="h-full w-full bg-white" />;
    }
    if (isImage)
      return (
        <div className="h-full overflow-auto flex items-start justify-center p-4 bg-surface/20">
          <img src={blobUrl} alt={doc.name} className="max-w-full rounded-lg shadow-lg" />
        </div>
      );
    return (
      <Center>
        <FileType2 size={36} className="text-primary/50 mb-4" />
        <p className="font-medium mb-1">{doc.name}</p>
        <p className="text-xs text-text-muted mb-4">No visual preview for this type — use the Text tab.</p>
        <a
          href={blobUrl}
          download={doc.name}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-surface-hover transition-colors text-sm"
        >
          <Download size={16} /> Download original
        </a>
      </Center>
    );
  };

  return (
    <div className="h-full w-full flex flex-col">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/60 flex-shrink-0">
        <TabButton active={tab === 'text'} onClick={() => setTab('text')} icon={FileSearch} label="Text" />
        {(isPdf || isImage) && (
          <TabButton active={tab === 'original'} onClick={() => setTab('original')} icon={FileText} label="Original" />
        )}
      </div>
      <div className="flex-1 overflow-hidden">{tab === 'text' ? renderText() : renderOriginal()}</div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active ? 'bg-primary/15 text-primary' : 'text-text-muted hover:text-text hover:bg-surface-hover'
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  );
}

function Center({ children }) {
  return <div className="h-full w-full flex flex-col items-center justify-center text-center p-6">{children}</div>;
}
