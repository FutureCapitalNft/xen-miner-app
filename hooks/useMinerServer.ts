import {useEffect, useState} from "react";
import getConfig from "next/config";

const {publicRuntimeConfig: config} = getConfig();

export const useMinerServer = () => {
    const [difficulty, setDifficulty] = useState(1);

    const getDifficulty = async () => {
        fetch(`${config.xenMinerServer}/difficulty`, {
            mode: 'cors'
        })
            .then((res) => res.json())
            .then(({difficulty}) => setDifficulty(Number(difficulty)))
            //.catch(_ => setDifficulty(1))
    }

    useEffect(() => {
        getDifficulty().then(_ => {});
    }, [difficulty]);

    const postBlock = async (block: {
        hash_to_verify: string,
        key: string,
        account: string,
        attempts: number,
        hashes_per_second: number
    }) => {
        const resp = await fetch(`${config.xenMinerServer}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(block)
        });
        return await resp.json();
    }

    return {
        difficulty,
        getDifficulty,
        postBlock
    }
}