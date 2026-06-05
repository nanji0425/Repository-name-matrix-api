'use client';

import { CreditCard } from 'lucide-react';
import Link from 'next/link';

const plans = [
  { name: '50 Monthly Plan', price: '$50/mo', credit: '$55.00', duration: '1 month', popular: false },
  { name: '110 Monthly Plan', price: '$100/mo', credit: '$111.00', duration: '1 month', popular: true },
  { name: '200 Monthly Plan', price: '$200/mo', credit: '$222.00', duration: '1 month', popular: false },
];

export default function SubscriptionPage() {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Subscription Plans</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Subscribe to a plan and enjoy full access to all AI models.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 900 }}>
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="ant-card"
            style={{
              position: 'relative',
              textAlign: 'center',
              border: plan.popular ? '2px solid var(--primary)' : undefined,
            }}
          >
            {plan.popular && (
              <div
                style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--primary)',
                  color: '#fff',
                  fontSize: 12,
                  padding: '2px 16px',
                  borderRadius: 12,
                  fontWeight: 500,
                }}
              >
                POPULAR
              </div>
            )}
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{plan.price}</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              {plan.credit} credit · {plan.duration}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Full AI model access
            </div>
            <button className="ant-btn ant-btn-primary" style={{ width: '100%' }}>
              Subscribe
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32 }}>
        <Link href="/dashboard/balance" style={{ color: 'var(--primary)', fontSize: 14 }}>
          Prefer pay-as-you-go? Recharge instead →
        </Link>
      </div>
    </div>
  );
}
