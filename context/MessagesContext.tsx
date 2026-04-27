import React, {
  createContext,
  useContext,
  useMemo,
  ReactNode,
} from 'react'
import useSWR from 'swr'
import { Ticket } from '@/types'

interface House {
  id: string
  name: string
}

const HOUSES: House[] = [
  { id: 'h1', name: 'Orchard House' },
  { id: 'h2', name: 'Marina Suite' },
  { id: 'h3', name: 'Sentosa Villa' },
]

interface MessagesContextValue {
  unreadCount: number
}

const MessagesContext = createContext<MessagesContextValue | null>(null)

const fetcher = async (url: string) => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to load messages')
  }

  return response.json()
}

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { data: tickets } = useSWR<Ticket[]>('/api/tickets', fetcher)
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

export { HOUSES }
export type { House, Ticket }
