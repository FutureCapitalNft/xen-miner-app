import styles from '../styles/Home.module.css';

import React, {useContext, useEffect, useRef, useState} from "react";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Container, IconButton,
    ListItem, ListItemText,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import getConfig from "next/config";
import {XenCryptoContext} from "@/contexts/XenCrypto";
import {genesisBlock} from "@/common/miner";
import {useMinerServer} from "@/hooks/useMinerServer";
import {useAccount} from "wagmi";
import {isAddress} from 'viem'
import {BlockMiner} from "@/common/blockMiner";

import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import CheckOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

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

const workerState = {running: false, hash: '', attempt: 0, blocks: [], hashRate: 0};

export default function Home() {
    const workerRef = useRef<Worker[]>([]);
    const {address} = useAccount();
    // const {isLarge} = useContext(ThemeContext);
    const {balance} = useContext(XenCryptoContext);
    const {difficulty: memory, getDifficulty, postBlock} = useMinerServer();

    const [addressOverride, setAddressOverride] = useState<string | undefined>(address);
    const [targetSubstr, setTargetSubstr] = useState<string>('XEN11');
    const [targetSubstr1, setTargetSubstr1] = useState<string>('XUNI[0-9]');
    const [difficulty, setDifficulty] = useState<number>(1);
    const [threads, setThreads] = useState<number>(0);
    const [state, setState] = useState<WorkerState[]>([]);
    // const [blocks, setBlocks] = useState<string[]>([]);

    const minBalance = BigInt(config.minBalance || 0) * weiInEth;
    const hasEnough = balance >= minBalance;
    // console.log(balance, difficulty);

    useEffect(() => {
        setThreads(window.navigator.hardwareConcurrency || 1);
        // getDifficulty().then();
    }, []);

    useEffect(() => {
        const timeout = setInterval(() => getDifficulty(), 30_000);
        return () => clearInterval(timeout);
    }, []);

    useEffect(() => {
        if (threads > 0) {
            setState(Array(threads).fill(workerState) as WorkerState[]);
        }
    }, [threads]);

    const onAddressOverrideChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAddressOverride(e.target.value);
    }

    const onTargetSubstrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTargetSubstr(e.target.value);
    }

    const onTargetSubstr1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTargetSubstr1(e.target.value);
    }

    const onDifficultyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDifficulty(parseInt(e.target.value || '0'));
    }

    const onMemoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // setMemory(parseInt(e.target.value || '8'));
    }

    const onThreadsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setThreads(parseInt(e.target.value || '0'));
    }

    const resetDefaults = () => {
        setTargetSubstr('XEN11');
        setTargetSubstr1('XUNI[0-9]');
        setAddressOverride(address);
        getDifficulty().then(_ => {});
        setDifficulty(1);
        setThreads(window?.navigator?.hardwareConcurrency || 1);
    }

    const onMessage = (e: MessageEvent) => {
        const idx = e.data.idx;
        switch (e.data.type) {
            case 'block':
                postBlock({
                    hash_to_verify: e.data.result.hashedData,
                    key: e.data.result.key,
                    account: (addressOverride || address) as string,
                    attempts: e.data.result.attempts,
                    hashes_per_second: state[idx].hashRate,
                }).then(_ => {
                    console.log(_);
                    setState(ww => [
                        ...ww.slice(0, idx),
                        {
                            ...ww[idx],
                            blocks: [...ww[idx].blocks, e.data.result.hashedData]
                        },
                        ...ww.slice(idx + 1)
                    ])
                });
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

    const terminateWorker = (i: number) => {
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
    }

    const startWorker = (i: number) => {
        console.log('start', i, workerRef.current[i])
        workerRef.current[i] = new Worker(new URL('../common/worker.ts', import.meta.url));
        workerRef.current[i].onmessage = onMessage;
        workerRef.current[i].onerror = (e) => console.log(e);
        workerRef.current[i].onmessageerror = (e) => console.log(e);
        workerRef.current[i].postMessage({
            cmd: 'start',
            idx: i,
            targetSubstr,
            targetSubstr1,
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
    }

    const onButtonClick = (i: number) => () => {
        if (state[i].running && workerRef.current[i]) {
            terminateWorker(i);
        } else if (!state[i].running) {
            startWorker(i);
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
                if (!state[idx]?.running) {
                    // initial setup
                    const w = new Worker(new URL('../common/worker.ts', import.meta.url));
                    w.onmessage = onMessage;
                    w.onerror = (e) => console.log(e);
                    w.onmessageerror = (e) => console.log(e);
                    workerRef.current.push(w);
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

    useEffect(() => {
        BlockMiner.update({memoryCost: memory});
        for (let idx = 0; idx < threads; idx++) {
            if (state[idx]?.running) {
                terminateWorker(idx);
                startWorker(idx);
            }
        }
    }, [memory]);

    const opts = {maximumFractionDigits: 2};

    return (
        <Container sx={{minHeight: '92vh ', display: 'flex'}}
                   className={styles.container}>
            <Stack direction="column" width="100%">
            <Accordion elevation={0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography>Settings</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <ListItem>
                        <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}>
                            <Typography>Address Override</Typography>
                            {isAddress(addressOverride || '')
                                ? <CheckOutlineIcon color="success"/>
                                : <ErrorOutlineIcon color="warning"/>
                            }
                            <TextField
                                size="small"
                                sx={{ '& input': { md: { width: '475px'} } }}
                                value={addressOverride}
                                onChange={onAddressOverrideChange}
                            />
                        </Stack>
                    </ListItem>
                    <ListItem>
                        <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}>
                            <Typography>Search For</Typography>
                            <TextField
                                size="small"
                                value={targetSubstr}
                                onChange={onTargetSubstrChange}
                            />
                        </Stack>
                    </ListItem>
                    <ListItem>
                        <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}>
                            <Typography>Search For</Typography>
                            <TextField
                                size="small"
                                value={targetSubstr1}
                                onChange={onTargetSubstr1Change}
                            />
                        </Stack>
                    </ListItem>
                    <ListItem>
                        <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}>
                            <Typography>Difficulty</Typography>
                            <TextField
                                size="small"
                                value={difficulty}
                                onChange={onDifficultyChange}
                            />
                        </Stack>
                    </ListItem>
                    <ListItem>
                        <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}>
                            <Typography>Memory</Typography>
                            <TextField
                                size="small"
                                disabled
                                value={memory}
                                onChange={onMemoryChange}
                            />
                        </Stack>
                    </ListItem>
                    <ListItem>
                        <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}>
                            <Typography>Max Workers</Typography>
                            <TextField
                                size="small"
                                value={threads}
                                onChange={onThreadsChange}
                            />
                        </Stack>
                    </ListItem>
                    <ListItem>
                        <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}>
                            <Button onClick={resetDefaults}>Reset Defaults</Button>
                        </Stack>
                    </ListItem>
                </AccordionDetails>
            </Accordion>
            <Accordion elevation={0} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography>
                        Workers ({state.filter(w => w.running).length}/{threads})
                    </Typography>
                </AccordionSummary>
                <AccordionDetails >
                    {workerRef.current.map((w, i) => <ListItem key={i}>
                        <Stack direction="row" sx={{alignItems: 'center '}}>
                            <IconButton onClick={onButtonClick(i)}>
                                {state[i]?.running ? <StopCircleIcon/> : <PlayCircleIcon/>}
                            </IconButton>
                            <Box sx={{px: 1}}>
                                Blocks found {state[i]?.blocks?.length}
                            </Box>
                            <Box sx={{px: 1}}>
                                Attempts {state[i]?.attempt?.toLocaleString()}
                            </Box>
                            <Box sx={{px: 1}}>
                                {state[i]?.hashRate?.toLocaleString([], opts)} H/s
                            </Box>
                        </Stack>
                    </ListItem>)}
                </AccordionDetails>
            </Accordion>
                <Accordion elevation={0} defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                        <Typography>
                            Blocks ({state.map((ws) => ws?.blocks).flat().length})
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {state.map((ws, i) => ws?.blocks).flat()
                            .map((b, i) => <ListItem key={i}>
                                <ListItemText
                                    primary={b}
                                    primaryTypographyProps={{
                                        style: { textOverflow: "ellipsis", overflow: 'hidden' }
                                    }} />
                            </ListItem>)
                    }</AccordionDetails>
                </Accordion>
            </Stack>
            {/*!address && <Stack
                direction="column"
                flexGrow="1"
                sx={{ alignItems: 'center', justifyContent: 'center' }}>
                <Typography>Connect your wallet to start mining</Typography>
            </Stack>*/}
        </Container>
    )
}
