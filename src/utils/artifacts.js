// Parse artifact blocks from assistant messages
// Supports ```artifact:type blocks for interactive previews and downloadable files

const ARTIFACT_TYPES = [
  // Interactive / renderable
  'html', 'react', 'svg', 'mermaid',
  // Downloadable code / file types
  'python', 'java', 'javascript', 'typescript', 'markdown',
  'json', 'csv', 'yaml', 'shell', 'sql', 'text',
  'go', 'rust', 'cpp', 'c', 'ruby', 'php',
  'css', 'xml', 'toml', 'dockerfile', 'makefile',
  'code',
];

const TYPE_REGEX = new RegExp(
  '```artifact:(' + ARTIFACT_TYPES.join('|') + ')\\n([\\s\\S]*?)```',
  'g'
);

const TYPE_LABELS = {
  html: 'HTML',
  react: 'React',
  svg: 'SVG',
  mermaid: 'Diagram',
  python: 'Python',
  java: 'Java',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  markdown: 'Markdown',
  json: 'JSON',
  csv: 'CSV',
  yaml: 'YAML',
  shell: 'Shell Script',
  sql: 'SQL',
  text: 'Text',
  go: 'Go',
  rust: 'Rust',
  cpp: 'C++',
  c: 'C',
  ruby: 'Ruby',
  php: 'PHP',
  css: 'CSS',
  xml: 'XML',
  toml: 'TOML',
  dockerfile: 'Dockerfile',
  makefile: 'Makefile',
  code: 'Code',
};

const FILE_EXTENSIONS = {
  html: 'html',
  react: 'jsx',
  svg: 'svg',
  mermaid: 'mmd',
  python: 'py',
  java: 'java',
  javascript: 'js',
  typescript: 'ts',
  markdown: 'md',
  json: 'json',
  csv: 'csv',
  yaml: 'yaml',
  shell: 'sh',
  sql: 'sql',
  text: 'txt',
  go: 'go',
  rust: 'rs',
  cpp: 'cpp',
  c: 'c',
  ruby: 'rb',
  php: 'php',
  css: 'css',
  xml: 'xml',
  toml: 'toml',
  dockerfile: 'Dockerfile',
  makefile: 'Makefile',
  code: 'txt',
};

// Types that can be rendered in an iframe
const RENDERABLE_TYPES = new Set(['html', 'react', 'svg', 'mermaid']);

export function getTypeLabel(type) {
  return TYPE_LABELS[type] || type;
}

export function getFileExtension(type) {
  return FILE_EXTENSIONS[type] || 'txt';
}

export function isRenderable(type) {
  return RENDERABLE_TYPES.has(type);
}

export function parseArtifacts(text) {
  const artifacts = [];
  const parts = [];
  let lastIndex = 0;

  // Reset regex state
  TYPE_REGEX.lastIndex = 0;
  let match;

  while ((match = TYPE_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    const artifactType = match[1];
    const content = match[2].trim();

    const artifact = {
      id: `artifact-${Date.now()}-${artifacts.length}`,
      type: artifactType,
      content,
      title: generateTitle(artifactType, content),
    };

    artifacts.push(artifact);
    parts.push({ type: 'artifact', artifactIndex: artifacts.length - 1 });
    lastIndex = match.index + match[0].length;
  }

  // If no explicit artifacts found, check for implicit HTML
  if (artifacts.length === 0) {
    const htmlMatch = text.match(/```html\n([\s\S]*?)```/);
    if (htmlMatch && (htmlMatch[1].includes('<!DOCTYPE') || htmlMatch[1].includes('<html'))) {
      const content = htmlMatch[1].trim();
      artifacts.push({
        id: `artifact-${Date.now()}-0`,
        type: 'html',
        content,
        title: generateTitle('html', content),
      });
      const beforeIdx = htmlMatch.index;
      const afterIdx = htmlMatch.index + htmlMatch[0].length;
      if (beforeIdx > 0) parts.push({ type: 'text', content: text.slice(0, beforeIdx) });
      parts.push({ type: 'artifact', artifactIndex: 0 });
      if (afterIdx < text.length) parts.push({ type: 'text', content: text.slice(afterIdx) });
      return { artifacts, parts };
    }
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  if (artifacts.length === 0) {
    return { artifacts: [], parts: [{ type: 'text', content: text }] };
  }

  return { artifacts, parts };
}

function generateTitle(type, content) {
  if (type === 'html') {
    const titleMatch = content.match(/<title>(.*?)<\/title>/i);
    return titleMatch ? titleMatch[1] : 'HTML Document';
  }
  // Try to extract a filename or class name from content
  if (type === 'python') {
    const classMatch = content.match(/^class\s+(\w+)/m);
    if (classMatch) return `${classMatch[1]}.py`;
    const defMatch = content.match(/^def\s+(\w+)/m);
    if (defMatch) return `${defMatch[1]}.py`;
  }
  if (type === 'java') {
    const classMatch = content.match(/class\s+(\w+)/);
    if (classMatch) return `${classMatch[1]}.java`;
  }
  if (type === 'javascript' || type === 'typescript') {
    const fnMatch = content.match(/(?:function|const|class)\s+(\w+)/);
    if (fnMatch) return `${fnMatch[1]}.${type === 'typescript' ? 'ts' : 'js'}`;
  }
  if (type === 'markdown') {
    const h1 = content.match(/^#\s+(.+)/m);
    if (h1) return h1[1].slice(0, 40);
    return 'README.md';
  }
  return TYPE_LABELS[type] || 'File';
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

  // For all code/file types — render as syntax-highlighted code in an HTML page
  const escaped = artifact.content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const langClass = artifact.type === 'code' ? '' : `language-${artifact.type}`;

  return `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"><\/script>
  <style>
    body { margin: 0; background: #0d1117; }
    pre { margin: 0; padding: 1.5rem; }
    code { font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace; font-size: 14px; line-height: 1.6; }
  </style>
</head>
<body>
  <pre><code class="${langClass}">${escaped}</code></pre>
  <script>hljs.highlightAll();<\/script>
</body>
</html>`;
}
