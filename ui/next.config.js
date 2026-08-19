/**
 * @type {import('next').NextConfig}
 */
const apiBaseUrl = new URL(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api')

// Next's traced server output is what keeps the container image small, but it
// is only meaningful when self-hosting: Vercel builds from source with its own
// output format and fails when the standalone setting is present. The container
// build opts in, everything else builds normally.
const standalone = process.env.NEXT_OUTPUT_STANDALONE === 'true'

const nextConfig = {
  ...(standalone ? { output: 'standalone' } : {}),
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
