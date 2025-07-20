/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push(
        // Exclude test data from pdf-parse and similar libraries
        '^(pdf-parse|mammoth)\/test\/data\/.*'
      );
    }
    return config;
  },
};

module.exports = nextConfig;
