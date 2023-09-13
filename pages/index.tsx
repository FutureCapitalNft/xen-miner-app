import React, {useContext, useEffect, useRef, useState} from "react";
import SendIcon from '@mui/icons-material/Send';

import {
  Avatar,
  Box, Button,
  Container, Grid, IconButton, List, ListItem, ListItemAvatar, ListItemSecondaryAction, ListItemText, Stack, TextField,
} from '@mui/material';
import {ThemeContext} from "@/contexts/Theme";
import getConfig from "next/config";
import {XenCryptoContext} from "@/contexts/XenCrypto";
import {genesisBlock} from "@/common/miner";
import {afterWrite} from "@popperjs/core";


const {publicRuntimeConfig: config} = getConfig();
const weiInEth = BigInt('1000000000000000000');
const targetSubstr: string = "XEN11"
// const numBlocksToMine = 20000000;

export default function Home() {
  const workerRef = useRef<Worker>();
  const {isLarge} = useContext(ThemeContext);
  const {balance} = useContext(XenCryptoContext);
  const [running, setRunning] = useState(false);
  const [hash, setHash] = useState<string>();
  const [blocks, setBlocks] = useState<any[]>([]);
  const [attempt, setAttempt] = useState(0);

  const minBalance = BigInt(config.minBalance || 0) * weiInEth;
  const hasEnough = balance >= minBalance;
  console.log(balance, hasEnough);

  const onMessage = (e: MessageEvent) => {
    switch (e.data.type) {
      case 'block':
        setBlocks(bb => [...bb, e.data.result]);
        break;
      case 'progress':
        setAttempt(e.data.attempt);
        break;
    }
  }

  const onButtonClick = () => {
    if (running && workerRef.current) {
      console.log('stop', workerRef.current)
      workerRef.current?.terminate(); // postMessage({ cmd: 'stop' });
      workerRef.current = undefined;
      setRunning(false);
    } else if (workerRef.current) {
      console.log('start', workerRef.current)
      workerRef.current.postMessage({ cmd: 'start', targetSubstr, hash })
      setRunning(true);
    } else {
      console.log('worker not ready');
    }
  }

  useEffect(() => {
    if (!workerRef.current && !running) {
      // initial setup
      workerRef.current = new Worker(new URL('../common/worker.ts', import.meta.url));
      console.log('new worker');
      workerRef.current.onmessage = onMessage;
      workerRef.current.onerror = (e) => console.log(e);
      workerRef.current.onmessageerror = (e) => console.log(e);
      console.log(workerRef.current);
      if (!hash) {
        genesisBlock.getBlockHash()
            .then(setHash);
      }
    }
  }, [running, hash]);

  const disabled = !workerRef.current || !hash;
  console.log(!workerRef.current, !hash, disabled);

  return (
    <Container>
      <Stack spacing={2} direction="column">
        <Button onClick={onButtonClick}>
          {running ? 'Stop' : 'Start'}
        </Button>
        <Box>Attempts: {attempt.toLocaleString()}</Box>
        {/*<List>{blocks.map((b, i) => <ListItem key={i}>
          <ListItemText primaryTypographyProps={{ sx: { textOverflow: 'clip' } }}
                        primary={b} />
          <ListItemSecondaryAction />
        </ListItem>)}</List>*/}
        <Box >Blocks found: {blocks.length}</Box>
      </Stack>
    </Container>
  )
}
