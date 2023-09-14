import {generateRandomSHA256, hashWithArgon2} from "@/common/miner";
import EventEmitter from "events";

class BlockMiner extends EventEmitter {
    static instance: BlockMiner;
    static #options: any;

    id: number;
    #operate = false;
    #maxLength = 128;
    readonly #targetSubstring: string;
    #prevHash: string;
    attempts = 0;

    static getInstance(targetSubstring: string, prevHash: string) {
        if (!BlockMiner.instance) {
            BlockMiner.instance = new BlockMiner(-1, targetSubstring, prevHash);
        }
        return BlockMiner.instance;
    }

    constructor(id: number,
                targetSubstring: string,
                prevHash: string,
                options: any = { memoryCost: 8, difficulty: 1, cores: 1 }
    ) {
        super();
        BlockMiner.#options = options;
        console.log('create new BlockMiner', id);
        this.id = id;
        this.#targetSubstring = targetSubstring;
        this.#prevHash = prevHash;
    }

    async mine() {
        this.#operate = true;
        let t0 = performance.now();
        let o0 = this.attempts;
        while (this.#operate) {
            this.attempts++;
            if (this.attempts % 100 === 0) {
                // await new Promise(resolve => setTimeout(resolve, 0));
                queueMicrotask(() => this.emit('progress', this.attempts));
                const hashRate = (this.attempts - o0) * 1_000 / (performance.now() - t0);
                queueMicrotask(() => this.emit('hashRate', hashRate));
                t0 = performance.now();
                o0 = this.attempts;
            }
            const randomData: string = generateRandomSHA256();
            await hashWithArgon2(BlockMiner.#options)(randomData + this.#prevHash, this.#maxLength)
                .then((hashedData: string) => {
                    if ((hashedData.slice(-87) || '').includes(this.#targetSubstring)) {
                        queueMicrotask(() => {
                            this.emit('block', {
                                hashedData,
                                attempts: this.attempts,
                                key: randomData + this.#prevHash,
                            });
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
    console.log('Message received from main script', e.data.cmd, e.data.idx, e.data.targetSubstr);
    const idx = e.data.idx;
    let miner: BlockMiner | null = null;

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
        // miner.stop();
    }
}
