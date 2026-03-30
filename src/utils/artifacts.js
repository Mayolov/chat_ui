// Parse artifact blocks from assistant messages
// Supports: ```artifact:html, ```artifact:react, ```artifact:svg, ```artifact:mermaid
// Also auto-detects full HTML documents and standalone SVG

export function parseArtifacts(text) {
  const artifacts = [];
  const parts = [];
  let lastIndex = 0;

  // Match ```artifact:type\n...``` blocks
  const artifactRegex = /```artifact:(html|react|svg|mermaid|code)\n([\s\S]*?)```/g;
  let match;

  while ((match = artifactRegex.exec(text)) !== null) {
    // Text before this artifact
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    const artifact = {
      id: `artifact-${Date.now()}-${artifacts.length}`,
      type: match[1],
      content: match[2].trim(),
    };

    // Generate title from content
    if (artifact.type === 'html') {
      const titleMatch = artifact.content.match(/<title>(.*?)<\/title>/i);
      artifact.title = titleMatch ? titleMatch[1] : 'HTML Document';
    } else if (artifact.type === 'react') {
      artifact.title = 'React Component';
    } else if (artifact.type === 'svg') {
      artifact.title = 'SVG Graphic';
    } else if (artifact.type === 'mermaid') {
      artifact.title = 'Diagram';
    } else {
      artifact.title = 'Code';
    }

    artifacts.push(artifact);
    parts.push({ type: 'artifact', artifactIndex: artifacts.length - 1 });
    lastIndex = match.index + match[0].length;
  }

  // If no explicit artifacts found, check for implicit HTML/SVG
  if (artifacts.length === 0) {
    const htmlMatch = text.match(/```html\n([\s\S]*?)```/);
    if (htmlMatch && (htmlMatch[1].includes('<!DOCTYPE') || htmlMatch[1].includes('<html'))) {
      const content = htmlMatch[1].trim();
      const titleMatch = content.match(/<title>(.*?)<\/title>/i);
      artifacts.push({
        id: `artifact-${Date.now()}-0`,
        type: 'html',
        content,
        title: titleMatch ? titleMatch[1] : 'HTML Document',
      });
      const beforeIdx = htmlMatch.index;
      const afterIdx = htmlMatch.index + htmlMatch[0].length;
      if (beforeIdx > 0) parts.push({ type: 'text', content: text.slice(0, beforeIdx) });
      parts.push({ type: 'artifact', artifactIndex: 0 });
      if (afterIdx < text.length) parts.push({ type: 'text', content: text.slice(afterIdx) });
      return { artifacts, parts };
    }
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  // If no artifacts found, just return the whole text
  if (artifacts.length === 0) {
    return { artifacts: [], parts: [{ type: 'text', content: text }] };
  }

  return { artifacts, parts };
}

export function renderArtifactHtml(artifact) {
  if (artifact.type === 'html') {
    return artifact.content;
  }

  if (artifact.type === 'svg') {
    return `<!DOCTYPE html><html><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8f8f8">${artifact.content}</body></html>`;
  }

  if (artifact.type === 'react') {
    return `<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <style>
    * { margin: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${artifact.content}
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App || (() => null)));
  <\/script>
</body>
</html>`;
  }

  if (artifact.type === 'mermaid') {
    return `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"><\/script>
</head>
<body style="display:flex;justify-content:center;padding:2rem;background:#fff">
  <pre class="mermaid">${artifact.content}</pre>
  <script>mermaid.initialize({ startOnLoad: true, theme: 'default' });<\/script>
</body>
</html>`;
  }

  return `<pre style="padding:1rem;font-family:monospace;white-space:pre-wrap">${artifact.content}</pre>`;
}
