import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar.jsx';
import ChatView from './components/ChatView.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import ArtifactPanel from './components/ArtifactPanel.jsx';
import { loadSettings, saveSettings, loadConversations, saveConversations } from './utils/storage.js';
import { parseSSEStream } from './utils/streamParser.js';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [conversations, setConversations] = useState(loadConversations);
  const [activeConvId, setActiveConvId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState(null);
  const abortRef = useRef(null);
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  // Persist
  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => saveConversations(conversations), [conversations]);

  // Show settings on first launch if no API key
  useEffect(() => {
    if (!settings.apiKey) setShowSettings(true);
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeConvId) || null;

  const updateConversation = useCallback((convId, updater) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, ...updater(c) } : c))
    );
  }, []);

  const createConversation = useCallback(() => {
    const conv = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveConvId(conv.id);
    setActiveArtifact(null);
    return conv.id;
  }, []);

  const deleteConversation = useCallback(
    (convId) => {
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConvId === convId) {
        setActiveConvId(null);
        setActiveArtifact(null);
      }
    },
    [activeConvId]
  );

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (content, attachments = []) => {
      if (!settings.apiKey) {
        setShowSettings(true);
        return;
      }

      let convId = activeConvId;
      if (!convId) {
        convId = createConversation();
      }

      // Build user message
      const userMsg = {
        id: generateId(),
        role: 'user',
        content,
        attachments,
        timestamp: Date.now(),
      };

      // Build assistant placeholder
      const assistantMsg = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      // Update conversation with user message + placeholder
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          const updated = {
            ...c,
            messages: [...c.messages, userMsg, assistantMsg],
          };
          // Auto-title from first message
          if (c.messages.length === 0) {
            updated.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
          }
          return updated;
        })
      );

      // Build API messages from latest state via ref to avoid stale closure
      const conv = conversationsRef.current.find((c) => c.id === convId);
      const prevMessages = conv ? conv.messages : [];

      const apiMessages = [];
      if (settings.systemPrompt) {
        apiMessages.push({ role: 'system', content: settings.systemPrompt });
      }

      for (const msg of prevMessages) {
        if (msg.role === 'user') {
          let msgContent = msg.content;
          if (msg.attachments?.length) {
            const fileContext = msg.attachments
              .map((a) => {
                if (a.isText && a.content) {
                  return `[File: ${a.name}]\n${a.content}\n[End of file]`;
                }
                return `[File: ${a.name} (${a.type}, ${(a.size / 1024).toFixed(1)}KB)]`;
              })
              .join('\n\n');
            msgContent = fileContext + '\n\n' + msgContent;
          }
          apiMessages.push({ role: 'user', content: msgContent });
        } else if (msg.role === 'assistant') {
          apiMessages.push({ role: 'assistant', content: msg.content });
        }
      }

      // Current user message
      let currentContent = content;
      if (attachments.length) {
        const fileContext = attachments
          .map((a) => {
            if (a.isText && a.content) {
              return `[File: ${a.name}]\n${a.content}\n[End of file]`;
            }
            if (a.isImage && a.content) {
              return `[Image: ${a.name}]`;
            }
            return `[File: ${a.name} (${a.type}, ${(a.size / 1024).toFixed(1)}KB)]`;
          })
          .join('\n\n');
        currentContent = fileContext + '\n\n' + currentContent;
      }

      // Handle image attachments for vision models
      const hasImages = attachments.some((a) => a.isImage);
      if (hasImages) {
        const parts = [];
        for (const a of attachments) {
          if (a.isImage && a.content) {
            parts.push({
              type: 'image_url',
              image_url: { url: a.content },
            });
          }
        }
        parts.push({ type: 'text', text: currentContent });
        apiMessages.push({ role: 'user', content: parts });
      } else {
        apiMessages.push({ role: 'user', content: currentContent });
      }

      // Stream response
      setIsStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            apiKey: settings.apiKey,
            apiBase: settings.apiBase,
            model: settings.model,
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(err.details || err.error || `HTTP ${res.status}`);
        }

        let fullContent = '';
        for await (const chunk of parseSSEStream(res)) {
          fullContent += chunk;
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== convId) return c;
              const msgs = [...c.messages];
              const lastIdx = msgs.length - 1;
              msgs[lastIdx] = { ...msgs[lastIdx], content: fullContent };
              return { ...c, messages: msgs };
            })
          );
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Send error:', err);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c;
            const msgs = [...c.messages];
            const lastIdx = msgs.length - 1;
            msgs[lastIdx] = {
              ...msgs[lastIdx],
              content: `**Error:** ${err.message}`,
              isError: true,
            };
            return { ...c, messages: msgs };
          })
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [activeConvId, settings, createConversation]
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      {showSidebar && (
        <Sidebar
          conversations={conversations}
          activeConvId={activeConvId}
          onSelect={(id) => {
            setActiveConvId(id);
            setActiveArtifact(null);
          }}
          onCreate={createConversation}
          onDelete={deleteConversation}
          onOpenSettings={() => setShowSettings(true)}
          onClose={() => setShowSidebar(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatView
          conversation={activeConversation}
          isStreaming={isStreaming}
          onSend={sendMessage}
          onStop={stopStreaming}
          onShowSidebar={() => setShowSidebar(true)}
          showSidebarButton={!showSidebar}
          onArtifactClick={setActiveArtifact}
          settings={settings}
        />
      </div>

      {/* Artifact Panel */}
      {activeArtifact && (
        <ArtifactPanel artifact={activeArtifact} onClose={() => setActiveArtifact(null)} />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={(s) => {
            setSettings(s);
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
