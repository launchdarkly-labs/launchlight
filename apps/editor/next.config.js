/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@webexp/shared', '@webexp/patch-engine', '@webexp/ld-adapter', '@webexp/publisher'],
  async headers() {
    return [
      {
        // CORS headers for API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
