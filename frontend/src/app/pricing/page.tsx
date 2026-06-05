'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Grid3X3, Table2, Zap } from 'lucide-react';

/* ===== Tag color mapping ===== */
const tagColorMap: Record<string, { label: string; className?: string; style?: React.CSSProperties }> = {
  Reasoning: { label: 'Reasoning', className: 'ant-tag ant-tag-blue' },
  Tools: { label: 'Tools', className: 'ant-tag ant-tag-green' },
  Files: { label: 'Files', className: 'ant-tag ant-tag-orange' },
  Vision: {
    label: 'Vision',
    style: { color: '#531dab', background: '#f9f0ff', borderColor: '#d3adf7' },
  },
  400k: { label: '400k', className: 'ant-tag ant-tag-default' },
  '1.1m': { label: '1.1m', className: 'ant-tag ant-tag-default' },
};

/* ===== Filter options ===== */
const supplierOptions = [
  { value: 'all', label: 'All suppliers (7)' },
  { value: 'openai', label: 'OpenAI (6)' },
  { value: 'unknown', label: 'Unknown (1)' },
];

const groupOptions = [
  { value: 'all', label: 'All Groups' },
  { value: 'codex-plus', label: 'codex-plus (0.1x)' },
  { value: 'codex-pro', label: 'codex-pro (0.18x)' },
  { value: 'default', label: 'default (1x)' },
  { value: 'test', label: 'test (2x)' },
];

const billingTypeOptions = [
  { value: 'all', label: 'All Types (7)' },
  { value: 'dynamic', label: 'Dynamic (0)' },
  { value: 'per-usage', label: 'Per-usage (6)' },
  { value: 'per-call', label: 'Per-call (1)' },
];

const tagFilterOptions = [
  { value: 'all', label: 'All Tags (7)' },
  { value: '1.1m', label: '1.1m (1)' },
  { value: '400k', label: '400k (4)' },
  { value: 'files', label: 'files (4)' },
  { value: 'reasoning', label: 'reasoning (5)' },
  { value: 'tools', label: 'tools (5)' },
  { value: 'vision', label: 'vision (5)' },
];

const endpointOptions = [
  { value: 'all', label: 'All Endpoints (7)' },
  { value: 'image-edit', label: 'image-edit' },
  { value: 'image-generation', label: 'image-generation' },
  { value: 'openai', label: 'openai (7)' },
  { value: 'openai-response', label: 'openai-response' },
  { value: 'openai-response-compact', label: 'openai-response-compact' },
];

/* ===== Model data ===== */
interface ModelRow {
  model: string;
  supplier: string;
  inputPrice: string;
  outputPrice: string;
  cachePrice: string;
  tags: string[];
}

// 30% markup over upstream cost
const MARKUP = 1.3;
const markup = (s: string) => {
  if (s === '-' || s.includes('call')) return s;
  const match = s.match(/\$([\d.]+)\/(\w+)/);
  if (!match) return s;
  const price = parseFloat(match[1]) * MARKUP;
  return `$${price.toFixed(3)}/${match[2]}`;
};
const m = (p: ModelRow): ModelRow => ({
  ...p,
  inputPrice: markup(p.inputPrice),
  outputPrice: markup(p.outputPrice),
  cachePrice: markup(p.cachePrice),
});

const modelData: ModelRow[] = [
  { model: 'gpt-5.2', supplier: 'qihang-ai', inputPrice: '$75.00/M', outputPrice: '$600.00/M', cachePrice: '-', tags: ['Reasoning', 'Tools', 'Files'] },
  { model: 'gpt-5.3-codex', supplier: 'vivgrid', inputPrice: '$1.75/M', outputPrice: '$14.00/M', cachePrice: '$0.175/M', tags: ['Reasoning', 'Tools', 'Vision', 'Files'] },
  { model: 'gpt-5.4', supplier: 'vivgrid', inputPrice: '$0.25/M', outputPrice: '$1.50/M', cachePrice: '$0.025/M', tags: ['Reasoning', 'Tools', 'Files'] },
  { model: 'gpt-5.4-mini', supplier: 'vivgrid', inputPrice: '$0.25/M', outputPrice: '$1.50/M', cachePrice: '-', tags: ['Reasoning', 'Tools', 'Files'] },
  { model: 'gpt-5.5', supplier: 'vivgrid', inputPrice: '$0.50/M', outputPrice: '$3.00/M', cachePrice: '$0.05/M', tags: ['Reasoning', 'Tools', 'Files'] },
  { model: 'gpt-image-2', supplier: '-', inputPrice: '$0.06/call', outputPrice: '-', cachePrice: '-', tags: [] },
  { model: 'codex-auto-review', supplier: '-', inputPrice: '$0.50/M', outputPrice: '$3.00/M', cachePrice: '$0.05/M', tags: [] },
].map(m);

const sectionStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '0 24px',
};

export default function PricingPage() {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showRecharge, setShowRecharge] = useState(false);

  /* Filter states */
  const [supplier, setSupplier] = useState('all');
  const [group, setGroup] = useState('all');
  const [billingType, setBillingType] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [endpoint, setEndpoint] = useState('all');

  /* Filter logic */
  const filteredData = modelData.filter((m) => {
    if (supplier !== 'all' && m.supplier !== supplier && !(supplier === 'openai' && (m.supplier === 'qihang-ai' || m.supplier === 'vivgrid'))) return false;
    if (tagFilter !== 'all' && !m.tags.map(t => t.toLowerCase()).includes(tagFilter.toLowerCase())) return false;
    return true;
  });

  /* Helper: render tag badges */
  const renderTags = (tags: string[]) => {
    if (tags.length === 0) return <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>&mdash;</span>;
    return (
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {tags.map((tag) => {
          const meta = tagColorMap[tag];
          if (meta?.className) {
            return <span key={tag} className={meta.className}>{meta.label}</span>;
          }
          if (meta?.style) {
            return (
              <span
                key={tag}
                className="ant-tag"
                style={meta.style}
              >
                {meta.label}
              </span>
            );
          }
          return <span key={tag} className="ant-tag ant-tag-default">{tag}</span>;
        })}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ===== Navigation Bar (matches landing page) ===== */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          borderBottom: '1px solid var(--border-light)',
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={sectionStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: 64,
            }}
          >
            {/* Left: Logo */}
            <Link
              href="/"
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#1677ff',
                textDecoration: 'none',
              }}
            >
              MatrixAPI AI
            </Link>

            {/* Center: Nav Links */}
            <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
              {['Home', 'Pricing', 'Docs', 'Plans'].map((item) => (
                <Link
                  key={item}
                  href={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                  style={{
                    fontSize: 14,
                    color: item === 'Pricing' ? '#1677ff' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontWeight: item === 'Pricing' ? 600 : 400,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#1677ff')}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = item === 'Pricing' ? '#1677ff' : 'var(--text-secondary)';
                  }}
                >
                  {item}
                </Link>
              ))}
            </div>

            {/* Right: Login + Console */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Link
                href="/login"
                style={{
                  fontSize: 14,
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#1677ff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                Login
              </Link>
              <Link
                href="/dashboard"
                className="ant-btn ant-btn-primary"
                style={{
                  height: 36,
                  padding: '0 20px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                }}
              >
                Console
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ===== Page Header ===== */}
      <section
        style={{
          background: 'linear-gradient(135deg, #e8f0fe 0%, #eef2ff 50%, #e0e7ff 100%)',
          padding: '60px 24px 48px',
        }}
      >
        <div style={{ ...sectionStyle, textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 14px',
              background: 'var(--primary-bg)',
              border: '1px solid #91caff',
              borderRadius: 999,
              fontSize: 13,
              color: '#1677ff',
              marginBottom: 20,
            }}
          >
            <Zap size={14} />
            Transparent Pricing
          </div>
          <h1
            style={{
              fontSize: 40,
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              margin: '0 auto 12px',
              maxWidth: 700,
              color: '#1f1f1f',
            }}
          >
            Model Pricing & Token Groups
          </h1>
          <p
            style={{
              fontSize: 16,
              color: 'var(--text-secondary)',
              margin: '0 auto',
              maxWidth: 560,
              lineHeight: 1.6,
            }}
          >
            Pay only for what you use. All prices are in USD.
          </p>
        </div>
      </section>

      {/* ===== Filter Row ===== */}
      <section style={{ background: '#fff', borderBottom: '1px solid var(--border-light)' }}>
        <div style={sectionStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 16,
              padding: '20px 0',
              flexWrap: 'wrap',
            }}
          >
            {/* 1. Supplier */}
            <div style={{ minWidth: 160, flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4, fontWeight: 500 }}>
                Supplier
              </label>
              <select
                className="ant-select"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                style={{ width: '100%' }}
              >
                {supplierOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* 2. Available Token Groups */}
            <div style={{ minWidth: 180, flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4, fontWeight: 500 }}>
                Available Token Groups
              </label>
              <select
                className="ant-select"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                style={{ width: '100%' }}
              >
                {groupOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* 3. Billing Type */}
            <div style={{ minWidth: 150, flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4, fontWeight: 500 }}>
                Billing Type
              </label>
              <select
                className="ant-select"
                value={billingType}
                onChange={(e) => setBillingType(e.target.value)}
                style={{ width: '100%' }}
              >
                {billingTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* 4. Tags */}
            <div style={{ minWidth: 180, flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4, fontWeight: 500 }}>
                Tags
              </label>
              <select
                className="ant-select"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                style={{ width: '100%' }}
              >
                {tagFilterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* 5. Endpoint */}
            <div style={{ minWidth: 180, flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 4, fontWeight: 500 }}>
                Endpoint
              </label>
              <select
                className="ant-select"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                style={{ width: '100%' }}
              >
                {endpointOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ===== View Controls ===== */}
      <section style={{ background: '#fff', borderBottom: '1px solid var(--border-light)' }}>
        <div style={sectionStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            {/* Left: View Mode Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="ant-radio-group">
                <button
                  className={`ant-radio-button ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px' }}
                >
                  <Table2 size={14} />
                  Table
                </button>
                <button
                  className={`ant-radio-button ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px' }}
                >
                  <Grid3X3 size={14} />
                  Grid
                </button>
              </div>

              {/* Copy Button */}
              <button
                className="ant-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                onClick={() => {
                  const text = modelData
                    .map((m) => `${m.model}\t${m.supplier}\t${m.inputPrice}\t${m.outputPrice}\t${m.cachePrice}\t${m.tags.join(', ')}`)
                    .join('\n');
                  navigator.clipboard.writeText(text);
                }}
              >
                <Copy size={14} />
                Copy
              </button>
            </div>

            {/* Right: Show Recharge Prices Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Show Recharge Prices</span>
              <button
                onClick={() => setShowRecharge((prev) => !prev)}
                style={{
                  position: 'relative',
                  width: 40,
                  height: 22,
                  borderRadius: 11,
                  background: showRecharge ? '#1677ff' : '#d9d9d9',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  padding: 0,
                  outline: 'none',
                }}
                aria-label="Toggle recharge prices"
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: showRecharge ? 20 : 2,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Model Pricing Content ===== */}
      <section style={{ padding: '32px 0 60px' }}>
        <div style={sectionStyle}>
          {viewMode === 'table' ? (
            /* ----- Table View ----- */
            <div className="ant-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 12 }}>
              <table className="ant-table">
                <thead>
                  <tr>
                    <th style={{ width: 200 }}>Model</th>
                    <th style={{ width: 120 }}>Supplier</th>
                    <th style={{ width: 140, textAlign: 'right' }}>Input Price</th>
                    <th style={{ width: 140, textAlign: 'right' }}>Output Price</th>
                    <th style={{ width: 140, textAlign: 'right' }}>Cache Price</th>
                    <th>Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, idx) => (
                    <tr key={row.model + idx}>
                      <td style={{ fontWeight: 500 }}>
                        <span style={{ fontSize: 13 }}>{row.model}</span>
                      </td>
                      <td>
                        {row.supplier !== '-' ? (
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{row.supplier}</span>
                        ) : (
                          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>&mdash;</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13 }}>
                        {row.inputPrice}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13 }}>
                        {row.outputPrice}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13, color: row.cachePrice === '-' ? 'var(--text-tertiary)' : undefined }}>
                        {row.cachePrice}
                      </td>
                      <td>{renderTags(row.tags)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* ----- Grid View ----- */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              {filteredData.map((row, idx) => (
                <div
                  key={row.model + idx}
                  className="ant-card"
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    transition: 'all 0.25s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(22,119,255,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  {/* Model name + supplier */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{row.model}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {row.supplier !== '-' ? row.supplier : '—'}
                    </div>
                  </div>

                  {/* Price grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px 16px',
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>Input</div>
                      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'monospace' }}>{row.inputPrice}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>Output</div>
                      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'monospace' }}>{row.outputPrice}</div>
                    </div>
                    {row.cachePrice !== '-' && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>Cache</div>
                        <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'monospace', color: '#1677ff' }}>{row.cachePrice}</div>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
                    {renderTags(row.tags)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footnote */}
          <p
            style={{
              marginTop: 16,
              fontSize: 12,
              color: 'var(--text-tertiary)',
              lineHeight: 1.6,
            }}
          >
            * Prices shown are per 1M tokens unless marked as &quot;/call&quot;. Cache prices apply to
            cache-read tokens only. Final cost may include a dynamic rate multiplier based on
            real-time channel conditions.
          </p>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer
        style={{
          borderTop: '1px solid var(--border-light)',
          padding: '24px 0',
          marginTop: 0,
        }}
      >
        <div
          style={{
            ...sectionStyle,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            &copy; 2026 MatrixAPI. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--text-tertiary)' }}>
            <span>Customer Service: QQ Online</span>
            <span>Powered by New API</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
