import React, { useState } from 'react';
import {
  Plus, Trash2, Loader2, Sparkles, FileText, Check, Download,
  FileSpreadsheet, AlertTriangle, ChevronDown,
} from 'lucide-react';
import { api } from '../../lib/api';
import ProviderSelector from './ProviderSelector';

/* Quick-start field presets for common document types. */
const PRESETS = {
  Invoice: [
    { name: 'invoice_number', description: 'The invoice number / ID' },
    { name: 'vendor', description: 'The vendor or supplier name' },
    { name: 'invoice_date', description: 'The date of the invoice' },
    { name: 'total_amount', description: 'The total amount due' },
  ],
  Resume: [
    { name: 'full_name', description: "The candidate's full name" },
    { name: 'email', description: "The candidate's email address" },
    { name: 'phone', description: "The candidate's phone number" },
    { name: 'skills', description: 'Key skills listed' },
  ],
  Contract: [
    { name: 'parties', description: 'The parties to the agreement' },
    { name: 'effective_date', description: 'The effective / start date' },
    { name: 'term', description: 'The contract term or duration' },
    { name: 'renewal', description: 'Auto-renewal terms, if any' },
  ],
};

function ConfidenceBar({ value }) {
  const pct = Math.round((value || 0) * 100);
  const low = (value || 0) < 0.7;
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 rounded-full bg-surface overflow-hidden">
        <div
          className={`h-full ${low ? 'bg-danger' : 'bg-success'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[10px] ${low ? 'text-danger' : 'text-text-muted'}`}>{pct}%</span>
    </div>
  );
}

export default function ExtractionPanel({
  documentId,
  documentName,
  onCitationClick,
  llmChoice,
  onLlmChange,
}) {
  const [fields, setFields] = useState([{ name: '', description: '' }]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { extraction_id, extracted, needs_review, status }
  const [edits, setEdits] = useState({}); // name -> edited value
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState('');

  const setField = (i, key, val) =>
    setFields((f) => f.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)));
  const addField = () => setFields((f) => [...f, { name: '', description: '' }]);
  const removeField = (i) => setFields((f) => f.filter((_, idx) => idx !== i));
  const applyPreset = (key) => { setFields(PRESETS[key]); setResult(null); };

  const run = async () => {
    const clean = fields.filter((f) => f.name.trim());
    if (clean.length === 0) { setError('Add at least one field with a name.'); return; }
    setRunning(true); setError(''); setResult(null); setEdits({});
    try {
      const res = await api.extract({
        fields: clean.map((f) => ({ name: f.name.trim(), description: f.description.trim() })),
        documentId,
        provider: llmChoice?.provider,
        model: llmChoice?.model,
      });
      setResult(res);
    } catch (e) {
      setError(e.message || 'Extraction failed.');
    } finally {
      setRunning(false);
    }
  };

  const approve = async () => {
    if (!result?.extraction_id) return;
    setSaving(true); setError('');
    try {
      const updated = await api.approveExtraction(result.extraction_id, edits);
      setResult({ ...result, extracted: updated.fields, needs_review: [], status: 'approved' });
      setEdits({});
    } catch (e) {
      setError(e.message || 'Approve failed.');
    } finally {
      setSaving(false);
    }
  };

  const doExport = async (format) => {
    setExporting(format); setError('');
    try {
      await api.exportExtractions({ documentId, format });
    } catch (e) {
      setError(e.message || 'Export failed.');
    } finally {
      setExporting('');
    }
  };

  const entries = result ? Object.entries(result.extracted || {}) : [];

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-2.5 flex items-center gap-2 flex-shrink-0">
        <Sparkles size={15} className="text-primary" />
        <h3 className="font-semibold text-sm">Extract structured data</h3>
        <div className="ml-auto">
          <ProviderSelector value={llmChoice} onChange={onLlmChange} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Field definitions */}
        {!result && (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-text-muted">Presets:</span>
              {Object.keys(PRESETS).map((k) => (
                <button
                  key={k}
                  onClick={() => applyPreset(k)}
                  className="text-xs px-2 py-1 rounded-lg border border-border hover:border-primary/50 hover:text-primary transition-colors"
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {fields.map((f, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    value={f.name}
                    onChange={(e) => setField(i, 'name', e.target.value)}
                    placeholder="field_name"
                    className="w-1/3 bg-surface border border-border rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-primary/50"
                  />
                  <input
                    value={f.description}
                    onChange={(e) => setField(i, 'description', e.target.value)}
                    placeholder="what to extract (description)"
                    className="flex-1 bg-surface border border-border rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-primary/50"
                  />
                  <button
                    onClick={() => removeField(i)}
                    disabled={fields.length === 1}
                    className="p-2 text-text-muted hover:text-danger disabled:opacity-30 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button
                onClick={addField}
                className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors"
              >
                <Plus size={14} /> Add field
              </button>
            </div>

            <button
              onClick={run}
              disabled={running}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-bg font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {running ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {running ? 'Extracting…' : 'Extract fields'}
            </button>
          </>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}

        {/* Results */}
        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    result.status === 'approved'
                      ? 'bg-success/15 text-success border-success/30'
                      : 'bg-danger/15 text-danger border-danger/30'
                  }`}
                >
                  {result.status === 'approved' ? 'Approved' : 'Needs review'}
                </span>
                {result.needs_review?.length > 0 && (
                  <span className="text-[11px] text-text-muted inline-flex items-center gap-1">
                    <AlertTriangle size={11} className="text-danger" />
                    {result.needs_review.length} low-confidence
                  </span>
                )}
              </div>
              <button
                onClick={() => { setResult(null); setEdits({}); }}
                className="text-xs text-text-muted hover:text-text"
              >
                New extraction
              </button>
            </div>

            <div className="space-y-2">
              {entries.map(([name, data]) => {
                const low = (data.confidence || 0) < 0.7 && result.status !== 'approved';
                const editedVal = edits[name] !== undefined ? edits[name] : (data.value ?? '');
                return (
                  <div
                    key={name}
                    className={`rounded-xl border p-3 ${low ? 'border-danger/40 bg-danger/5' : 'border-border/60 bg-surface/30'}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-text">{name}</span>
                      <ConfidenceBar value={data.confidence} />
                    </div>
                    <input
                      value={editedVal}
                      onChange={(e) => setEdits((p) => ({ ...p, [name]: e.target.value }))}
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary/50"
                    />
                    {data.source && (
                      <button
                        onClick={() => onCitationClick?.(data.source)}
                        className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-text-muted hover:text-primary transition-colors"
                        title={data.source.snippet}
                      >
                        <FileText size={10} />
                        {data.source.filename} · p{data.source.page_number} · L{data.source.line_start}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-1">
              {result.status !== 'approved' && (
                <button
                  onClick={approve}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-success/15 border border-success/30 text-success text-sm font-medium hover:bg-success/25 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  Approve & save
                </button>
              )}
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => doExport('csv')}
                  disabled={!!exporting}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-surface-hover text-sm transition-colors disabled:opacity-50"
                >
                  {exporting === 'csv' ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                  CSV
                </button>
                <button
                  onClick={() => doExport('xlsx')}
                  disabled={!!exporting}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-surface-hover text-sm transition-colors disabled:opacity-50"
                >
                  {exporting === 'xlsx' ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
                  Excel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
