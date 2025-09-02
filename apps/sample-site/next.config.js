/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@webexp/shared', '@webexp/patch-engine', '@webexp/injector'],
  async headers() {
    return [
      {
        // Allow embedding in iframe from localhost (for editor preview)
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' localhost:* 127.0.0.1:*"
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
