const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'matrixapi.ai'],
  },
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
