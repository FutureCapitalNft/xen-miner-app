import {useEffect, useState} from "react";

export const useMinerServer = () => {
    const [difficulty, setDifficulty] = useState(8);

    const getDifficulty = async () => {
        fetch(`/api/difficulty`, {
            cache: 'no-store',
            // mode: 'cors'
        })
            .then((res) => res.json())
            .then(({difficulty}) => setDifficulty(Number(difficulty)))
            .catch(_ => setDifficulty(8))
    }

    useEffect(() => {
        getDifficulty().then(_ => {});
    }, []);

    const postBlock = async (block: {
        hash_to_verify: string,
        key: string,
        account: string,
        attempts: number,
        hashes_per_second: number
    }) => {
        const resp = await fetch(`/api/verify`, {
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