import React, { useMemo } from 'react'
import type { GetServerSideProps, NextPage } from 'next'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { Ticket } from '@/types'

interface MessagesPageProps {
  initialTicketId: string | null
}

interface MessageViewStateProps {
  title: string
  description?: string
  tone?: 'muted' | 'error'
}

const fetcher = async (url: string) => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to load messages')
  }

  return response.json()
}

const MessageViewState = ({ title, description, tone = 'muted' }: MessageViewStateProps) => (
  <div style={{
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tone === 'error' ? '#c62828' : '#888',
    fontSize: 14,
    textAlign: 'center',
    padding: 24,
  }}>
    <div>
      <div style={{ fontWeight: 600, marginBottom: description ? 6 : 0 }}>
        {title}
      </div>
      {description && (
        <div style={{ color: tone === 'error' ? '#c62828' : '#aaa', fontSize: 12 }}>
          {description}
        </div>
      )}
    </div>
  </div>
)

const MessagesPage: NextPage<MessagesPageProps> = ({ initialTicketId }) => {
  const router = useRouter()
  const { data: tickets, error, isLoading, mutate } = useSWR<Ticket[]>('/api/tickets', fetcher)

  // Use ticketId from URL or prop
  const currentTicketId = (router.query.ticketId as string) ?? initialTicketId

  const handleTicketClick = (ticket: Ticket) => {
    if (ticket.unread) {
      mutate(
        currentTickets => currentTickets?.map(currentTicket => (
          currentTicket.id === ticket.id
            ? { ...currentTicket, unread: false }
            : currentTicket
        )),
        false
      )
    }

    router.push({
      pathname: '/messages',
      query: {
        ticketId: ticket.id,
        houseId: ticket.houseId,
      },
    }, undefined, { shallow: true })
  }

  const activeTicket = useMemo(
    () => tickets?.find(t => t.id === currentTicketId),
    [tickets, currentTicketId]
  )
  const hasSelectedTicket = Boolean(currentTicketId)

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Ticket list */}
      <div style={{
        width: 320,
        minWidth: 320,
        borderRight: '1px solid #e0e0e0',
        overflowY: 'auto',
        background: 'white',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', fontWeight: 600, fontSize: 15 }}>
          Messages
        </div>

        {isLoading && (
          <div style={{ padding: '20px', color: '#888', fontSize: 13 }}>
            Loading messages...
          </div>
        )}

        {error && (
          <div style={{ padding: '20px', color: '#c62828', fontSize: 13 }}>
            Failed to load messages.
          </div>
        )}

        {!isLoading && !error && tickets?.length === 0 && (
          <div style={{ padding: '20px', color: '#888', fontSize: 13 }}>
            No messages yet.
          </div>
        )}

        {!isLoading && !error && tickets?.map(ticket => {
          const isActive = ticket.id === currentTicketId
          return (
            <div
              key={ticket.id}
              onClick={() => handleTicketClick(ticket)}
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                background: isActive ? '#f0f7ff' : 'white',
                borderLeft: isActive ? '3px solid #6c63ff' : '3px solid transparent',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <span style={{ fontWeight: ticket.unread ? 600 : 400, fontSize: 13 }}>
                  {ticket.guestName}
                </span>
                {ticket.unread && (
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#6c63ff',
                    flexShrink: 0,
                    marginTop: 4,
                  }} />
                )}
              </div>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 3, fontWeight: ticket.unread ? 500 : 400 }}>
                {ticket.subject}
              </div>
              <div style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {ticket.lastMessage}
              </div>
              <div style={{ fontSize: 10, color: '#bbb', marginTop: 4 }}>
                {ticket.houseName}
              </div>
            </div>
          )
        })}
      </div>

      {/* Message view */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeTicket ? (
          <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{activeTicket.subject}</h2>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
              {activeTicket.guestName} · {activeTicket.houseName}
            </p>
            <div style={{
              padding: '12px 16px',
              background: '#f8f8f8',
              borderRadius: 8,
              fontSize: 14,
              lineHeight: 1.6,
              maxWidth: 520,
            }}>
              {activeTicket.lastMessage}
            </div>
          </div>
        ) : error ? (
          <MessageViewState
            title="Failed to load message"
            description="Please refresh the page or try again later."
            tone="error"
          />
        ) : isLoading && hasSelectedTicket ? (
          <MessageViewState
            title="Loading selected message..."
            description="We are fetching the message from the current URL."
          />
        ) : isLoading ? (
          <MessageViewState title="Loading messages..." />
        ) : hasSelectedTicket ? (
          <MessageViewState
            title="Message not found"
            description="The selected ticket may no longer exist or the link is invalid."
          />
        ) : (
          <MessageViewState title="Select a message to view" />
        )}
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const ticketId = (context.query.ticketId as string) ?? null
  return {
    props: {
      initialTicketId: ticketId,
    },
  }
}

export default MessagesPage
