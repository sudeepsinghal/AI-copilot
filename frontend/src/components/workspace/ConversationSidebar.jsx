import React from 'react';
import { Plus, MessageSquare, Trash2, Loader2, FileText } from 'lucide-react';

/**
 * ChatGPT-style list of the user's conversations. Click to resume; trash to delete.
 */
export default function ConversationSidebar({
  conversations,
  activeId,
  loading,
  onSelect,
  onNew,
  onDelete,
}) {
  return (
    <div className="h-full w-full flex flex-col bg-surface/40 border-r border-border/60">
      <div className="p-3 flex-shrink-0">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/25 transition-colors"
        >
          <Plus size={16} /> New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-text-muted">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-xs text-text-muted text-center px-3 py-8">
            No chats yet. Upload a document or start a new chat.
          </p>
        ) : (
          conversations.map((c) => {
            const isActive = c.id === activeId;
            return (
              <div
                key={c.id}
                onClick={() => onSelect(c)}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-surface-hover border border-transparent'
                }`}
              >
                {c.document_id ? (
                  <FileText size={15} className="flex-shrink-0 text-text-muted" />
                ) : (
                  <MessageSquare size={15} className="flex-shrink-0 text-text-muted" />
                )}
                <span className="flex-1 truncate text-sm">{c.title || 'New chat'}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-opacity flex-shrink-0"
                  title="Delete chat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
