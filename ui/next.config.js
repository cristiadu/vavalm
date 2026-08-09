/**
 * @type {import('next').NextConfig}
 */
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
    ],
  },
}

export default nextConfig
