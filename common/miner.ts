import crypto from 'crypto';
import argon2, {Argon2BrowserHashOptions, ArgonType} from 'argon2-browser';

export const Block = ({
    index = 0,
    prevHash = '',
    data = '',
    validHash = '',
    randomData = '',
    attempts = 0,
    timestamp = Date.now()
} = {}) => ({
    index,
    prevHash,
    data,
    validHash,
    randomData,
    attempts,
    timestamp,
    getBlockHash: async () => {
        if (typeof window === 'undefined') return '';

        const sha256: crypto.Hash = crypto.createHash('sha256');
        sha256.update(`${index}${prevHash}${data}${validHash}${randomData}${attempts}${timestamp}`, 'utf-8');
        return sha256.digest('hex');
    },
})

export const genesisBlock = Block({ index: 0, prevHash: '0', data: 'Genesis Block', validHash: '0', randomData: '0' });

const randomInt = (min: number, max: number) => {
    if (typeof self === 'undefined') return 0;

    return self.crypto.getRandomValues(new Uint32Array(1))[0];
}

const generateRandomSHA256 = (maxLength: number = 128): string => {
    if (typeof window === 'undefined') return '';

    const characters: string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
    let randomString: string = '';

    for (let i = 0; i < randomInt(1, maxLength + 1); i++) {
        const randomIndex: number = randomInt(0, characters.length);
        randomString += characters.charAt(randomIndex);
    }

    const sha256: crypto.Hash = crypto.createHash('sha256');
    sha256.update(randomString, 'utf-8');

    return sha256.digest('hex');
}

async function hashWithArgon2(data: string, length: number): Promise<string> {
    const difficulty = 1;
    const memoryCost = 8;
    const cores = 1;

    const hashOptions: Argon2BrowserHashOptions = {
        pass: data,
        salt: 'XEN10082022XEN',
        type: ArgonType.Argon2id,
        time: difficulty, // Adjust these parameters as needed
        mem: memoryCost, // Adjust these parameters as needed
        parallelism: cores, // Adjust these parameters as needed
        hashLen: length,
    };

    return await argon2.hash(hashOptions)
        .then(_ => _.toString());
}

export const mineBlock = async (targetSubstring: string, prevHash: string): Promise<any> => {
    const maxLength = 128;
    let attempts = 0;
    while (true) {
        attempts++;
        console.log(`attempt: ${attempts}`)
        const randomData: string = generateRandomSHA256();
        const hashedData: string = await hashWithArgon2(randomData + prevHash, maxLength);

        if (hashedData.slice(-87).includes(targetSubstring)) {
            console.log(`Found valid hash after ${attempts} attempts: ${hashedData}`);
            break;
        }
    }

}