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
    systemPrompt: 'You are a helpful assistant. When asked to create visual content, web pages, or interactive applications, wrap the code in an artifact block using ```artifact:type\n...code...\n``` where type is one of: html, react, svg, mermaid. For example, use ```artifact:html for complete HTML pages with embedded CSS/JS.',
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
