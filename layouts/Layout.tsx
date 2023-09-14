import { CssBaseline } from '@mui/material';

import ApplicationBar from './ApplicationBar';
import Head from "next/head";
import React from "react";

const project = {
  isInternal: true,
  name: 'XEN Crypto',
  copyright: 'Copyright ©',
  owner: 'Fair Crypto Foundation',
  license: 'All Rights Reserved. ',
  tokenSymbol: 'XEN',
  web: 'https://faircrypto.org',
  twitter: 'https://twitter.com/XEN_Crypto',
  telegram: 'https://t.me/XENCryptoTalk',
  youtube: 'https://m.youtube.com/channel/UCiw5nyHHt9BPHvoRbcGNehA/playlists',
  github: 'https://github.com/FairCrypto/XEN-crypto',
  discord: 'https://discord.com/invite/rcAhrKWJb6',
  reddit: 'https://www.reddit.com/r/xencrypto/',
  whitePaper: 'https://faircrypto.org/xencryptolp.pdf',
  logoUrl: '/favicon.ico',
  contracts: ['contract'],
  envPrefix: ['CONTRACT_ADDRESS'],
  termsText: '/terms'
}

const Layout = ({ children }: any) => (
  <>
    <Head>
      <title>XEN Miner</title>
      <meta name="description" content="XEN Miner" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <CssBaseline />
    <ApplicationBar />
    <main style={{ marginTop: '64px' }}>
      <section style={{ width: '100%' }}>{children}</section>
    </main>
    {/*<Footer project={project}/>*/}
  </>
);

export default Layout;
