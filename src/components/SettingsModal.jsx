import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Eye, EyeOff } from 'lucide-react';

const PRESETS = [
  {
    name: 'NVIDIA Nemotron',
    apiBase: 'https://integrate.api.nvidia.com',
    model: 'nvidia/llama-3.1-nemotron-70b-instruct',
  },
  {
    name: 'OpenAI',
    apiBase: 'https://api.openai.com',
    model: 'gpt-4o',
  },
  {
    name: 'OpenRouter',
    apiBase: 'https://openrouter.ai/api',
    model: 'meta-llama/llama-3.1-70b-instruct',
  },
  {
    name: 'Together AI',
    apiBase: 'https://api.together.xyz',
    model: 'meta-llama/Llama-3.1-70B-Instruct-Turbo',
  },
  {
    name: 'Groq',
    apiBase: 'https://api.groq.com/openai',
    model: 'llama-3.1-70b-versatile',
  },
  {
    name: 'Local (Ollama)',
    apiBase: 'http://localhost:11434',
    model: 'llama3.1',
  },
  {
    name: 'Local (LM Studio)',
    apiBase: 'http://localhost:1234',
    model: 'local-model',
  },
  {
    name: 'Custom',
    apiBase: '',
    model: '',
  },
];

export default function SettingsModal({ settings, onSave, onClose }) {
  const [form, setForm] = useState({ ...settings });
  const [showKey, setShowKey] = useState(false);
  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const fetchModels = async () => {
    if (!form.apiKey || !form.apiBase) return;
    setLoadingModels(true);
    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: form.apiKey, apiBase: form.apiBase }),
      });
      if (res.ok) {
        const data = await res.json();
        const modelList = (data.data || []).map((m) => m.id).sort();
        setModels(modelList);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    }
    setLoadingModels(false);
  };

  const applyPreset = (preset) => {
    update('apiBase', preset.apiBase);
    update('model', preset.model);
    setModels([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-chat-sidebar border border-chat-border rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-chat-border">
          <h2 className="text-lg font-semibold text-gray-100">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-chat-hover text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Provider Preset
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    form.apiBase === preset.apiBase
                      ? 'border-chat-accent bg-chat-accent/10 text-chat-accent-light'
                      : 'border-chat-border text-gray-400 hover:bg-chat-hover hover:text-gray-200'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={form.apiKey}
                onChange={(e) => update('apiKey', e.target.value)}
                placeholder="Enter your API key..."
                className="w-full bg-chat-input border border-chat-border rounded-lg px-3 py-2 pr-10 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-chat-accent/50"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* API Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              API Base URL
            </label>
            <input
              type="text"
              value={form.apiBase}
              onChange={(e) => update('apiBase', e.target.value)}
              placeholder="https://api.example.com"
              className="w-full bg-chat-input border border-chat-border rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-chat-accent/50"
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Model
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => update('model', e.target.value)}
                  placeholder="Model name..."
                  list="model-list"
                  className="w-full bg-chat-input border border-chat-border rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-chat-accent/50"
                />
                {models.length > 0 && (
                  <datalist id="model-list">
                    {models.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                )}
              </div>
              <button
                onClick={fetchModels}
                disabled={loadingModels || !form.apiKey}
                className="px-3 py-2 rounded-lg bg-chat-hover text-gray-300 hover:text-white text-sm flex items-center gap-1.5 transition-colors disabled:opacity-40"
                title="Fetch available models"
              >
                <RefreshCw size={14} className={loadingModels ? 'animate-spin' : ''} />
                Models
              </button>
            </div>
            {models.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto rounded-lg border border-chat-border bg-chat-bg">
                {models.map((m) => (
                  <button
                    key={m}
                    onClick={() => update('model', m)}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-chat-hover transition-colors ${
                      m === form.model ? 'text-chat-accent-light bg-chat-accent/5' : 'text-gray-400'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Temperature: {form.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={form.temperature}
              onChange={(e) => update('temperature', parseFloat(e.target.value))}
              className="w-full accent-chat-accent"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Precise (0)</span>
              <span>Creative (2)</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Max Tokens
            </label>
            <input
              type="number"
              min="256"
              max="128000"
              value={form.maxTokens}
              onChange={(e) => update('maxTokens', parseInt(e.target.value) || 4096)}
              className="w-full bg-chat-input border border-chat-border rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-chat-accent/50"
            />
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              System Prompt
            </label>
            <textarea
              value={form.systemPrompt}
              onChange={(e) => update('systemPrompt', e.target.value)}
              rows={4}
              className="w-full bg-chat-input border border-chat-border rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-chat-accent/50 resize-none"
              placeholder="Optional system instructions..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-chat-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-chat-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-chat-accent hover:bg-chat-accent/80 text-white transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
