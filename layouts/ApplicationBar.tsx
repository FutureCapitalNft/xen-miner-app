import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import {
  AppBar,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip, Typography,
  useTheme
} from '@mui/material';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { watchNetwork } from '@wagmi/core';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import React, { useContext, useEffect, useState } from 'react';
import { useAccount, useNetwork } from 'wagmi';

import { ThemeContext } from '@/contexts/Theme';
import {XenCryptoContext} from "@/contexts/XenCrypto";

const { publicRuntimeConfig: config } = getConfig();

const ApplicationBar = () => {
  const theme = useTheme();
  const { mode, setMode } = useContext(ThemeContext);
  const { chain } = useNetwork();
  // const { address } = useAccount();
  const { balance } = useContext(XenCryptoContext);

  const weiInEth = BigInt('1000000000000000000');

  const minBalance = BigInt(config.minBalance || 0) * weiInEth;
  const hasEnough = balance >= minBalance;

  const toggleTheme = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', mode === 'dark' ? 'light' : 'dark');
    }
  };

  return (
    <Box
      sx={{ flexGrow: 1 }}>
      <AppBar
        position="fixed"
        elevation={0}>
        <Toolbar sx={{}}>
          {/* false && <XENIconButton networkId={networkId} mode={mode} /> */}
          <Typography
            component="div"
            fontWeight="bold"
            sx={{ flexGrow: 1 }}>
            XenMiner v0.0000001
          </Typography>
          <Tooltip
            title="Toggle light/dark mode">
            <IconButton
              sx={{ ml: 1 }}
              onClick={toggleTheme}
              color="inherit">
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon sx={{ color: 'black' }} />}
            </IconButton>
          </Tooltip>
          {!chain?.unsupported && <Box
              sx={{
                mx: 2,
                color: theme.palette.text.primary,
                display: { xs: 'none', xl: 'block' }
              }}
            >
              XEN: {(balance / weiInEth).toLocaleString()}
            </Box>}
          <ConnectButton />
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default ApplicationBar;
