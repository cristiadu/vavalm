/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    // Will be available on both server and client
    API_BASE_URL: process.env.API_BASE_URL,
  },
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
      },
      {
        hostname: 'flagpedia.net',
      },
    ],
  },
}

module.exports = nextConfig
