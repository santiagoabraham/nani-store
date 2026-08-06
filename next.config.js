/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },        // Cloudinary
      { protocol: 'https', hostname: '*.supabase.co' },             // Supabase Storage
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },
}

module.exports = nextConfig
