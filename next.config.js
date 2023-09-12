const xenCryptoABI = require('@faircrypto/xen-crypto/build/contracts/XENCrypto.json').abi;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    walletConnectProjectId: process.env.WALLETCONNECT_KEY,
    walletConnectVersion: process.env.WALLETCONNECT_VERSION,
    xenCryptoAddress: process.env.XEN_CRYPTO_ADDRESS,
    xenCryptoABI: xenCryptoABI,
    minBalance: process.env.MIN_BALANCE,
    mainnetRpcUrl: undefined,
    mainnetWsUrl: undefined,
    xenMinerServer: process.env.XEN_MINER_SERVER,
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.module.rules.push({
      test: /\.wasm$/,
      loader: "base64-loader",
      type: "javascript/auto",
    });

    config.module.noParse = /\.wasm$/;

    config.module.rules.forEach((rule) => {
      (rule.oneOf || []).forEach((oneOf) => {
        if (oneOf.loader && oneOf.loader.indexOf("file-loader") >= 0) {
          oneOf.exclude.push(/\.wasm$/);
        }
      });
    });

    if (!isServer) {
      config.resolve.fallback.fs = false;
      config.resolve.fallback.crypto = false;
    }

    // Perform customizations to webpack config
    config.plugins.push(
        new webpack.IgnorePlugin({ resourceRegExp: /\/__tests__\// })
    );

    // Important: return the modified config
    return config;
  },

}

module.exports = nextConfig
