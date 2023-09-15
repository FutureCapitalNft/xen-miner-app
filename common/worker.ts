import {BlockMiner} from "@/common/blockMiner";

let miner: BlockMiner | null = null;

onmessage = (e) => {
    console.log('Message received from main script', e.data.cmd, e.data.idx, e.data.targetSubstr);
    const idx = e.data.idx;

    if (e.data.cmd === 'start') {
        miner = new BlockMiner(e.data.idx, e.data.targetSubstr, e.data.hash, e.data.options);
        miner.addListener('block', (result: any) => {
            console.log('Found block', result);
            postMessage({result, type: 'block', idx });
        });
        miner.addListener(
            'progress',
            (attempt) => postMessage({attempt, type: 'progress', idx})
        )
        miner.addListener(
            'hashRate',
            (hashRate) => postMessage({hashRate, type: 'hashRate', idx})
        )
        miner.mine().then(() => {});
    } else if (e.data.cmd === 'stop') {
        console.log('stop miner')
        miner?.stop();
    } else if (e.data.cmd === 'update') {
        console.log('stop miner')
        miner?.stop();
        miner = new BlockMiner(e.data.idx, e.data.targetSubstr, e.data.hash, e.data.options);
        miner.addListener('block', (result: any) => {
            console.log('Found block', result);
            postMessage({result, type: 'block', idx });
        });
        miner.addListener(
            'progress',
            (attempt) => postMessage({attempt, type: 'progress', idx})
        )
        miner.addListener(
            'hashRate',
            (hashRate) => postMessage({hashRate, type: 'hashRate', idx})
        )
        miner.mine().then(() => {});
    }
}
