import { darkTheme, lightTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { createContext, useContext } from 'react';

import { ThemeContext } from '@/contexts/Theme';

export const Web3Context = createContext({});

export const Web3Provider = ({ children, chains, ...other }: any) => {
  const { mode } = useContext(ThemeContext);
  const theme =
    mode === 'dark' ? darkTheme({ overlayBlur: 'none' }) : lightTheme({ overlayBlur: 'none' });
  return (
    <Web3Context.Provider value={{}}>
      <RainbowKitProvider chains={chains} coolMode theme={theme} {...other}>
        {children}
      </RainbowKitProvider>
    </Web3Context.Provider>
  );
};
