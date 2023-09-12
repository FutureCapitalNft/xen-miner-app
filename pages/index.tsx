import React, {useContext, useEffect, useRef, useState} from "react";
import SendIcon from '@mui/icons-material/Send';

import {
  Avatar,
  Box,
  Container, Grid, IconButton, List, ListItem, ListItemAvatar, ListItemText, Stack, TextField,
} from '@mui/material';
import {ThemeContext} from "@/contexts/Theme";
import getConfig from "next/config";
import {XenCryptoContext} from "@/contexts/XenCrypto";
import {Block, genesisBlock, mineBlock} from "@/common/miner";
import {afterWrite} from "@popperjs/core";


const {publicRuntimeConfig: config} = getConfig();
const weiInEth = BigInt('1000000000000000000');
const targetSubstr = "XEN11"
const numBlocksToMine = 20000000;

export default function Home() {
  const {isLarge} = useContext(ThemeContext);
  const {balance} = useContext(XenCryptoContext);

  const minBalance = BigInt(config.minBalance || 0) * weiInEth;
  const hasEnough = balance >= minBalance;
  console.log(balance, hasEnough);

  useEffect(() => {
    const genesis = genesisBlock;
    genesisBlock.getBlockHash()
        .then((hash) => mineBlock(targetSubstr, hash));
  }, []);

  return (
    <Container>

    </Container>
  )
}
