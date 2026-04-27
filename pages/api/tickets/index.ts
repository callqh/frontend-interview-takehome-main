import type { NextApiRequest, NextApiResponse } from 'next'
import { TICKETS } from '@/lib/mockData'
import { Ticket } from '@/types'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ticket[]>
) {
  await delay(200)
  res.status(200).json(TICKETS)
}
