// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import getConfig from "next/config";

const {publicRuntimeConfig: config} = getConfig();

type Data = {
  difficulty: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const resp = await fetch(`${config.xenMinerServer}/difficulty`, {}  as any);
  if (resp.ok) {
    const {difficulty} = await resp.json();
    res.status(200).json({difficulty});
  } else {
    res.status(500).json({ difficulty: '8' });
  }
}
