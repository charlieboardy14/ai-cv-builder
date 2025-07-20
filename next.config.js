/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins.push(
        new (require('webpack').IgnorePlugin)({
          resourceRegExp: /\.\/test\/data\/.*\.pdf$/,
          contextRegExp: /pdf-parse|mammoth/,
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;