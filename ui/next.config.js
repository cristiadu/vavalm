/**
 * @type {import('next').NextConfig}
 */
const apiBaseUrl = new URL(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api')

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tecdn.b-cdn.net',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'flagpedia.net',
      },
      {
        protocol: 'https',
        hostname: 'flags.restcountries.com',
      },
      {
        protocol: apiBaseUrl.protocol.replace(':', ''),
        hostname: apiBaseUrl.hostname,
        port: apiBaseUrl.port,
        pathname: '/api/**',
      },
    ],
  },
}

export default nextConfig
