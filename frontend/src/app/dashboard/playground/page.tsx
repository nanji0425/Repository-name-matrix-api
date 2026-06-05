'use client';

import { useState, useRef, useEffect } from 'react';
import { SendHorizontal, Download, Upload, Bot, User, Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Config {
  group: string;
  model: string;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  maxTokens: string;
  seed: string;
  stream: boolean;
  imageUrl: string;
}

const GROUPS = ['plus', 'codex-plus', 'codex-pro', 'default', 'test'];

const MODELS = [
  'codex-auto-review',
  'gpt-5.5',
  'gpt-5.4',
  'gpt-5.3',
  'gpt-5.2',
  'gpt-5.1',
  'gpt-5.0',
  'gpt-4.5',
  'gpt-4.1',
  'gpt-4o',
  'gpt-4o-mini',
  'o3',
  'o3-mini',
  'o4-mini',
  'claude-sonnet-5',
  'claude-haiku-5',
  'claude-opus-5',
];

const DEFAULT_CONFIG: Config = {
  group: 'plus',
  model: 'codex-auto-review',
  temperature: 0.7,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  maxTokens: '',
  seed: '',
  stream: true,
  imageUrl: '',
};

const SAMPLE_RESPONSE =
  "Hello! I'm CodeToken AI. I can help you with code review, debugging, optimization, and general programming questions. How can I assist you today?";

export default function PlaygroundPage() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateConfig = <K extends keyof Config>(key: K, value: Config[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Simulate a short delay to show loading state
    setTimeout(() => {
      const assistantMessage: Message = { role: 'assistant', content: SAMPLE_RESPONSE };
      setMessages((prev) => [...prev, assistantMessage]);
      setLoading(false);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const exportConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'codetoken-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          setConfig((prev) => ({ ...prev, ...parsed }));
        } catch {
          // ignore invalid JSON
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const currentModelLabel = config.model
    ? config.model === 'codex-auto-review'
      ? 'CodeX Auto Review'
      : config.model
    : 'Not selected';

  return (
    <div className="flex gap-4 h-[calc(100vh-128px)]">
      {/* ===== Left Panel - Configuration ===== */}
      <div className="w-[35%] min-w-[300px] flex flex-col">
        <div className="ant-card flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            <h3 className="font-semibold text-base">Model Configuration</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {/* Group */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Group
              </label>
              <div className="relative">
                <button
                  onClick={() => { setGroupOpen(!groupOpen); setModelOpen(false); }}
                  className="ant-select w-full text-left flex items-center justify-between"
                >
                  <span>{config.group}</span>
                  <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                </button>
                {groupOpen && (
                  <div
                    className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg shadow-lg overflow-hidden"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    {GROUPS.map((g) => (
                      <button
                        key={g}
                        onClick={() => { updateConfig('group', g); setGroupOpen(false); }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm transition-colors',
                          g === config.group
                            ? 'font-medium'
                            : ''
                        )}
                        style={{
                          color: g === config.group ? 'var(--primary)' : 'var(--text-primary)',
                          background: g === config.group ? 'var(--primary-bg)' : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (g !== config.group) (e.currentTarget as HTMLElement).style.background = '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                          if (g !== config.group) (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Model
              </label>
              <div className="relative">
                <button
                  onClick={() => { setModelOpen(!modelOpen); setGroupOpen(false); }}
                  className="ant-select w-full text-left flex items-center justify-between"
                >
                  <span className="truncate">{currentModelLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                </button>
                {modelOpen && (
                  <div
                    className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  >
                    {MODELS.map((m) => (
                      <button
                        key={m}
                        onClick={() => { updateConfig('model', m); setModelOpen(false); }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm transition-colors',
                          m === config.model ? 'font-medium' : ''
                        )}
                        style={{
                          color: m === config.model ? 'var(--primary)' : 'var(--text-primary)',
                          background: m === config.model ? 'var(--primary-bg)' : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (m !== config.model) (e.currentTarget as HTMLElement).style.background = '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                          if (m !== config.model) (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Temperature
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={config.temperature}
                  onChange={(e) => updateConfig('temperature', parseFloat(e.target.value) || 0)}
                  className="ant-input"
                />
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: 'var(--primary)' }}
                />
              </div>
            </div>

            {/* Top P */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Top P
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={config.topP}
                onChange={(e) => updateConfig('topP', parseFloat(e.target.value) || 0)}
                className="ant-input"
              />
            </div>

            {/* Frequency Penalty */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Frequency Penalty
              </label>
              <input
                type="number"
                step="0.1"
                min="-2"
                max="2"
                value={config.frequencyPenalty}
                onChange={(e) => updateConfig('frequencyPenalty', parseFloat(e.target.value) || 0)}
                className="ant-input"
              />
            </div>

            {/* Presence Penalty */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Presence Penalty
              </label>
              <input
                type="number"
                step="0.1"
                min="-2"
                max="2"
                value={config.presencePenalty}
                onChange={(e) => updateConfig('presencePenalty', parseFloat(e.target.value) || 0)}
                className="ant-input"
              />
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Max Tokens
              </label>
              <input
                type="number"
                min="1"
                value={config.maxTokens}
                onChange={(e) => updateConfig('maxTokens', e.target.value)}
                className="ant-input"
                placeholder="Optional"
              />
            </div>

            {/* Seed */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Seed
              </label>
              <input
                type="number"
                value={config.seed}
                onChange={(e) => updateConfig('seed', e.target.value)}
                className="ant-input"
                placeholder="Optional"
              />
            </div>

            {/* Stream Toggle */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Stream
              </label>
              <button
                onClick={() => updateConfig('stream', !config.stream)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  config.stream ? 'bg-blue-500' : 'bg-gray-300'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    config.stream ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
              <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {config.stream ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Image URL
              </label>
              <input
                type="text"
                value={config.imageUrl}
                onChange={(e) => updateConfig('imageUrl', e.target.value)}
                className="ant-input"
                placeholder="https://example.com/image.jpg (optional)"
              />
            </div>
          </div>

          {/* Bottom actions */}
          <div className="ant-divider mt-4 mb-3" />
          <div className="flex gap-2">
            <button onClick={exportConfig} className="ant-btn text-xs flex-1">
              <Download className="w-3.5 h-3.5" />
              Export Config
            </button>
            <button onClick={importConfig} className="ant-btn text-xs flex-1">
              <Upload className="w-3.5 h-3.5" />
              Import Config
            </button>
          </div>
          <p className="text-xs text-center mt-3" style={{ color: 'var(--text-tertiary)' }}>
            No saved configurations
          </p>
        </div>
      </div>

      {/* ===== Right Panel - Chat Interface ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="ant-card flex flex-col flex-1 overflow-hidden p-0">
          {/* Title bar */}
          <div
            className="flex items-center justify-between px-5 py-3 border-b shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              <span className="font-semibold text-sm">{currentModelLabel}</span>
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}
              >
                {config.group}
              </span>
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: 'var(--text-secondary)' }}>
              <span>Show Debug</span>
              <button
                onClick={() => setShowDebug(!showDebug)}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                  showDebug ? 'bg-blue-500' : 'bg-gray-300'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                    showDebug ? 'translate-x-[18px]' : 'translate-x-[2px]'
                  )}
                />
              </button>
            </label>
          </div>

          {/* Chat messages area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ background: '#fafafa' }}>
            {messages.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="w-12 h-12 mb-3" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Send a message to start chatting
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Use the configuration panel to adjust model parameters
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {msg.role === 'assistant' && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: 'var(--primary-bg)' }}
                      >
                        <Bot className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[75%] rounded-lg px-4 py-2.5 text-sm leading-relaxed',
                        msg.role === 'user'
                          ? ''
                          : ''
                      )}
                      style={
                        msg.role === 'user'
                          ? { background: 'var(--primary)', color: '#fff', borderBottomRightRadius: 4 }
                          : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderBottomLeftRadius: 4 }
                      }
                    >
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: 'var(--primary)', color: '#fff' }}
                      >
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'var(--primary-bg)' }}
                    >
                      <Bot className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                    </div>
                    <div
                      className="rounded-lg px-4 py-3"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderBottomLeftRadius: 4 }}
                    >
                      <div className="flex gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{ background: 'var(--text-tertiary)', animationDelay: '0ms' }}
                        />
                        <span
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{ background: 'var(--text-tertiary)', animationDelay: '150ms' }}
                        />
                        <span
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{ background: 'var(--text-tertiary)', animationDelay: '300ms' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Debug panel */}
          {showDebug && messages.length > 0 && (
            <div
              className="border-t px-5 py-3 text-xs max-h-32 overflow-y-auto shrink-0"
              style={{ borderColor: 'var(--border)', background: '#fafafa' }}
            >
              <div className="font-medium mb-1 text-xs" style={{ color: 'var(--text-secondary)' }}>Debug Info</div>
              {messages.map((msg, i) => (
                <div key={i} className="mb-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  [{msg.role}] {msg.content.length > 80 ? `${msg.content.slice(0, 80)}...` : msg.content}
                </div>
              ))}
            </div>
          )}

          {/* Input area */}
          <div
            className="flex items-center gap-3 px-5 py-4 border-t shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="ant-input flex-1"
              placeholder="Type your message..."
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="ant-btn ant-btn-primary"
              style={{ opacity: loading || !input.trim() ? 0.6 : 1 }}
            >
              <SendHorizontal className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
