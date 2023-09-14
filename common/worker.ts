import {generateRandomSHA256, hashWithArgon2} from "@/common/miner";
import EventEmitter from "events";

class BlockMiner extends EventEmitter {
    static instance: BlockMiner;

    id: number;
    #operate = false;
    #maxLength = 128;
    #targetSubstring: string;
    #prevHash: string;
    attempts = 0;

    static getInstance(targetSubstring: string, prevHash: string) {
        if (!BlockMiner.instance) {
            BlockMiner.instance = new BlockMiner(-1, targetSubstring, prevHash);
        }
        return BlockMiner.instance;
    }

    constructor(id: number, targetSubstring: string, prevHash: string) {
        super();
        console.log('create new BlockMiner', id);
        this.id = id;
        this.#targetSubstring = targetSubstring;
        this.#prevHash = prevHash;
    }

    async mine() {
        this.#operate = true;
        while (this.#operate) {
            this.attempts++;
            if (this.attempts % 1_000 === 0) {
                // await new Promise(resolve => setTimeout(resolve, 0));
                queueMicrotask(() => this.emit('progress', this.attempts));
            }
            const randomData: string = generateRandomSHA256();
            await hashWithArgon2(randomData + this.#prevHash, this.#maxLength)
                .then((hashedData: string) => {
                    if ((hashedData.slice(-87) || '').includes(this.#targetSubstring)) {
                        queueMicrotask(() => {
                            this.emit('block', hashedData);
                            console.log(`Found valid hash after ${this.attempts} attempts: ${hashedData}`);
                        });
                        // return new Promise(resolve => setTimeout(resolve, 1))
                    }
                })
            // await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    stop() {
        this.#operate = false;
    }
}

onmessage = (e) => {
    console.log('Message received from main script', e.data.cmd, e.data.idx);
    const idx = e.data.idx;
    let miner: BlockMiner | null = null;

    if (e.data.cmd === 'start') {
        miner = new BlockMiner(e.data.idx, e.data.targetSubstr, e.data.hash);
        miner.addListener('block', (result: any) => {
            console.log('Found block', result);
            postMessage({result, type: 'block', idx });
        });
        miner.addListener(
            'progress',
            (attempt) => postMessage({attempt, type: 'progress', idx})
        )
        miner.mine().then(() => {});
    } else if (e.data.cmd === 'stop') {
        console.log('stop miner')
        // miner.stop();
    }
}
