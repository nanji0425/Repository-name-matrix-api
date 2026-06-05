'use client';

import { useEffect, useState } from 'react';
import { modelsApi } from '@/lib/api';

export default function ModelsPage() {
  const [models, setModels] = useState<any[]>([]);

  useEffect(() => {
    modelsApi.listActive().then(r => setModels(r.data || [])).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Available Models</h1>
      {models.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          No models available yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((model: any) => (
            <div key={model.id} className="card p-5 hover:border-primary-200 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold">{model.name}</div>
                  <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-500">
                    {model.modelCode}
                  </code>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                  {model.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-gray-500">Input Price</div>
                  <div className="font-medium">${model.inputPrice}/1K</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Output Price</div>
                  <div className="font-medium">${model.outputPrice}/1K</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                Provider: {model.provider?.name || 'N/A'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
