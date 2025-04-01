/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export', // Enables static export
    images: {
      unoptimized: true, // Ensures compatibility with static hosting
    },
    // Optional: Add trailing slashes if needed
    // trailingSlash: true,
  };
  
  module.exports = nextConfig;
  