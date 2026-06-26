import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GripVertical, X, Maximize2, Minimize2, UploadCloud, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentViewer from '../components/workspace/DocumentViewer';
import ChatPanel from '../components/workspace/ChatPanel';
import ExtractionPanel from '../components/workspace/ExtractionPanel';
import ConversationSidebar from '../components/workspace/ConversationSidebar';
import ImportModal from '../components/workspace/ImportModal';
import { MessageSquare, Sparkles, FileUp } from 'lucide-react';
import { api } from '../lib/api';

/* ────────────────────────────────────────
   CUSTOM RESIZABLE SPLIT PANE
   ──────────────────────────────────────── */
function ResizableSplitPane({ leftPane, rightPane, isMaximized }) {
  const [leftWidth, setLeftWidth] = useState(50);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newLeft = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      setLeftWidth(Math.max(25, Math.min(75, newLeft)));
    };
    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  if (isMaximized) return <div className="h-full w-full">{rightPane}</div>;

  return (
    <div ref={containerRef} className="h-full w-full flex">
      <div style={{ width: `${leftWidth}%` }} className="h-full flex-shrink-0 overflow-hidden">
        {leftPane}
      </div>
      <div
        onMouseDown={handleMouseDown}
        className="w-2 h-full flex-shrink-0 hover:bg-primary/20 transition-colors flex items-center justify-center cursor-col-resize group z-10 relative"
      >
        <div className="h-8 w-1 rounded-full bg-border group-hover:bg-primary transition-colors" />
      </div>
      <div className="flex-1 h-full overflow-hidden">{rightPane}</div>
    </div>
  );
}

/* ────────────────────────────────────────
   WORKSPACE PAGE
   ──────────────────────────────────────── */
