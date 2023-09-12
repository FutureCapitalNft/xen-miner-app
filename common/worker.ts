import {mineBlock} from "@/common/miner";

onmessage = (e) => {
    console.log('Message received from main script', e.data);
    mineBlock(e.data.targetSubstr, e.data.hash)
        .then(result => {
            const workerResult = 'Result: ' + (result);
            console.log('Posting message back to main script', workerResult);
            postMessage({ data: workerResult });
        })
}