'use client';

import Link from 'next/link';
import { Book, Code, Key, Shield, Cpu, ChevronRight } from 'lucide-react';

const sections = [
  {
    title: 'Getting Started',
    icon: Book,
    items: [
      'Create an account at MatrixAPI',
      'Generate an API Key from the dashboard',
      'Top up your balance',
      'Use the OpenAI SDK with your MatrixAPI key',
    ],
  },
  {
    title: 'Authentication',
    icon: Key,
    items: [
      'All API requests require an API key',
      'Pass your key via the Authorization header: Bearer sk-...',
      'Keys are scoped to your account',
      'You can create multiple keys for different applications',
    ],
  },
  {
    title: 'API Reference',
    icon: Code,
    items: [
      'OpenAI-compatible endpoints at /v1/',
      'Chat Completions: POST /v1/chat/completions',
      'Embeddings: POST /v1/embeddings',
      'Image Generation: POST /v1/images/generations',
      'Audio Transcription: POST /v1/audio/transcriptions',
      'List Models: GET /v1/models',
    ],
  },
  {
    title: 'Endpoints',
    icon: Cpu,
    items: [
      'Use any OpenAI SDK or HTTP client',
      'Set baseURL to your MatrixAPI endpoint',
      'Available models: gpt-4o, claude-3-5-sonnet, gemini-1.5-pro, deepseek-chat, qwen-max, grok-2 and more',
      'All models are billed per-token',
    ],
  },
  {
    title: 'Security',
    icon: Shield,
    items: [
      'All API calls are encrypted via HTTPS',
      'API keys are stored hashed',
      'Rate limiting is applied per-key',
      'Monitor usage in real-time from the dashboard',
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold gradient-text">MatrixAPI</Link>
              <div className="hidden md:flex gap-6">
                <Link href="/models" className="text-sm text-gray-600 hover:text-primary-600">Models</Link>
                <Link href="/pricing" className="text-sm text-gray-600 hover:text-primary-600">Pricing</Link>
                <Link href="/docs" className="text-sm font-medium text-primary-600">Docs</Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm text-gray-600 hover:text-primary-600">Log in</Link>
              <Link href="/register" className="btn-primary">Sign up</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50/50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">API Documentation</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to integrate MatrixAPI into your application. Our API is fully compatible with the OpenAI SDK.
          </p>
        </div>
      </section>

      {/* Code Example */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Start</h2>
          <p className="text-sm text-gray-600 mb-4">Use any OpenAI-compatible SDK with your MatrixAPI key:</p>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Python</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">{`from openai import OpenAI

client = OpenAI(
    base_url="https://api.matrixapi.ai/v1",
    api_key="sk-your-key-here"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)`}</pre>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">JavaScript / TypeScript</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">{`import OpenAI from 'openai';

const client = new OpenAI({
    baseURL: 'https://api.matrixapi.ai/v1',
    apiKey: 'sk-your-key-here',
});

const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hello!' }],
});
console.log(response.choices[0].message.content);`}</pre>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">cURL</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">{`curl https://api.matrixapi.ai/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-your-key-here" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary-50">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="font-semibold">{section.title}</h3>
                </div>
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Build?</h2>
          <p className="text-gray-500 mb-8">Get your API key and start integrating in minutes.</p>
          <Link href="/register" className="btn-primary text-base px-8 py-3">
            Get Started →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="text-sm text-gray-500">© 2024 MatrixAPI. All rights reserved.</div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <Link href="/models" className="hover:text-primary-600">Models</Link>
            <Link href="/pricing" className="hover:text-primary-600">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
