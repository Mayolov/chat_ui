import React from 'react';
import { MessageSquarePlus, Settings, Trash2, X } from 'lucide-react';

export default function Sidebar({
  conversations,
  activeConvId,
  onSelect,
  onCreate,
  onDelete,
  onOpenSettings,
  onClose,
}) {
  const grouped = groupByDate(conversations);

  return (
    <div className="w-64 h-screen flex flex-col bg-chat-sidebar border-r border-chat-border shrink-0">
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-chat-border">
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-chat-accent hover:bg-chat-accent/80 text-white text-sm font-medium transition-colors flex-1 mr-2"
        >
          <MessageSquarePlus size={16} />
          New Chat
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-chat-hover transition-colors text-gray-400"
        >
          <X size={16} />
        </button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto p-2">
        {grouped.map((group) => (
          <div key={group.label} className="mb-3">
            <div className="px-2 py-1 text-xs text-gray-500 font-medium uppercase tracking-wider">
              {group.label}
            </div>
            {group.items.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center rounded-lg px-2 py-2 cursor-pointer transition-colors text-sm ${
                  conv.id === activeConvId
                    ? 'bg-chat-hover text-white'
                    : 'text-gray-400 hover:bg-chat-hover/50 hover:text-gray-200'
                }`}
                onClick={() => onSelect(conv.id)}
              >
                <span className="truncate flex-1">{conv.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ))}

        {conversations.length === 0 && (
          <div className="text-center text-gray-600 text-sm mt-8">
            No conversations yet
          </div>
        )}
      </div>

      {/* Settings button */}
      <div className="p-3 border-t border-chat-border">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-chat-hover text-gray-400 hover:text-gray-200 text-sm transition-colors"
        >
          <Settings size={16} />
          Settings
        </button>
      </div>
    </div>
  );
}

function groupByDate(conversations) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const weekAgo = today - 7 * 86400000;

  const groups = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    Older: [],
  };

  for (const conv of conversations) {
    const t = conv.createdAt;
    if (t >= today) groups.Today.push(conv);
    else if (t >= yesterday) groups.Yesterday.push(conv);
    else if (t >= weekAgo) groups['Previous 7 Days'].push(conv);
    else groups.Older.push(conv);
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}
