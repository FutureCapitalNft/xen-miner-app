import {useEffect, useState} from "react";

export const useMinerServer = () => {
    const [difficulty, setDifficulty] = useState(8);

    const getDifficulty = async () => {
        fetch(`/api/difficulty`, {
            // mode: 'cors'
        })
            .then((res) => res.json())
            .then(({difficulty}) => {
                const delta = Math.floor(Math.random() * 10)
                setDifficulty(Number(difficulty) + delta)
            })
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