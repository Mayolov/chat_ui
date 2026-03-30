import React, { useRef, useEffect, useState } from 'react';
import { X, Copy, Check, Maximize2, Minimize2, Code, Eye, Download } from 'lucide-react';
import { renderArtifactHtml } from '../utils/artifacts.js';

export default function ArtifactPanel({ artifact, onClose }) {
  const iframeRef = useRef(null);
  const [view, setView] = useState('preview'); // 'preview' | 'code'
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (view === 'preview' && iframeRef.current) {
      const oldSrc = iframeRef.current.src;
      const html = renderArtifactHtml(artifact);
      const blob = new Blob([html], { type: 'text/html' });
      iframeRef.current.src = URL.createObjectURL(blob);
      return () => {
        if (oldSrc.startsWith('blob:')) URL.revokeObjectURL(oldSrc);
      };
    }
  }, [artifact, view]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext =
      artifact.type === 'html'
        ? 'html'
        : artifact.type === 'svg'
        ? 'svg'
        : artifact.type === 'react'
        ? 'jsx'
        : 'txt';
    const blob = new Blob([artifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artifact.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`flex flex-col bg-chat-sidebar border-l border-chat-border ${
        isFullscreen ? 'fixed inset-0 z-50' : 'w-[500px] shrink-0'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-chat-border">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-200 truncate">
            {artifact.title}
          </h3>
          <span className="text-xs text-gray-500 uppercase">{artifact.type}</span>
        </div>

        {/* View toggle */}
        <div className="flex bg-chat-bg rounded-lg p-0.5">
          <button
            onClick={() => setView('preview')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${
              view === 'preview'
                ? 'bg-chat-hover text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Eye size={12} />
            Preview
          </button>
          <button
            onClick={() => setView('code')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${
              view === 'code'
                ? 'bg-chat-hover text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Code size={12} />
            Code
          </button>
        </div>

        {/* Actions */}
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md hover:bg-chat-hover text-gray-400 hover:text-gray-200 transition-colors"
          title="Copy code"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
        <button
          onClick={handleDownload}
          className="p-1.5 rounded-md hover:bg-chat-hover text-gray-400 hover:text-gray-200 transition-colors"
          title="Download"
        >
          <Download size={14} />
        </button>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 rounded-md hover:bg-chat-hover text-gray-400 hover:text-gray-200 transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-chat-hover text-gray-400 hover:text-gray-200 transition-colors"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'preview' ? (
          <iframe
            ref={iframeRef}
            className="w-full h-full bg-white"
            sandbox="allow-scripts allow-same-origin"
            title="Artifact preview"
          />
        ) : (
          <pre className="w-full h-full overflow-auto p-4 text-sm text-gray-300 bg-chat-bg font-mono whitespace-pre-wrap leading-relaxed">
            {artifact.content}
          </pre>
        )}
      </div>
    </div>
  );
}
