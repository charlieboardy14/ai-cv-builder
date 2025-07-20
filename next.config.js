/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins.push(
        new (require('webpack').IgnorePlugin)({
          resourceRegExp: /\/(test|tests)\/data\//,
          contextRegExp: /pdf-parse|mammoth/,
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;
