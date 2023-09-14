import styles from '../styles/Home.module.css';

import React, {useContext, useEffect, useRef, useState} from "react";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {ThemeContext} from "@/contexts/Theme";
import getConfig from "next/config";
import {XenCryptoContext} from "@/contexts/XenCrypto";
import {genesisBlock} from "@/common/miner";


const {publicRuntimeConfig: config} = getConfig();
const weiInEth = BigInt('1000000000000000000');
// const numBlocksToMine = 20000000;

type WorkerState = {
  running: boolean;
  hash: string;
  attempt: number;
  blocks: any[];
  hashRate: number;
}

const workerState = { running: false, hash: '', attempt: 0, blocks: [], hashRate: 0 };

export default function Home() {
  const workerRef = useRef<Worker[]>([]);
  const {isLarge} = useContext(ThemeContext);
  const {balance} = useContext(XenCryptoContext);

  const [targetSubstr, setTargetSubstr] = useState<string>('XEN11');
  const [difficulty, setDifficulty] = useState<number>(1);
  const [memory, setMemory] = useState<number>(8);
  const [threads, setThreads] = useState<number>(0);

  const [state, setState] = useState<WorkerState[]>([]);

  const minBalance = BigInt(config.minBalance || 0) * weiInEth;
  const hasEnough = balance >= minBalance;
  // console.log(balance, hasEnough);

  useEffect(() => {
    setThreads(window.navigator.hardwareConcurrency || 1);
  }, []);

  useEffect(() => {
    if (threads > 0) {
      setState(Array(threads).fill(workerState) as WorkerState[]);
    }
  }, [threads]);

  const onTargetSubstrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetSubstr(e.target.value);
  }

  const onDifficultyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDifficulty(parseInt(e.target.value || '0'));
  }

  const onMemoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMemory(parseInt(e.target.value || '0'));
  }

  const onThreadsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setThreads(parseInt(e.target.value || '0'));
  }

  const resetDefaults = () => {
    setTargetSubstr('XEN11');
    setDifficulty(1);
    setMemory(8);
    setThreads(window?.navigator?.hardwareConcurrency || 1);
  }

  const onMessage = (e: MessageEvent) => {
    const idx = e.data.idx;
    switch (e.data.type) {
      case 'block':
        setState(ww => [
            ...ww.slice(0, idx),
            {
              ...ww[idx],
              blocks: [...ww[idx].blocks, e.data.block]
            },
            ...ww.slice(idx + 1)
        ]);
        break;
      case 'progress':
        setState(ww => [
          ...ww.slice(0, idx),
          {
            ...ww[idx],
            attempt: e.data.attempt
          },
          ...ww.slice(idx + 1)
        ]);
        break;
      case 'hashRate':
        setState(ww => [
          ...ww.slice(0, idx),
          {
            ...ww[idx],
            hashRate: e.data.hashRate
          },
          ...ww.slice(idx + 1)
        ]);
        break;
    }
  }

  const onButtonClick = (i: number) => () => {
    if (state[i].running && workerRef.current[i]) {
      console.log('stop', i, workerRef.current[i])
      workerRef.current[i].terminate(); // postMessage({ cmd: 'stop' });
      workerRef.current[i] = undefined as any;
      setState(ww => [
        ...ww.slice(0, i),
        {
          ...ww[i],
          running: false
        },
        ...ww.slice(i + 1)
      ]);
    } else if (!state[i].running) {
      console.log('start', i,  workerRef.current[i])
      workerRef.current[i] = new Worker(new URL('../common/worker.ts', import.meta.url));
      workerRef.current[i].onmessage = onMessage;
      workerRef.current[i].onerror = (e) => console.log(e);
      workerRef.current[i].onmessageerror = (e) => console.log(e);
      workerRef.current[i].postMessage({
        cmd: 'start',
        idx: i,
        targetSubstr,
        hash: state[i].hash,
        options: {
          difficulty,
          memoryCost: memory,
          threads
        }
      })
      setState(ww => [
        ...ww.slice(0, i),
        {
          ...ww[i],
          running: true
        },
        ...ww.slice(i + 1)
      ]);
    } else {
      console.log('worker not ready');
    }
  }

  useEffect(() => {
    if (workerRef.current.length > 0) {
      while (workerRef.current.length > 0) {
        const w = workerRef.current.pop();
        w?.terminate();
      }
    }

    if (workerRef.current.length === 0) {
      for (let idx = 0; idx < threads; idx++) {
        // console.log(idx);
        if (!state[idx]?.running) {
          // initial setup
          const w = new Worker(new URL('../common/worker.ts', import.meta.url));
          // console.log('new worker');
          w.onmessage = onMessage;
          w.onerror = (e) => console.log(e);
          w.onmessageerror = (e) => console.log(e);
          workerRef.current.push(w);
          // console.log(workerRef.current);
          if (!state[idx]?.hash) {
            genesisBlock.getBlockHash()
                .then(hash => {
                  setState(ww => [
                    ...ww.slice(0, idx),
                    {
                      ...ww[idx],
                      hash
                    },
                    ...ww.slice(idx + 1)
                  ]);
                })
          }
        }
      }
    }

  }, [threads]);

  // console.log(workerRef.current);
  // console.log(state);
  const opts = { maximumFractionDigits: 2 };

  return (
    <Container sx={{ minHeight: '90vh '}} className={styles.container}>
      <Accordion elevation={0}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ListItem>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography>Search For</Typography>
              <TextField
                  size="small"
                  value={targetSubstr}
                  onChange={onTargetSubstrChange}
              />
            </Stack>
          </ListItem>
          <ListItem>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography>Difficulty</Typography>
              <TextField
                  size="small"
                  value={difficulty}
                  onChange={onDifficultyChange}
              />
            </Stack>
          </ListItem>
          <ListItem>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography>Memory</Typography>
              <TextField
                  size="small"
                  value={memory}
                  onChange={onMemoryChange}
              />
            </Stack>
          </ListItem>
          <ListItem>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography>Threads</Typography>
            <TextField
                size="small"
                value={threads}
                onChange={onThreadsChange}
            />
          </Stack>
          </ListItem>
          <ListItem>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Button onClick={resetDefaults}>Reset Defaults</Button>
            </Stack>
          </ListItem>
        </AccordionDetails>
      </Accordion>
      <List sx={{ backgroundColor: 'transparent' }}>
        {workerRef.current.map((w, i) => <ListItem key={i}>
        <ListItemText primary={<Stack direction="row" sx={{ alignItems: 'center '}}>
                        <Button onClick={onButtonClick(i)}>
                          {state[i]?.running ? 'Stop' : 'Start'}
                        </Button>
                        <Box sx={{ px: 1 }}>
                          Attempts {state[i]?.attempt?.toLocaleString()}
                        </Box>
                        <Box sx={{ px: 1 }}>
                          Blocks found {state[i]?.blocks?.length}
                        </Box>
                        <Box sx={{ px: 1 }}>
                          HashRate {state[i]?.hashRate?.toLocaleString([], opts )}
                        </Box>
                      </Stack>} />
        <ListItemSecondaryAction />
      </ListItem>)}
      </List>
    </Container>
  )
}
