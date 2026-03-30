import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check, User, Bot, FileText, Image, ExternalLink } from 'lucide-react';
import { parseArtifacts, renderArtifactHtml } from '../utils/artifacts.js';
import 'highlight.js/styles/github-dark.css';

export default function MessageBubble({ message, isStreaming, onArtifactClick }) {
  const isUser = message.role === 'user';

  const { artifacts, parts } = useMemo(() => {
    if (isUser) return { artifacts: [], parts: [{ type: 'text', content: message.content }] };
    return parseArtifacts(message.content);
  }, [message.content, isUser]);

  return (
    <div className={`flex gap-3 mb-6 ${isUser ? 'justify-end' : ''}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-chat-accent/20 flex items-center justify-center shrink-0 mt-1">
          <Bot size={16} className="text-chat-accent-light" />
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] min-w-0`}>
        {/* Attachments (user only) */}
        {isUser && message.attachments?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 bg-chat-input border border-chat-border rounded-lg text-xs"
              >
                {att.isImage ? (
                  <Image size={12} className="text-blue-400" />
                ) : (
                  <FileText size={12} className="text-green-400" />
                )}
                <span className="text-gray-400 max-w-[120px] truncate">{att.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Message content */}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-chat-accent text-white rounded-br-md'
              : message.isError
              ? 'bg-red-900/30 text-red-300 border border-red-800/50'
              : 'bg-chat-input text-gray-200 rounded-bl-md'
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <div className="markdown-body">
              {parts.map((part, i) => {
                if (part.type === 'text') {
                  return (
                    <ReactMarkdown
                      key={i}
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        pre: ({ children }) => (
                          <CodeBlock>{children}</CodeBlock>
                        ),
                      }}
                    >
                      {part.content}
                    </ReactMarkdown>
                  );
                }
                if (part.type === 'artifact') {
                  const artifact = artifacts[part.artifactIndex];
                  return (
                    <ArtifactCard
                      key={i}
                      artifact={artifact}
                      onClick={() => onArtifactClick(artifact)}
                    />
                  );
                }
                return null;
              })}
              {isStreaming && <TypingIndicator />}
            </div>
          )}
        </div>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0 mt-1">
          <User size={16} className="text-gray-300" />
        </div>
      )}
    </div>
  );
}

function CodeBlock({ children }) {
  const [copied, setCopied] = React.useState(false);

  const code = React.useMemo(() => {
    const extractText = (node) => {
      if (typeof node === 'string') return node;
      if (!node) return '';
      if (node.props?.children) {
        return React.Children.toArray(node.props.children).map(extractText).join('');
      }
      return '';
    };
    return extractText(children);
  }, [children]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-3">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-700/80 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <pre className="overflow-x-auto">{children}</pre>
    </div>
  );
}

function ArtifactCard({ artifact, onClick }) {
  const typeLabels = {
    html: 'HTML',
    react: 'React',
    svg: 'SVG',
    mermaid: 'Diagram',
    code: 'Code',
  };

  return (
    <button
      onClick={onClick}
      className="my-3 w-full flex items-center gap-3 p-3 rounded-xl border border-chat-accent/30 bg-chat-accent/5 hover:bg-chat-accent/10 transition-colors text-left"
    >
      <div className="w-10 h-10 rounded-lg bg-chat-accent/20 flex items-center justify-center shrink-0">
        <ExternalLink size={18} className="text-chat-accent-light" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-200 truncate">
          {artifact.title}
        </div>
        <div className="text-xs text-gray-500">
          {typeLabels[artifact.type] || artifact.type} artifact - Click to preview
        </div>
      </div>
    </button>
  );
}

function TypingIndicator() {
  return (
    <span className="inline-flex gap-1 ml-1">
      <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full inline-block" />
      <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full inline-block" />
      <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full inline-block" />
    </span>
  );
}