export default function Workspace() {
  const [conversations, setConversations] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activeConv, setActiveConv] = useState(null); // full conversation incl. messages
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingActive, setLoadingActive] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const importedRef = useRef([]); // conversations created during an import session
  const [isMaximized, setIsMaximized] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [jumpTarget, setJumpTarget] = useState(null); // citation → viewer jump
  const [llmChoice, setLlmChoice] = useState(null); // { provider, model }
  const [rightTab, setRightTab] = useState('chat'); // 'chat' | 'extract'

  const handleCitationClick = (source) => {
    setJumpTarget({
      docId: source.doc_id || activeConv?.document_id,
      page: source.page_number || 1,
      line_start: source.line_start,
      line_end: source.line_end,
      ts: Date.now(),
    });
    if (isMaximized) setIsMaximized(false); // make sure the viewer is visible
  };

  const refreshConversations = useCallback(async () => {
    try {
      const { conversations } = await api.listConversations();
      setConversations(conversations);
    } catch (e) {
      setGlobalError(e.message);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  const refreshDocuments = useCallback(async () => {
    try {
      const { documents } = await api.listDocuments();
      setDocuments(documents);
    } catch (e) {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    refreshConversations();
    refreshDocuments();
  }, [refreshConversations, refreshDocuments]);

  const openConversation = async (conv) => {
    setIsMaximized(false);
    setLoadingActive(true);
    try {
      const full = await api.getConversation(conv.id);
      setActiveConv(full);
    } catch (e) {
      setGlobalError(e.message);
    } finally {
      setLoadingActive(false);
    }
  };

  const newChat = async () => {
    try {
      const conv = await api.createConversation({});
      await refreshConversations();
      await openConversation(conv);
    } catch (e) {
      setGlobalError(e.message);
    }
  };

  // Called once per successfully imported document (from ImportModal).
  const handleImported = async (doc) => {
    try {
      const conv = await api.createConversation({ documentId: doc.id, title: doc.name });
      importedRef.current.push(conv);
      await refreshConversations();
      await refreshDocuments();
    } catch (e) {
      setGlobalError(e.message);
    }
  };

  // On closing the import modal, land the user in the first doc they imported.
  const closeImport = () => {
    setImportOpen(false);
    const imported = importedRef.current;
    importedRef.current = [];
    if (imported.length && !activeConv) openConversation(imported[0]);
  };

  const deleteConversation = async (conv) => {
    try {
      await api.deleteConversation(conv.id);
      if (activeConv?.id === conv.id) setActiveConv(null);
      await refreshConversations();
    } catch (e) {
      setGlobalError(e.message);
    }
  };

  // Resolve the document attached to the active conversation (for the viewer).
  const activeDocument = activeConv?.document_id
    ? (() => {
        const d = documents.find((x) => x.id === activeConv.document_id);
        return d ? { id: d.id, name: d.filename, file_type: d.file_type } : { id: activeConv.document_id };
      })()
    : null;

  const showChat = !!activeConv;

  return (
    <div className="h-full w-full flex bg-bg text-text overflow-hidden">
      {/* CONVERSATIONS SIDEBAR */}
      <div className="w-64 h-full flex-shrink-0">
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConv?.id}
          loading={loadingConvs}
          onSelect={openConversation}
          onNew={newChat}
          onDelete={deleteConversation}
        />
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 h-full flex flex-col relative overflow-hidden">
        {/* HEADER */}
        <header className="h-14 border-b border-border/50 bg-surface/30 backdrop-blur-md flex items-center justify-between px-4 z-10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="font-semibold text-lg tracking-tight">Workspace</h1>
            {showChat && activeDocument?.name && (
              <>
                <span className="text-border">/</span>
                <span className="text-sm text-text-muted truncate max-w-[240px]">{activeDocument.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showChat && activeDocument && (
              <div className="flex items-center bg-surface border border-border rounded-lg p-0.5 mr-1">
                <button
                  onClick={() => setRightTab('chat')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    rightTab === 'chat' ? 'bg-primary/15 text-primary' : 'text-text-muted hover:text-text'
                  }`}
                >
                  <MessageSquare size={13} /> Chat
                </button>
                <button
                  onClick={() => setRightTab('extract')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    rightTab === 'extract' ? 'bg-primary/15 text-primary' : 'text-text-muted hover:text-text'
                  }`}
                >
                  <Sparkles size={13} /> Extract
                </button>
              </div>
            )}
            <button
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-surface-hover transition-colors text-sm"
            >
              <UploadCloud size={16} /> Import
            </button>
            {showChat && activeDocument && (
              <button
                onClick={() => setIsMaximized((v) => !v)}
                className="p-1.5 rounded hover:bg-surface transition-colors text-text-muted hover:text-text"
                title={isMaximized ? 'Show document' : 'Hide document'}
              >
                {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            )}
          </div>
        </header>

        {globalError && (
          <div className="px-4 py-2 bg-danger/10 border-b border-danger/30 text-danger text-xs flex items-center justify-between">
            <span>{globalError}</span>
            <button onClick={() => setGlobalError('')}><X size={14} /></button>
          </div>
        )}

        {/* CONTENT */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {loadingActive ? (
              <motion.div key="loading" className="absolute inset-0 flex items-center justify-center text-text-muted">
                <Loader2 size={26} className="animate-spin text-primary" />
              </motion.div>
            ) : showChat ? (
              <motion.div
                key={`chat-${activeConv.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                {activeDocument ? (
                  <ResizableSplitPane
                    isMaximized={isMaximized}
                    leftPane={
                      <div className="h-full w-full p-3">
                        <div className="h-full glass-card border border-border/50 rounded-xl overflow-hidden">
                          <DocumentViewer document={activeDocument} jumpTarget={jumpTarget} />
                        </div>
                      </div>
                    }
                    rightPane={
                      <div className="h-full w-full p-3 pl-1.5">
                        <div className="h-full glass-panel border border-border/50 rounded-xl overflow-hidden bg-surface/30">
                          {rightTab === 'extract' ? (
                            <ExtractionPanel
                              documentId={activeDocument.id}
                              documentName={activeDocument?.name}
                              onCitationClick={handleCitationClick}
                              llmChoice={llmChoice}
                              onLlmChange={setLlmChoice}
                            />
                          ) : (
                            <ChatPanel
                              conversation={activeConv}
                              documentName={activeDocument?.name}
                              onFirstMessage={refreshConversations}
                              onCitationClick={handleCitationClick}
                              llmChoice={llmChoice}
                              onLlmChange={setLlmChoice}
                            />
                          )}
                        </div>
                      </div>
                    }
                  />
                ) : (
                  <div className="h-full w-full p-3 max-w-3xl mx-auto">
                    <div className="h-full glass-panel border border-border/50 rounded-xl overflow-hidden bg-surface/30">
                      <ChatPanel
                        conversation={activeConv}
                        onFirstMessage={refreshConversations}
                        onCitationClick={handleCitationClick}
                        llmChoice={llmChoice}
                        onLlmChange={setLlmChoice}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5">
                  <FileUp size={28} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Bring in your documents</h2>
                <p className="text-text-muted text-sm max-w-md mb-6">
                  Upload files, import from a URL, or connect a cloud source. Then chat,
                  extract structured data, and export.
                </p>
                <button
                  onClick={() => setImportOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-bg font-semibold glow hover:scale-[1.02] active:scale-95 transition-transform"
                >
                  <FileUp size={18} /> Import documents
                </button>
                <button
                  onClick={newChat}
                  className="mt-3 text-sm text-text-muted hover:text-text transition-colors"
                >
                  or start a blank chat
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ImportModal open={importOpen} onClose={closeImport} onImported={handleImported} />
    </div>
  );
}
