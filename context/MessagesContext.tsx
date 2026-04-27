import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
} from 'react'
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
  setUnreadCount: (n: number) => void
}

const MessagesContext = createContext<MessagesContextValue | null>(null)

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)

  const value = useMemo(
    () => ({
      unreadCount,
      setUnreadCount,
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
