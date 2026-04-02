const SETTINGS_KEY = 'chat-ui-settings';
const CONVERSATIONS_KEY = 'chat-ui-conversations';

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    apiKey: '',
    apiBase: '',
    model: 'NVIDIA-Nemotron-3-Super-120B-A12B-FP8',
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: 'You are a helpful assistant. When generating code, files, or visual content, wrap them in artifact blocks so the user can preview and download them.\n\nUse this format:\n```artifact:TYPE\n...content...\n```\n\nSupported types:\n- Interactive: html, react, svg, mermaid\n- Code files: python, java, javascript, typescript, go, rust, cpp, c, ruby, php, shell, sql\n- Data/config: json, csv, yaml, xml, toml, dockerfile, makefile\n- Documents: markdown, text, css\n\nExamples:\n- For a Python script: ```artifact:python\n- For a README: ```artifact:markdown\n- For a web page: ```artifact:html\n- For a diagram: ```artifact:mermaid\n\nAlways use artifact blocks when the user asks you to create, generate, or write a file.',
  };
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadConversations() {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveConversations(conversations) {
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
}
