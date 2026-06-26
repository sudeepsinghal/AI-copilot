import React, { useEffect, useState } from 'react';
import {
  CheckSquare, Loader2, AlertTriangle, FileText, Check, Download,
  FileSpreadsheet, Inbox, ChevronRight,
} from 'lucide-react';
import DocumentViewer from '../components/workspace/DocumentViewer';
import { api } from '../lib/api';

function ConfidenceBadge({ value }) {
  const pct = Math.round((value || 0) * 100);
  const low = (value || 0) < 0.7;
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${low ? 'bg-danger/15 text-danger' : 'bg-success/15 text-success'}`}>
      {pct}%
    </span>
  );
}

export default function ReviewQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null); // full extraction
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);
  const [jumpTarget, setJumpTarget] = useState(null);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const { extractions } = await api.listExtractions({ status: 'needs_review' });
      setItems(extractions);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const open = async (item) => {
    setEdits({});
    try {
      const full = await api.getExtraction(item.id);
      setActive(full);
    } catch (e) {
      setError(e.message);
    }
  };

  const approve = async () => {
    if (!active) return;
    setSaving(true); setError('');
    try {
      await api.approveExtraction(active.id, edits);
      setActive(null);
      setEdits({});
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const jumpTo = (source) => {
    if (!source) return;
    setJumpTarget({
      docId: source.doc_id || active?.document_id,
      page: source.page_number || 1,
      line_start: source.line_start,
      line_end: source.line_end,
      ts: Date.now(),
    });
  };

  const doExport = async (format) => {
    setExporting(format); setError('');
    try {
      await api.exportExtractions({ status: 'approved', format });
    } catch (e) {
      setError(e.message);
    } finally {
      setExporting('');
    }
  };

  const activeDoc = active?.document_id
    ? { id: active.document_id, name: active.document_name, file_type: active.file_type }
    : null;
  const fieldEntries = active ? Object.entries(active.fields || {}) : [];

  return (
    <div className="h-full w-full flex bg-bg text-text overflow-hidden">
      {/* QUEUE LIST */}
      <div className="w-72 h-full flex-shrink-0 border-r border-border/60 bg-surface/40 flex flex-col">
        <div className="h-14 px-4 flex items-center gap-2 border-b border-border/50 flex-shrink-0">
          <CheckSquare size={18} className="text-primary" />
          <h2 className="font-semibold">Review Queue</h2>
          {items.length > 0 && (
            <span className="ml-auto text-xs bg-danger/15 text-danger px-2 py-0.5 rounded-full">{items.length}</span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-text-muted" /></div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted text-center px-4">
              <Inbox size={28} className="mb-3 opacity-50" />
              <p className="text-sm">Queue is clear.</p>
              <p className="text-xs mt-1">Low-confidence extractions show up here for review.</p>
            </div>
          ) : (
            items.map((it) => (
              <button
                key={it.id}
                onClick={() => open(it)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  active?.id === it.id ? 'bg-primary/10 border-primary/20' : 'border-transparent hover:bg-surface-hover'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-text-muted flex-shrink-0" />
                  <span className="text-sm truncate flex-1">{it.document_name || 'Document'}</span>
                  <ChevronRight size={14} className="text-text-muted" />
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-danger">
                  <AlertTriangle size={11} />
                  {it.needs_review?.length || 0} field{(it.needs_review?.length || 0) === 1 ? '' : 's'} to verify
                </div>
              </button>
            ))
          )}
        </div>
        <div className="p-3 border-t border-border/50 flex-shrink-0 space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-text-muted">Export approved</p>
          <div className="flex gap-2">
            <button
              onClick={() => doExport('csv')}
              disabled={!!exporting}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-border hover:bg-surface-hover text-xs transition-colors disabled:opacity-50"
            >
              {exporting === 'csv' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} CSV
            </button>
            <button
              onClick={() => doExport('xlsx')}
              disabled={!!exporting}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-border hover:bg-surface-hover text-xs transition-colors disabled:opacity-50"
            >
              {exporting === 'xlsx' ? <Loader2 size={13} className="animate-spin" /> : <FileSpreadsheet size={13} />} Excel
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        {error && (
          <div className="px-4 py-2 bg-danger/10 border-b border-danger/30 text-danger text-xs">{error}</div>
        )}
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
            <CheckSquare size={32} className="mb-3 opacity-40" />
            <p className="text-sm">Select an item from the queue to review.</p>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Document */}
            <div className="w-[55%] h-full p-3 border-r border-border/50">
              <div className="h-full glass-card border border-border/50 rounded-xl overflow-hidden">
                {activeDoc ? (
                  <DocumentViewer document={activeDoc} jumpTarget={jumpTarget} />
                ) : (
                  <div className="h-full flex items-center justify-center text-text-muted text-sm">No source document.</div>
                )}
              </div>
            </div>

            {/* Fields editor */}
            <div className="flex-1 h-full flex flex-col">
              <div className="h-14 px-4 flex items-center border-b border-border/50 flex-shrink-0">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate">{active.document_name}</h3>
                  <p className="text-[11px] text-text-muted">Verify the flagged values, then approve.</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {fieldEntries.map(([name, data]) => {
                  const low = (data.confidence || 0) < 0.7;
                  const val = edits[name] !== undefined ? edits[name] : (data.value ?? '');
                  return (
                    <div key={name} className={`rounded-xl border p-3 ${low ? 'border-danger/40 bg-danger/5' : 'border-border/60 bg-surface/30'}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold">{name}</span>
                        <ConfidenceBadge value={data.confidence} />
                      </div>
                      {data.description && <p className="text-[11px] text-text-muted mb-1.5">{data.description}</p>}
                      <input
                        value={val}
                        onChange={(e) => setEdits((p) => ({ ...p, [name]: e.target.value }))}
                        className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary/50"
                      />
                      {data.source && (
                        <button
                          onClick={() => jumpTo(data.source)}
                          title={data.source.snippet}
                          className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-text-muted hover:text-primary transition-colors"
                        >
                          <FileText size={10} /> {data.source.filename} · p{data.source.page_number} · L{data.source.line_start} — verify
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="p-3 border-t border-border/50 flex-shrink-0">
                <button
                  onClick={approve}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-success/15 border border-success/30 text-success font-semibold text-sm hover:bg-success/25 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Approve & save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
