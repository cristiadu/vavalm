/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
          {
            hostname: 'tecdn.b-cdn.net',
          },
          {
            hostname: 'flagcdn.com',
          },
          {
            hostname: 'upload.wikimedia.org',
          }
        ],
      },
}

module.exports = nextConfig;