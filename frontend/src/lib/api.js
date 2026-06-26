/**
 * API client for the FastAPI backend.
 *
 * - Reads the base URL from VITE_API_URL (see frontend/.env).
 * - Auto-attaches the Firebase ID token when a user is signed in, so the same
 *   code works whether the backend has AUTH_ENABLED on (prod) or off (dev).
 * - Surfaces backend `{ error: "..." }` payloads as thrown Errors.
 */
import { auth } from './firebase';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

async function authHeader() {
  const user = auth.currentUser;
  if (!user) return {};
  try {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = { ...(await authHeader()) };
  let payload = body;

  if (body !== undefined && !isForm) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload });

  // 204 / empty bodies
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new Error(data.detail || data.error || `Request failed (${res.status})`);
  }
  // Backend convention: 200 with an `error` field for soft failures
  if (data && data.error) {
    throw new Error(data.error);
  }
  return data;
}

export const api = {
  baseUrl: BASE_URL,

  // ── Providers / health ──
  getProviders: () => request('/providers'),

  // ── Documents ──
  uploadDocument: async (file, { pdfMode, ocrProvider, pdfDocumentType } = {}) => {
    const form = new FormData();
    form.append('file', file);
    if (pdfMode) form.append('pdf_mode', pdfMode);
    if (ocrProvider) form.append('ocr_provider', ocrProvider);
    if (pdfDocumentType) form.append('pdf_document_type', pdfDocumentType);
    return request('/upload', { method: 'POST', body: form, isForm: true });
  },
  listDocuments: () => request('/documents'),
  deleteDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }),
  getDocumentPages: (id) => request(`/documents/${id}/pages`),
  importUrl: (url, filename) =>
    request('/import-url', { method: 'POST', body: { url, filename: filename ?? null } }),

  /** Fetch the original file (auth-protected) as a blob object URL for previewing. */
  getDocumentBlobUrl: async (id) => {
    const res = await fetch(`${BASE_URL}/documents/${id}/file`, {
      headers: { ...(await authHeader()) },
    });
    if (!res.ok) throw new Error(`Could not load file (${res.status})`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  // ── Conversations ──
  listConversations: () => request('/conversations'),
  createConversation: ({ documentId, title } = {}) =>
    request('/conversations', {
      method: 'POST',
      body: { document_id: documentId ?? null, title: title ?? null },
    }),
  getConversation: (id) => request(`/conversations/${id}`),
  deleteConversation: (id) => request(`/conversations/${id}`, { method: 'DELETE' }),

  // ── Q&A ──
  ask: ({ query, conversationId, documentId, provider, model } = {}) =>
    request('/ask', {
      method: 'POST',
      body: {
        query,
        conversation_id: conversationId ?? null,
        document_id: documentId ?? null,
        provider: provider ?? null,
        model: model ?? null,
      },
    }),

  // ── Structured extraction + Review Queue ──
  extract: ({ fields, documentId, provider, model } = {}) =>
    request('/extract', {
      method: 'POST',
      body: { fields, document_id: documentId ?? null, provider: provider ?? null, model: model ?? null },
    }),
  listExtractions: ({ status, documentId } = {}) => {
    const p = new URLSearchParams();
    if (status) p.set('status', status);
    if (documentId) p.set('document_id', documentId);
    const qs = p.toString();
    return request(`/extractions${qs ? `?${qs}` : ''}`);
  },
  getExtraction: (id) => request(`/extractions/${id}`),
  approveExtraction: (id, values) =>
    request(`/extractions/${id}/approve`, { method: 'POST', body: { values } }),
  deleteExtraction: (id) => request(`/extractions/${id}`, { method: 'DELETE' }),

  /** Download an export (CSV/XLSX) of extractions, triggering a browser download. */
  exportExtractions: async ({ ids, documentId, status, format = 'csv' } = {}) => {
    const res = await fetch(`${BASE_URL}/extractions/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ ids: ids ?? null, document_id: documentId ?? null, status: status ?? null, format }),
    });
    if (!res.ok) {
      let msg = `Export failed (${res.status})`;
      try { msg = (await res.json()).detail || msg; } catch { /* binary */ }
      throw new Error(msg);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extractions.${format === 'xlsx' ? 'xlsx' : 'csv'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

export default api;
