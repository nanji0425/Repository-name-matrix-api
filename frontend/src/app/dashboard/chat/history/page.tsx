'use client';

import {History} from 'lucide-react';

export default function ChatHistoryPage() {
  return (
    <div>
      <h2 style={{fontSize: 20, fontWeight: 600, marginBottom: 16}}>Chat History</h2>
      <div className="ant-card" style={{textAlign: 'center', padding: 60}}>
        <History className="w-12 h-12" style={{color: 'var(--text-tertiary)', margin: '0 auto 16px'}} />
        <p style={{color: 'var(--text-secondary)', fontSize: 14}}>No chat history yet.</p>
      </div>
    </div>
  );
}
