
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['picsum.photos', 'firebasestorage.googleapis.com', 'cdn-icons-png.flaticon.com'],
  },
}

module.exports = nextConfig
