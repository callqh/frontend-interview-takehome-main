import type { NextApiRequest, NextApiResponse } from 'next'
import { BOOKING_DETAILS } from '@/lib/mockData'
import { BookingDetail } from '@/types'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BookingDetail | { error: string }>
) {
  const { id } = req.query
  const detail = BOOKING_DETAILS[id as string]

  if (!detail) {
    return res.status(404).json({ error: 'Booking not found' })
  }

  // Simulate network delay
  await delay(300)
  res.status(200).json(detail)
}
