# Local Chat UI

A self-hosted chat interface that works with **any OpenAI-compatible API** — NVIDIA Nemotron, OpenAI, OpenRouter, Together AI, Groq, Ollama, LM Studio, and more.

Everything runs on your machine. Your API key never leaves your browser/server.

![Dark themed chat interface](https://img.shields.io/badge/theme-dark-1a1a2e) ![License: MIT](https://img.shields.io/badge/license-MIT-blue)

---

## Features

- **Streaming chat** with real-time token rendering
- **Artifacts** — HTML, React, SVG, and Mermaid diagrams render in a live preview panel
- **File uploads** — drag & drop or click to attach text files and images
- **Conversation history** — persisted in localStorage with search and date grouping
- **Provider presets** — one-click setup for NVIDIA, OpenAI, Groq, Ollama, and more
- **Model browser** — fetch and select from available models on your API
- **Code highlighting** — syntax-highlighted code blocks with one-click copy
- **Fully configurable** — temperature, max tokens, system prompt, all from the UI

---

## Quick Start

### Option A: One command (recommended)

```bash
git clone https://github.com/mayolov/local-chat-ui.git
cd local-chat-ui
./start.sh
```

Open **http://localhost:5173** — the settings panel opens automatically on first launch.

### Option B: Manual

```bash
git clone https://github.com/mayolov/local-chat-ui.git
cd local-chat-ui
npm install
npm run dev
```

### Option C: Docker

```bash
git clone https://github.com/mayolov/local-chat-ui.git
cd local-chat-ui
docker compose up --build
```

Open **http://localhost:3001**.

---

## Requirements

| Method | Requirement |
|--------|-------------|
| **start.sh / npm** | Node.js **18+** ([download](https://nodejs.org)) |
| **Docker** | Docker Engine + Docker Compose |

> **Tip:** If you use [nvm](https://github.com/nvm-sh/nvm), the included `.nvmrc` file will auto-select the right Node version:
> ```bash
> nvm install   # one time
> nvm use       # each session, or add to your shell profile
> ```

---

## Configuration

All configuration happens through the **Settings** panel in the UI (gear icon in the sidebar).

### Supported Providers

| Provider | API Base URL | Example Model |
|----------|-------------|---------------|
| **NVIDIA Nemotron** (default) | `https://integrate.api.nvidia.com` | `nvidia/llama-3.1-nemotron-70b-instruct` |
| **OpenAI** | `https://api.openai.com` | `gpt-4o` |
| **OpenRouter** | `https://openrouter.ai/api` | `meta-llama/llama-3.1-70b-instruct` |
| **Together AI** | `https://api.together.xyz` | `meta-llama/Llama-3.1-70B-Instruct-Turbo` |
| **Groq** | `https://api.groq.com/openai` | `llama-3.1-70b-versatile` |
| **Ollama** (local) | `http://localhost:11434` | `llama3.1` |
| **LM Studio** (local) | `http://localhost:1234` | *(auto-detected)* |
| **Any OpenAI-compatible** | Your endpoint URL | Your model name |

Click a **preset button** in settings to auto-fill the base URL and a default model, then enter your API key.

### Using with NVIDIA Nemotron

1. Get an API key from [NVIDIA NGC](https://build.nvidia.com/)
2. Open the app and go to **Settings**
3. Select the **NVIDIA Nemotron** preset (pre-selected by default)
4. Paste your API key
5. Click **Save Settings**

### Using with Ollama (fully offline)

1. Install [Ollama](https://ollama.com) and pull a model:
   ```bash
   ollama pull llama3.1
   ```
2. Open the app, go to **Settings**, select **Local (Ollama)**
3. Leave the API key empty (Ollama doesn't require one)
4. Click **Fetch Models** to see available models, or type the name manually
5. Save and start chatting

---

## Artifacts

The AI can generate interactive content that renders in a side panel. Artifacts are triggered when the model outputs fenced code blocks with the `artifact:` prefix:

````
```artifact:html
<!DOCTYPE html>
<html>...</html>
```
````

| Type | Tag | What it renders |
|------|-----|-----------------|
| HTML | `artifact:html` | Full HTML pages with CSS/JS in a sandboxed iframe |
| React | `artifact:react` | React components (loaded via CDN + Babel) |
| SVG | `artifact:svg` | Inline SVG graphics |
| Mermaid | `artifact:mermaid` | Flowcharts, sequence diagrams, etc. |

The artifact panel supports **live preview**, **source view**, **copy**, **download**, and **fullscreen**.

> **Note:** The default system prompt already instructs the model to use artifacts. You can customize it in Settings.

---

## File Uploads

- **Text files** (.txt, .md, .py, .js, .json, .csv, .sql, .html, .css, etc.) are read and injected into the conversation as context
- **Images** (.png, .jpg, .gif, .webp) are sent as base64 for vision-capable models
- **Drag & drop** files anywhere on the chat, or click the paperclip icon
- Max file size: 20 MB

---

## Project Structure

```
local-chat-ui/
├── server.js                 # Express backend (API proxy + file upload)
├── src/
│   ├── App.jsx               # Main app with state management
│   ├── main.jsx              # React entry point
│   ├── index.css             # Tailwind + custom styles
│   ├── components/
│   │   ├── ChatView.jsx      # Chat messages + input area
│   │   ├── MessageBubble.jsx # Individual message rendering + markdown
│   │   ├── Sidebar.jsx       # Conversation list
│   │   ├── ArtifactPanel.jsx # Artifact preview/code panel
│   │   └── SettingsModal.jsx # Settings with provider presets
│   └── utils/
│       ├── artifacts.js      # Artifact parsing + HTML generation
│       ├── storage.js        # localStorage persistence
│       └── streamParser.js   # SSE stream parser
├── start.sh                  # One-command launcher
├── Dockerfile                # Container build
├── docker-compose.yml        # Container orchestration
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev servers with hot reload (frontend :5173, backend :3001) |
| `npm run build` | Build frontend for production |
| `npm start` | Start production server on :3001 (run `build` first) |
| `npm run prod` | Build + start production in one command |

---

## Production Deployment

### Standalone

```bash
npm run prod
# or
./start.sh --prod
```

This builds the frontend and serves everything from a single Express server on port **3001**.

### Docker

```bash
docker compose up -d --build
```

### Behind a Reverse Proxy (nginx)

```nginx
server {
    listen 80;
    server_name chat.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_buffering off;           # required for SSE streaming
        proxy_cache off;
    }
}
```

---

## Troubleshooting

### "Node.js is not installed" or version too old

Install Node.js 18+ from [nodejs.org](https://nodejs.org), or use nvm:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
```

### API returns errors

- Double-check your **API key** and **base URL** in Settings
- Click **Fetch Models** to verify your API connection works
- Check the browser console (F12) and terminal for error details
- Some providers require specific model name formats — use the model browser

### Streaming doesn't work

- Ensure your API supports SSE streaming (most OpenAI-compatible APIs do)
- If behind a reverse proxy, disable response buffering (`proxy_buffering off` in nginx)

### Artifacts don't render

- The model must output code in the `` ```artifact:type `` format
- Check that the system prompt includes artifact instructions (the default does)
- React artifacts require an internet connection (loads React from CDN)

---

## License

[MIT](LICENSE)
