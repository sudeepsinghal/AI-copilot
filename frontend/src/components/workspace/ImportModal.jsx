import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, UploadCloud, Link2, HardDrive, Cloud, Loader2, CheckCircle2,
  AlertCircle, FileText, Lock, FolderOpen,
} from 'lucide-react';
import { api } from '../../lib/api';

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'text/plain': ['.txt'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

const GDRIVE_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
].join(',');

const HAS_GDRIVE = !!(import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_API_KEY);
const HAS_DROPBOX = !!import.meta.env.VITE_DROPBOX_APP_KEY;
const HAS_ONEDRIVE = !!import.meta.env.VITE_ONEDRIVE_CLIENT_ID;

// Dev-only: bypass Google OAuth so the Drive button is testable without signing in.
// Set VITE_DEV_MOCK_DRIVE=true in frontend/.env. Never enable in production.
const DEV_MOCK_DRIVE = import.meta.env.DEV && import.meta.env.VITE_DEV_MOCK_DRIVE === 'true';
const MOCK_DRIVE_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

const SOURCES = [
  { id: 'upload', label: 'Upload files', icon: UploadCloud },
  { id: 'url', label: 'From URL', icon: Link2 },
  { id: 'gdrive', label: 'Google Drive', icon: HardDrive, ready: HAS_GDRIVE },
  { id: 'dropbox', label: 'Dropbox', icon: Cloud, ready: HAS_DROPBOX },
  { id: 'onedrive', label: 'OneDrive', icon: Cloud, ready: HAS_ONEDRIVE },
];

