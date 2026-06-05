'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { modelsApi } from '@/lib/api';
import { Brain, CheckCircle, Zap, Globe } from 'lucide-react';

export default function ModelsPage() {
  const [models, setModels] = useState<any[]>([]);

  useEffect(() => {
    modelsApi.listActive().then(r => setModels(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold gradient-text">MatrixAPI</Link>
              <div className="hidden md:flex gap-6">
                <Link href="/models" className="text-sm font-medium text-primary-600">Models</Link>
                <Link href="/pricing" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">Pricing</Link>
                <Link href="/docs" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">Docs</Link>
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
          <h1 className="text-4xl font-bold mb-4">AI Models</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Access the most powerful AI models through a single unified API. All models are production-ready and optimized for performance.
          </p>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Zap, title: 'Low Latency', desc: 'Optimized routing to the fastest available provider' },
            { icon: CheckCircle, title: 'High Reliability', desc: 'Automatic failover between providers' },
            { icon: Globe, title: 'Global Coverage', desc: 'Models hosted across multiple regions' },
          ].map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card p-5 flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary-50 shrink-0">
                  <Icon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Models Grid */}
        <h2 className="text-2xl font-bold mb-6">Available Models ({models.length})</h2>
        {models.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">Loading models...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model: any) => (
              <div key={model.id} className="card p-5 hover:border-primary-200 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold">{model.name}</div>
                    <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-500">
                      {model.modelCode}
                    </code>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                    Active
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Input Price</div>
                    <div className="font-medium">${model.inputPrice}/1K tokens</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Output Price</div>
                    <div className="font-medium">${model.outputPrice}/1K tokens</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  Provider: {model.provider?.name || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="text-sm text-gray-500">© 2024 MatrixAPI. All rights reserved.</div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <Link href="/pricing" className="hover:text-primary-600">Pricing</Link>
            <Link href="/docs" className="hover:text-primary-600">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
