import React, {
  createContext,
  useContext,
  useMemo,
  ReactNode,
} from 'react'
import useSWR from 'swr'
import { Ticket } from '@/types'
import { jsonFetcher } from '@/lib/fetcher'

// Legacy house lookup used when MessagesContext owned the selected house.
// The current Messages page uses URL ticketId as the source of truth and reads
// houseName from each ticket, so this mapping is intentionally inactive.
// interface House {
//   id: string
//   name: string
// }
//
// const HOUSES: House[] = [
//   { id: 'h1', name: 'Orchard House' },
//   { id: 'h2', name: 'Marina Suite' },
//   { id: 'h3', name: 'Sentosa Villa' },
// ]

interface MessagesContextValue {
  unreadCount: number
}

const MessagesContext = createContext<MessagesContextValue | null>(null)

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { data: tickets } = useSWR<Ticket[]>('/api/tickets', jsonFetcher)
  const unreadCount = useMemo(
    () => tickets?.filter(ticket => ticket.unread).length ?? 0,
    [tickets]
  )

  const value = useMemo(
    () => ({
      unreadCount,
    }),
    [unreadCount]
  )

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  )
}

export function useMessagesContext() {
  const ctx = useContext(MessagesContext)
  if (!ctx) throw new Error('useMessagesContext must be used within MessagesProvider')
  return ctx
}

// export { HOUSES }
// export type { House }
export type { Ticket }