function loadScript(src, attrs = {}) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export default function ImportModal({ open, onClose, onImported }) {
  const [tab, setTab] = useState('upload');
  const [queue, setQueue] = useState([]);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [gdriveLoading, setGdriveLoading] = useState(false);
  const pickerRef = useRef(null);

  const markDone = (doc) => onImported?.(doc);

  const uploadFiles = useCallback(async (files) => {
    setError('');
    const items = files.map((f) => ({ name: f.name, status: 'pending', msg: '' }));
    setQueue((q) => [...items, ...q]);
    setBusy(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setQueue((q) => q.map((it) => (it.name === file.name && it.status === 'pending'
        ? { ...it, status: 'busy' } : it)));
      try {
        const res = await api.uploadDocument(file);
        setQueue((q) => q.map((it) => (it.name === file.name && it.status === 'busy'
          ? { ...it, status: 'done' } : it)));
        markDone({ id: res.document_id, name: res.filename || file.name, file_type: res.file_type });
      } catch (e) {
        setQueue((q) => q.map((it) => (it.name === file.name && it.status === 'busy'
          ? { ...it, status: 'error', msg: e.message } : it)));
      }
    }
    setBusy(false);
  }, [onImported]);

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected?.length) setError(rejected[0].errors[0]?.message || 'Some files were rejected.');
    if (accepted?.length) uploadFiles(accepted);
  }, [uploadFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPT, maxSize: 50 * 1024 * 1024, multiple: true, noClick: false,
  });

  const importFromUrl = async () => {
    const u = url.trim();
    if (!u) return;
    setBusy(true); setError('');
    setQueue((q) => [{ name: u, status: 'busy', msg: '' }, ...q]);
    try {
      const res = await api.importUrl(u);
      setQueue((q) => q.map((it) => (it.name === u ? { ...it, name: res.filename || u, status: 'done' } : it)));
      markDone({ id: res.document_id, name: res.filename, file_type: res.file_type });
      setUrl('');
    } catch (e) {
      setQueue((q) => q.map((it) => (it.name === u ? { ...it, status: 'error', msg: e.message } : it)));
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDriveFilePicked = async (driveFiles, token) => {
    for (const driveFile of driveFiles) {
      const { id, name, mimeType } = driveFile;
      setQueue((q) => [{ name, status: 'busy', msg: '' }, ...q]);
      try {
        const dlRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!dlRes.ok) throw new Error(`Drive download failed (${dlRes.status})`);
        const blob = await dlRes.blob();
        const fileObj = new File([blob], name, { type: mimeType });
        const res = await api.uploadDocument(fileObj);
        setQueue((q) => q.map((it) =>
          it.name === name && it.status === 'busy' ? { ...it, status: 'done' } : it));
        markDone({ id: res.document_id, name: res.filename || name, file_type: res.file_type });
      } catch (e) {
        setQueue((q) => q.map((it) =>
          it.name === name && it.status === 'busy' ? { ...it, status: 'error', msg: e.message } : it));
        setError(e.message);
      }
    }
  };

  const mockDriveImport = async () => {
    setError('');
    setQueue((q) => [{ name: 'dummy.pdf (mock Drive)', status: 'busy', msg: '' }, ...q]);
    try {
      const res = await api.importUrl(MOCK_DRIVE_URL, 'dummy.pdf');
      setQueue((q) => q.map((it) =>
        it.name === 'dummy.pdf (mock Drive)' && it.status === 'busy'
          ? { ...it, name: res.filename || 'dummy.pdf', status: 'done' } : it));
      markDone({ id: res.document_id, name: res.filename || 'dummy.pdf', file_type: res.file_type });
    } catch (e) {
      setQueue((q) => q.map((it) =>
        it.name === 'dummy.pdf (mock Drive)' && it.status === 'busy'
          ? { ...it, status: 'error', msg: e.message } : it));
      setError(e.message);
    }
  };

  const openGooglePicker = async () => {
    if (DEV_MOCK_DRIVE) { await mockDriveImport(); return; }
    setGdriveLoading(true);
    setError('');
    try {
      await Promise.all([
        loadScript('https://apis.google.com/js/api.js'),
        loadScript('https://accounts.google.com/gsi/client'),
      ]);

      await new Promise((resolve) => window.gapi.load('picker', resolve));

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: async (response) => {
          setGdriveLoading(false);
          if (response.error) {
            setError(`Google auth error: ${response.error}`);
            return;
          }
          const token = response.access_token;

          const picker = new window.google.picker.PickerBuilder()
            .setOAuthToken(token)
            .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)
            .setTitle('Select documents to import')
            .addView(
              new window.google.picker.DocsView()
                .setIncludeFolders(false)
                .setSelectFolderEnabled(false)
                .setMimeTypes(GDRIVE_MIME_TYPES)
            )
            .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
            .setCallback(async (data) => {
              if (data.action !== window.google.picker.Action.PICKED) return;
              await handleDriveFilePicked(data.docs, token);
            })
            .build();

          pickerRef.current = picker;
          picker.setVisible(true);
        },
      });

      tokenClient.requestAccessToken({ prompt: '' });
    } catch (e) {
      setGdriveLoading(false);
      setError(e.message || 'Failed to open Google Drive picker');
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl h-[520px] glass-panel border border-border rounded-2xl overflow-hidden flex"
        >
          {/* Sources rail */}
          <div className="w-48 border-r border-border/60 bg-surface/40 p-3 flex flex-col gap-1 flex-shrink-0">
            <h3 className="px-2 py-1 text-sm font-semibold">Import from</h3>
            {SOURCES.map((s) => {
              const Icon = s.icon;
              const isConnector = ['gdrive', 'dropbox', 'onedrive'].includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => setTab(s.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    tab === s.id ? 'bg-primary/15 text-primary' : 'text-text-muted hover:text-text hover:bg-surface-hover'
                  }`}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  <span className="flex-1 text-left">{s.label}</span>
                  {isConnector && !s.ready && <Lock size={12} className="opacity-50" />}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="h-12 flex items-center justify-between px-4 border-b border-border/50 flex-shrink-0">
              <span className="text-sm font-medium">{SOURCES.find((s) => s.id === tab)?.label}</span>
              <button onClick={onClose} className="text-text-muted hover:text-text"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {tab === 'upload' && (
                <div
                  {...getRootProps()}
                  className={`rounded-xl border-2 border-dashed min-h-[180px] flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-border'
                  }`}
                >
                  <input {...getInputProps()} />
                  <UploadCloud size={32} className="text-text-muted mb-3" />
                  <p className="text-sm font-medium">Drop files or click to browse</p>
                  <p className="text-xs text-text-muted mt-1">PDF, DOCX, TXT, PNG, JPEG — multiple allowed</p>
                </div>
              )}

              {tab === 'url' && (
                <div className="space-y-3">
                  <p className="text-sm text-text-muted">Paste a direct link to a PDF, image, DOCX, or TXT file.</p>
                  <div className="flex gap-2">
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && importFromUrl()}
                      placeholder="https://example.com/invoice.pdf"
                      className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                    />
                    <button
                      onClick={importFromUrl}
                      disabled={busy || !url.trim()}
                      className="px-4 py-2 rounded-lg bg-primary text-bg text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
                    >
                      Import
                    </button>
                  </div>
                </div>
              )}

              {tab === 'gdrive' && HAS_GDRIVE && (
                <div className="flex flex-col items-center justify-center text-center py-10 gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <HardDrive size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">Browse Google Drive</p>
                    <p className="text-xs text-text-muted mt-1 max-w-xs">
                      Select PDFs, DOCX, images, or TXT files. They'll be imported and indexed instantly.
                    </p>
                  </div>
                  <button
                    onClick={openGooglePicker}
                    disabled={gdriveLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-bg text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
                  >
                    {gdriveLoading ? (
                      <><Loader2 size={16} className="animate-spin" /> Connecting…</>
                    ) : (
                      <><FolderOpen size={16} /> Open Google Drive</>
                    )}
                  </button>
                  <p className="text-[11px] text-text-muted">
                    {DEV_MOCK_DRIVE
                      ? '⚡ Mock mode: imports a sample PDF — no Google login required.'
                      : "You'll be asked to sign in to Google and grant read access."}
                  </p>
                </div>
              )}

              {tab === 'gdrive' && !HAS_GDRIVE && (
                <div className="flex flex-col items-center justify-center text-center py-10 text-text-muted">
                  <Lock size={28} className="mb-3 opacity-50" />
                  <p className="text-sm font-medium text-text">Setup required</p>
                  <p className="text-xs mt-1 max-w-xs">
                    Add VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY to frontend/.env to enable this connector.
                  </p>
                </div>
              )}

              {['dropbox', 'onedrive'].includes(tab) && (
                <div className="flex flex-col items-center justify-center text-center py-10 text-text-muted">
                  <Lock size={28} className="mb-3 opacity-50" />
                  <p className="text-sm font-medium text-text">Setup required</p>
                  <p className="text-xs mt-1 max-w-xs">
                    This connector needs a one-time developer key. It will activate here automatically once configured.
                  </p>
                </div>
              )}

              {/* Import results */}
              {queue.length > 0 && (
                <div className="mt-5">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">Imported</p>
                  <div className="space-y-1.5">
                    {queue.map((it, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm bg-surface/40 border border-border/50 rounded-lg px-3 py-2">
                        <FileText size={14} className="text-text-muted flex-shrink-0" />
                        <span className="flex-1 truncate">{it.name}</span>
                        {it.status === 'busy' && <Loader2 size={14} className="animate-spin text-primary" />}
                        {it.status === 'done' && <CheckCircle2 size={14} className="text-success" />}
                        {it.status === 'error' && (
                          <span title={it.msg}><AlertCircle size={14} className="text-danger" /></span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-danger mt-3">{error}</p>}
            </div>

            <div className="h-12 flex items-center justify-end px-4 border-t border-border/50 flex-shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-primary text-bg text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
