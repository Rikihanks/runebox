interface Props {
  name: 'home' | 'collection' | 'decks' | 'lists'
}

export function NavIcon({ name }: Props) {
  if (name === 'home') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  }
  if (name === 'collection') {
    return (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    )
  }
  if (name === 'decks') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M4 4h16v4H4z" />
        <path d="M4 10h16v4H4z" />
        <path d="M4 16h16v4H4z" />
      </svg>
    )
  }
  if (name === 'lists') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h6" />
      </svg>
    )
  }
  return null
}
