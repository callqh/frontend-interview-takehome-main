import { useState, useCallback } from 'react'

const COLUMN_WIDTH_PX = 48
const VISIBLE_COLUMNS = 14

interface VisibleRange {
  startIndex: number
  endIndex: number
}

export function useVisibleRange() {
  const [startIndex, setStartIndex] = useState(0)

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const nextStartIndex = Math.floor(e.currentTarget.scrollLeft / COLUMN_WIDTH_PX)
    setStartIndex(current => current === nextStartIndex ? current : nextStartIndex)
  }, [])

  const visibleRange: VisibleRange = {
    startIndex,
    endIndex: startIndex + VISIBLE_COLUMNS,
  }

  return { visibleRange, handleScroll }
}
