const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'matrixapi.ai'],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost', '43.154.77.5', 'api.token-bits.com'],
    },
  },
};

module.exports = nextConfig;
