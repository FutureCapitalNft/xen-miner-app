import {generateRandomSHA256, hashWithArgon2} from "@/common/miner";
import EventEmitter from "events";

let miner: BlockMiner | null = null;

class BlockMiner extends EventEmitter {
    static instance: BlockMiner;

    #operate = false;
    #maxLength = 128;
    #targetSubstring: string;
    #prevHash: string;
    attempts = 0;

    static getInstance(targetSubstring: string, prevHash: string) {
        if (!BlockMiner.instance) {
            console.log('create new BlockMiner');
            BlockMiner.instance = new BlockMiner(targetSubstring, prevHash);
        }
        return BlockMiner.instance;
    }

    constructor(targetSubstring: string, prevHash: string) {
        super();
        this.#targetSubstring = targetSubstring;
        this.#prevHash = prevHash;
    }

    async mine() {
        this.#operate = true;
        while (this.#operate) {
            this.attempts++;
            if (this.attempts % 1_000 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
                this.emit('progress', this.attempts);
            }
            const randomData: string = generateRandomSHA256();
            await hashWithArgon2(randomData + this.#prevHash, this.#maxLength)
                .then((hashedData: string) => {
                    if ((hashedData.slice(-87) || '').includes(this.#targetSubstring)) {
                        console.log(`Found valid hash after ${this.attempts} attempts: ${hashedData}`);
                        this.emit('block', hashedData);
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
    console.log('Message received from main script', e.data.cmd);

    if (e.data.cmd === 'start') {
        miner = BlockMiner.getInstance(e.data.targetSubstr, e.data.hash);
        miner.addListener('block', (result: any) => {
            console.log('Found block', result);
            postMessage({result, type: 'block'});
        });
        miner.addListener(
            'progress',
            (attempt) => postMessage({attempt, type: 'progress'})
        )
        miner.mine();
    } else if (e.data.cmd === 'stop') {
        console.log('stop miner')
        miner?.stop();
    }
}
