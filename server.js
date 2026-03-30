import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// File upload setup
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, 'dist');
  if (existsSync(distPath)) {
    app.use(express.static(distPath));
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// File upload endpoint
app.post('/api/upload', upload.array('files', 10), (req, res) => {
  try {
    const files = req.files.map((file) => {
      const isText =
        file.mimetype.startsWith('text/') ||
        file.mimetype === 'application/json' ||
        file.mimetype === 'application/javascript' ||
        file.mimetype === 'application/xml' ||
        file.mimetype === 'application/x-yaml' ||
        file.originalname.match(/\.(md|txt|csv|log|py|js|ts|jsx|tsx|html|css|json|xml|yaml|yml|sh|bash|sql|r|go|rs|java|c|cpp|h|hpp|rb|php|swift|kt)$/i);

      const isImage = file.mimetype.startsWith('image/');

      let content = null;
      if (isText) {
        content = file.buffer.toString('utf-8');
      } else if (isImage) {
        content = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      }

      return {
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        isText,
        isImage,
        content,
      };
    });

    res.json({ files });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Build the chat completions URL from a user-provided base URL.
// Accepts any of:
//   http://host:port                -> http://host:port/v1/chat/completions
//   http://host:port/v1             -> http://host:port/v1/chat/completions
//   http://host:port/v1/            -> http://host:port/v1/chat/completions
//   http://host:port/v1/chat/completions  -> unchanged
//   http://host:port/anything/else  -> http://host:port/anything/else/chat/completions
function buildChatUrl(apiBase) {
  let url = apiBase.replace(/\/+$/, '');
  if (url.endsWith('/chat/completions')) return url;
  // If it looks like it already has a versioned path (e.g. /v1, /v2), just append
  if (/\/v\d+$/.test(url)) return url + '/chat/completions';
  // Otherwise append /v1/chat/completions
  return url + '/v1/chat/completions';
}

function buildModelsUrl(apiBase) {
  let url = apiBase.replace(/\/+$/, '');
  if (url.endsWith('/models')) return url;
  if (/\/v\d+$/.test(url)) return url + '/models';
  return url + '/v1/models';
}

// Chat completion proxy (streaming)
app.post('/api/chat', async (req, res) => {
  const { messages, apiKey, apiBase, model, temperature, maxTokens } = req.body;

  if (!apiBase || !model) {
    return res.status(400).json({ error: 'Missing apiBase or model' });
  }

  const chatUrl = buildChatUrl(apiBase);
  console.log(`[chat] POST ${chatUrl} model=${model}`);

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  try {
    const response = await fetch(chatUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: temperature ?? 0.7,
        max_tokens: maxTokens ?? 4096,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[chat] ERROR ${response.status}:`, errText);
      return res.status(response.status).json({
        error: `API returned ${response.status}`,
        details: errText,
      });
    }

    // Stream the response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
      }
    } catch (streamErr) {
      console.error('Stream error:', streamErr);
    }

    res.end();
  } catch (err) {
    console.error('Chat proxy error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Non-streaming chat completion proxy
app.post('/api/chat/sync', async (req, res) => {
  const { messages, apiKey, apiBase, model, temperature, maxTokens } = req.body;

  if (!apiBase || !model) {
    return res.status(400).json({ error: 'Missing apiBase or model' });
  }

  const chatUrl = buildChatUrl(apiBase);
  console.log(`[chat/sync] POST ${chatUrl} model=${model}`);

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  try {
    const response = await fetch(chatUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        temperature: temperature ?? 0.7,
        max_tokens: maxTokens ?? 4096,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: `API returned ${response.status}`,
        details: errText,
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Chat sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch available models
app.post('/api/models', async (req, res) => {
  const { apiKey, apiBase } = req.body;

  if (!apiBase) {
    return res.status(400).json({ error: 'Missing apiBase' });
  }

  const modelsUrl = buildModelsUrl(apiBase);
  console.log(`[models] GET ${modelsUrl}`);

  const headers = {};
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  try {
    const response = await fetch(modelsUrl, { headers });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch models' });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Catch-all for production SPA
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
