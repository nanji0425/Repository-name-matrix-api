'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Zap,
  Shield,
  BarChart3,
  GitBranch,
  Wallet,
  CreditCard,
  Clock,
  TrendingUp,
  Check,
  ChevronRight,
} from 'lucide-react';

const models = ['gpt-5.5', 'gpt-5.4', 'gpt-5.4-mini', 'gpt-5.3-codex', 'codex-auto-review', 'deepseek-chat'];
const groups = [
  { value: 'codex-plus', label: 'codex-plus', multiplier: '0.1x' },
  { value: 'codex-pro', label: 'codex-pro', multiplier: '0.18x' },
  { value: 'default', label: 'default', multiplier: '1x' },
  { value: 'test', label: 'test', multiplier: '2x' },
];

const plans = [
  { price: 50, credit: 55, period: '1 month' },
  { price: 100, credit: 111, period: '1 month' },
  { price: 200, credit: 222, period: '1 month' },
];

const advantages = [
  {
    icon: <GitBranch size={32} />,
    title: 'Multi-channel auto-switch',
    desc: 'Intelligent health detection and latency evaluation',
  },
  {
    icon: <Zap size={32} />,
    title: 'Model & tool capability recognition',
    desc: 'Auto-detect model capabilities',
  },
  {
    icon: <Shield size={32} />,
    title: 'Circuit breaker & rate limiting',
    desc: 'Multi-dimensional fault isolation',
  },
  {
    icon: <BarChart3 size={32} />,
    title: 'Unified billing & usage tracking',
    desc: 'Aggregate multi-channel billing',
  },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [selectedModel, setSelectedModel] = useState('gpt-5.5');
  const [selectedGroup, setSelectedGroup] = useState('default');
  const [ratio, setRatio] = useState(1);
  const [dynamicMultiplier, setDynamicMultiplier] = useState(0.0556);
  const [rateTrend, setRateTrend] = useState<'today' | 'yesterday' | '7days'>('today');

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const sectionStyle: React.CSSProperties = {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ===== Navigation Bar ===== */}
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
                  href={item === 'Home' ? '/' : item === 'Plans' ? '/pricing' : `/${item.toLowerCase()}`}
                  style={{
                    fontSize: 14,
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#1677ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
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

      {/* ===== Hero Section ===== */}
      <section
        style={{
          background: 'linear-gradient(135deg, #e8f0fe 0%, #eef2ff 50%, #e0e7ff 100%)',
          padding: '80px 24px 100px',
        }}
      >
        <div style={{ ...sectionStyle, textAlign: 'center' }}>
          {/* Badge */}
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
              marginBottom: 24,
            }}
          >
            <Zap size={14} />
            Unified AI API Gateway
          </div>

          {/* Big Title */}
          <h1
            style={{
              fontSize: 48,
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              margin: '0 auto 20px',
              maxWidth: 800,
              color: '#1f1f1f',
            }}
          >
            Unified AI API Gateway,<br />
            Stable Access to Multiple Model Services
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 18,
              color: 'var(--text-secondary)',
              margin: '0 auto 40px',
              maxWidth: 600,
              lineHeight: 1.6,
            }}
          >
            Multi-channel intelligent scheduling, circuit breaker bypass, transparent billing
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <Link
              href="/register"
              className="ant-btn ant-btn-primary"
              style={{
                height: 48,
                padding: '0 32px',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
              }}
            >
              Get Started <ChevronRight size={18} style={{ marginLeft: 4 }} />
            </Link>
            <Link
              href="/pricing"
              className="ant-btn"
              style={{
                height: 48,
                padding: '0 32px',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
                border: '1px solid var(--border)',
              }}
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Real-time Price Calculator ===== */}
      <section style={{ ...sectionStyle, marginTop: -40, marginBottom: 60 }}>
        <div
          className="ant-card"
          style={{
            borderRadius: 12,
            padding: 32,
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
            {/* Left Column - Configuration */}
            <div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  marginBottom: 24,
                  color: 'var(--text-primary)',
                }}
              >
                Price Calculator
              </h3>

              {/* 1. Model Selector */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                  }}
                >
                  Model
                </label>
                <select
                  className="ant-select"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Group Selector */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                  }}
                >
                  Group
                </label>
                <select
                  className="ant-select"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {groups.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label} ({g.multiplier})
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Recharge Ratio */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                  }}
                >
                  Recharge Ratio: RMB / $1
                </label>
                <input
                  type="number"
                  className="ant-input"
                  value={ratio}
                  onChange={(e) => setRatio(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              {/* 4. Dynamic Multiplier */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                  }}
                >
                  Dynamic Multiplier
                </label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span
                    style={{
                      padding: '4px 12px',
                      background: '#f0f5ff',
                      borderRadius: 4,
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#1677ff',
                    }}
                  >
                    {dynamicMultiplier.toFixed(4)}x
                  </span>
                  <input
                    type="number"
                    className="ant-input"
                    step={0.0001}
                    value={dynamicMultiplier}
                    onChange={(e) => setDynamicMultiplier(Number(e.target.value))}
                    style={{ width: 160 }}
                  />
                </div>
              </div>

              {/* 5. Rate Cap */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                  }}
                >
                  Rate Cap
                </label>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#1677ff',
                    }}
                  >
                    0.0650x
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    set at 6/5 11:50
                  </span>
                </div>
              </div>

              {/* 6. Rate Trend Toggle */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                  }}
                >
                  Rate Trend
                </label>
                <div className="ant-radio-group">
                  {(['today', 'yesterday', '7days'] as const).map((tab) => (
                    <button
                      key={tab}
                      className={`ant-radio-button ${rateTrend === tab ? 'active' : ''}`}
                      onClick={() => setRateTrend(tab)}
                    >
                      {tab === 'today' ? 'Today' : tab === 'yesterday' ? 'Yesterday' : '7 Days'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Price Display */}
            <div>
              <div
                className="stat-card"
                style={{ marginBottom: 20, background: '#fafbff' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    Current dynamic rate{' '}
                    <strong style={{ color: '#1677ff' }}>
                      {dynamicMultiplier.toFixed(4)}x
                    </strong>
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                    Original 1x
                  </span>
                </div>

                <table className="ant-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Discounted Price</th>
                      <th>Original Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Input price</td>
                      <td style={{ fontWeight: 600, color: '#1677ff' }}>
                        &yen;0.278 / 1M Tokens
                      </td>
                      <td style={{ color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>
                        &yen;5 / 1M Tokens
                      </td>
                    </tr>
                    <tr>
                      <td>Output price</td>
                      <td style={{ fontWeight: 600, color: '#1677ff' }}>
                        &yen;1.67 / 1M Tokens
                      </td>
                      <td style={{ color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>
                        &yen;30 / 1M Tokens
                      </td>
                    </tr>
                    <tr>
                      <td>Cache read price</td>
                      <td style={{ fontWeight: 600, color: '#1677ff' }}>
                        &yen;0.028 / 1M Tokens
                      </td>
                      <td style={{ color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>
                        &yen;0.5 / 1M Tokens
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Stats Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 12,
                }}
              >
                <div
                  className="stat-card"
                  style={{ textAlign: 'center', padding: '16px 12px' }}
                >
                  <div className="stat-label">Avg first packet</div>
                  <div className="stat-value" style={{ fontSize: 22 }}>
                    2.84s
                  </div>
                </div>
                <div
                  className="stat-card"
                  style={{ textAlign: 'center', padding: '16px 12px' }}
                >
                  <div className="stat-label">Avg completion</div>
                  <div className="stat-value" style={{ fontSize: 22 }}>
                    16.01s
                  </div>
                </div>
                <div
                  className="stat-card"
                  style={{ textAlign: 'center', padding: '16px 12px' }}
                >
                  <div className="stat-label">Success rate</div>
                  <div className="stat-value" style={{ fontSize: 22, color: '#52c41a' }}>
                    98.8%
                  </div>
                </div>
                <div
                  className="stat-card"
                  style={{ textAlign: 'center', padding: '16px 12px' }}
                >
                  <div className="stat-label">Healthy channels</div>
                  <div className="stat-value" style={{ fontSize: 22 }}>
                    15/15
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Four Advantages Section ===== */}
      <section style={{ ...sectionStyle, marginBottom: 80 }}>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          Why Choose MatrixAPI?
        </h2>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: 15,
            marginBottom: 40,
          }}
        >
          Enterprise-grade infrastructure for AI API aggregation
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
          }}
        >
          {advantages.map((adv) => (
            <div
              key={adv.title}
              className="ant-card"
              style={{
                padding: 28,
                textAlign: 'center',
                transition: 'all 0.25s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(22,119,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: 'var(--primary-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: '#1677ff',
                }}
              >
                {adv.icon}
              </div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                {adv.title}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {adv.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Plans Section ===== */}
      <section
        style={{
          background: '#f7f9fc',
          padding: '80px 24px',
          marginBottom: 0,
        }}
      >
        <div style={sectionStyle}>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            Subscription Plans
          </h2>
          <p
            style={{
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: 15,
              marginBottom: 48,
            }}
          >
            Choose a plan that fits your needs. All plans include full AI model access.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 24,
              maxWidth: 900,
              margin: '0 auto',
            }}
          >
            {plans.map((plan, idx) => (
              <div
                key={plan.price}
                className="ant-card"
                style={{
                  padding: 36,
                  textAlign: 'center',
                  position: 'relative',
                  borderRadius: 12,
                  border: idx === 1 ? '2px solid #1677ff' : '1px solid var(--border)',
                  transition: 'all 0.25s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(22,119,255,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                {idx === 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: '#1677ff',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '2px 14px',
                      borderRadius: 999,
                    }}
                  >
                    POPULAR
                  </div>
                )}
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  ${plan.price}/month
                </div>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 700,
                    color: '#1677ff',
                    marginBottom: 4,
                  }}
                >
                  ${plan.credit.toFixed(2)}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--text-tertiary)',
                    marginBottom: 20,
                  }}
                >
                  credit, {plan.period}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginBottom: 24,
                    fontSize: 14,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Check size={16} color="#52c41a" />
                  Full AI model access
                </div>
                <Link
                  href="/register"
                  className={`ant-btn ${idx === 1 ? 'ant-btn-primary' : ''}`}
                  style={{
                    width: '100%',
                    height: 42,
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                  }}
                >
                  Subscribe
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Recharge Balance Section ===== */}
      <section style={{ ...sectionStyle, padding: '60px 0' }}>
        <div
          className="ant-card"
          style={{
            padding: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #f0f5ff 0%, #e8f0fe 100%)',
            border: '1px solid #91caff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              <CreditCard
                size={22}
                style={{ marginRight: 8, verticalAlign: 'middle', color: '#1677ff' }}
              />
              Recharge Balance
            </h3>
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                marginBottom: 16,
                lineHeight: 1.6,
              }}
            >
              Pay-as-you-go, flexible usage beyond plans
            </p>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <span
                  style={{
                    fontSize: 13,
                    color: 'var(--text-tertiary)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Recharge ratio
                </span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>
                  1 USD = 1 credit
                </span>
              </div>
              <div>
                <span
                  style={{
                    fontSize: 13,
                    color: 'var(--text-tertiary)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Min recharge
                </span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>$10</span>
              </div>
              <div>
                <span
                  style={{
                    fontSize: 13,
                    color: 'var(--text-tertiary)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Deduction method
                </span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>Real-time</span>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="ant-btn ant-btn-primary"
            style={{
              height: 44,
              padding: '0 28px',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <Wallet size={18} style={{ marginRight: 6 }} />
            Recharge Now
          </Link>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer
        style={{
          borderTop: '1px solid var(--border-light)',
          padding: '24px 0',
          marginTop: 40,
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
