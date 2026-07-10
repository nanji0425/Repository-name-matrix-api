import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import ParticleField from '@/components/ParticleField';

export const metadata: Metadata = {
  title: 'MatrixAPI - AI Model Gateway',
  description: 'Unified OpenAI-compatible AI gateway for models, routing, billing, docs, and wallet top-ups.',
  icons: {
    icon: [
      { url: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    apple: '/logo-mark.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ParticleField />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
