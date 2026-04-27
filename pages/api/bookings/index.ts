import type { NextApiRequest, NextApiResponse } from 'next'
import { BOOKINGS } from '@/lib/mockData'
import { Booking } from '@/types'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Booking[]>
) {
  // Simulate network delay
  await delay(300)
  res.status(200).json(BOOKINGS)
}
