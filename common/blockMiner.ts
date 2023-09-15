import {generateRandomSHA256, hashWithArgon2} from "@/common/miner";
import EventEmitter from "events";

export class BlockMiner extends EventEmitter {
    static instance: BlockMiner;
    static #options: any = { memoryCost: 8, difficulty: 1, cores: 1 };

    id: number;
    #operate = false;
    #maxLength = 64;
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
        BlockMiner.#options = {
            ...BlockMiner.#options,
            ...options
        };
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
                    }
                })
        }
    }

    stop() {
        this.#operate = false
        console.log('stop BlockMiner', this.id);
    }

    static update(options: any) {
        console.log('update BlockMiners', BlockMiner.#options);
        BlockMiner.#options = {
            ...BlockMiner.#options,
            ...options
        };
        console.log('updated BlockMiners', BlockMiner.#options);
    }
}