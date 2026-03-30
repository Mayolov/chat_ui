import React, { useState, useRef, useEffect } from 'react';
import { Menu, Square, ArrowUp, Paperclip, X, FileText, Image } from 'lucide-react';
import MessageBubble from './MessageBubble.jsx';

export default function ChatView({
  conversation,
  isStreaming,
  onSend,
  onStop,
  onShowSidebar,
  showSidebarButton,
  onArtifactClick,
  settings,
}) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const messages = conversation?.messages || [];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed && attachments.length === 0) return;
    if (isStreaming) return;
    onSend(trimmed, attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (files) => {
    if (!files?.length) return;
    const formData = new FormData();
    for (const f of files) {
      formData.append('files', f);
    }

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      setAttachments((prev) => [...prev, ...data.files]);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className="flex flex-col h-full relative"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Drop overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-chat-accent/10 border-2 border-dashed border-chat-accent rounded-xl flex items-center justify-center">
          <div className="text-chat-accent-light text-lg font-medium">
            Drop files here
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-chat-border">
        {showSidebarButton && (
          <button
            onClick={onShowSidebar}
            className="p-2 rounded-lg hover:bg-chat-hover transition-colors text-gray-400"
          >
            <Menu size={18} />
          </button>
        )}
        <div className="flex-1">
          <h2 className="text-sm font-medium text-gray-200 truncate">
            {conversation?.title || 'New Chat'}
          </h2>
          <span className="text-xs text-gray-500">{settings.model}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState model={settings.model} />
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && msg === messages[messages.length - 1]}
                onArtifactClick={onArtifactClick}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-chat-border p-4">
        <div className="max-w-3xl mx-auto">
          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachments.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 bg-chat-input border border-chat-border rounded-lg text-sm"
                >
                  {att.isImage ? (
                    <Image size={14} className="text-blue-400" />
                  ) : (
                    <FileText size={14} className="text-green-400" />
                  )}
                  <span className="text-gray-300 max-w-[150px] truncate">
                    {att.name}
                  </span>
                  <button
                    onClick={() => removeAttachment(i)}
                    className="text-gray-500 hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 bg-chat-input border border-chat-border rounded-2xl px-4 py-3 focus-within:border-chat-accent/50 transition-colors">
            {/* File upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1 text-gray-500 hover:text-gray-300 transition-colors shrink-0 mb-0.5"
              title="Attach files"
            >
              <Paperclip size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />

            {/* Text input */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              rows={1}
              className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 resize-none outline-none text-sm max-h-[200px]"
            />

            {/* Send / Stop */}
            {isStreaming ? (
              <button
                onClick={onStop}
                className="p-2 rounded-full bg-gray-600 hover:bg-gray-500 text-white transition-colors shrink-0"
                title="Stop generating"
              >
                <Square size={14} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() && attachments.length === 0}
                className="p-2 rounded-full bg-chat-accent hover:bg-chat-accent/80 text-white transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Send message"
              >
                <ArrowUp size={14} />
              </button>
            )}
          </div>

          <div className="text-center mt-2">
            <span className="text-xs text-gray-600">
              Press Enter to send, Shift+Enter for new line
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ model }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
      <div className="text-6xl mb-6 opacity-20">💬</div>
      <h2 className="text-xl font-medium text-gray-300 mb-2">How can I help you?</h2>
      <p className="text-sm text-gray-500 mb-1">
        Model: <span className="text-gray-400">{model}</span>
      </p>
      <p className="text-sm text-gray-600 mt-4 max-w-md text-center">
        Send a message to start a conversation. You can also drag & drop files
        or click the paperclip icon to attach them.
      </p>
    </div>
  );
}
