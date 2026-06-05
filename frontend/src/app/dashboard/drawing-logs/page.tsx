'use client';

import { Image } from 'lucide-react';

export default function DrawingLogsPage() {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Drawing Logs</h2>
      <div className="ant-card" style={{ textAlign: 'center', padding: 60 }}>
        <Image className="w-12 h-12" style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No drawing logs yet.</p>
      </div>
    </div>
  );
}
