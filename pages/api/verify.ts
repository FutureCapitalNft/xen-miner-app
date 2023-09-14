// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import getConfig from "next/config";

const {publicRuntimeConfig: config} = getConfig();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const { hash_to_verify, key, account, attempts, hashes_per_second } = req.body;
  const resp = await fetch(`${config.xenMinerServer}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hash_to_verify, key, account, attempts, hashes_per_second })
  });
  if (resp.ok) {
    res.status(200).json(await resp.json());
  } else {
    res.status(500).json(await resp.json());
  }

}
