'use client';

import { Shield } from 'lucide-react';

export default function ChannelStatusPage() {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Channel Status</h2>
      <div className="ant-card" style={{ textAlign: 'center', padding: 60 }}>
        <Shield className="w-12 h-12" style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Channel monitoring requires admin privileges.</p>
      </div>
    </div>
  );
}
