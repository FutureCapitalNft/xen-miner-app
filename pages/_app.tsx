import '@/styles/globals.css'

import '@rainbow-me/rainbowkit/styles.css';

import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet
} from '@rainbow-me/rainbowkit/wallets';
import {
  mainnet,
} from 'wagmi/chains';

import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

import {FlexibleThemeProvider} from "@/contexts/Theme";
import getConfig from "next/config";
import {Chain} from "@wagmi/core";
import Layout from "@/layouts/Layout";
import {Web3Provider} from "@/contexts/Web3";
import {XenCryptoProvider} from "@/contexts/XenCrypto";
import {useEffect, useState} from "react";

const { publicRuntimeConfig } = getConfig();

const projectId = publicRuntimeConfig?.walletConnectProjectId;
const mainnetRpcUrl = publicRuntimeConfig?.mainnetRpcUrl || 'https://ethereum-mainnet.infrafc.org';
const mainnetWsUrl = publicRuntimeConfig?.mainnetWsUrl || 'wss://ethereum-mainnet.infrafc.org';
const chains = [ mainnet ];
const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      injectedWallet({ chains }),
      metaMaskWallet({ projectId, chains }),
      rainbowWallet({ projectId, chains }),
      walletConnectWallet({ projectId, chains }),
      coinbaseWallet({ appName: 'Xen Network', chains })
    ]
  }
]);

const getRPCs = (chain: Chain) => ({
  http: chain.id === 1 && mainnetRpcUrl ,
  webSocket: chain.id === 1 && mainnetWsUrl
});

const { publicClient, webSocketPublicClient } = configureChains(chains, [
  // w3mProvider({ projectId }),
  // infuraProvider({ apiKey: publicRuntimeConfig.infuraId }),
  jsonRpcProvider({
    rpc: getRPCs
  })
]);

const wagmiConfig = createConfig({
  autoConnect: true,
  persister: null,
  connectors: [
    ...connectors()
  ],
  publicClient,
  webSocketPublicClient
});

const XenGptApp = ({ Component, pageProps }: any) => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(true);
  }, []);
  return loaded ? (<FlexibleThemeProvider>
      <WagmiConfig config={wagmiConfig}>
        <Web3Provider chains={chains}>
          <XenCryptoProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </XenCryptoProvider>
        </Web3Provider>
      </WagmiConfig>
    </FlexibleThemeProvider>) : null;
};

export default XenGptApp;

