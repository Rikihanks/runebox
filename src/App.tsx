import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import Collection from './pages/Collection'
import DeckBuilder from './pages/DeckBuilder'
import Lists from './pages/Lists'
import { decodeDeck, decodeList, validateDeck, validateList } from './utils/deckShare'
import { useCardsStore } from './store/cardsStore'
import { useDeckStore } from './store/deckStore'
import { useListStore } from './store/listStore'
import { NavIcon } from './components/NavIcon'

export default function App() {
  const [importData, setImportData] = useState<{ name: string; encoded: string; type: 'deck' | 'list' } | null>(null)
  const loadCards = useCardsStore(s => s.load)
  const storeLoaded = useCardsStore(s => s.loaded)
  const createDeck = useDeckStore(s => s.createDeck)
  const addCardToDeck = useDeckStore(s => s.addCardToDeck)
  const setCurrentDeck = useDeckStore(s => s.setCurrentDeck)
  const createList = useListStore(s => s.createList)
  const addCardToList = useListStore(s => s.addCard)

  // Detect ?d= (deck) or ?l= (list) parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const dParam = params.get('d')
    const lParam = params.get('l')
    if (!dParam && !lParam) return

    // Clean the URL without reloading
    const url = new URL(window.location.href)
    url.searchParams.delete('d')
    url.searchParams.delete('l')
    window.history.replaceState({}, '', url.toString())

    const isList = !!lParam
    const encoded = isList ? lParam! : dParam!

    try {
      if (isList) {
        const list = decodeList(encoded)
        if (!storeLoaded) {
          loadCards().then(() => {
            const ids = new Set(useCardsStore.getState().cards.map(c => c.id))
            const errs = validateList(list, ids)
            if (errs.length > 0) { alert('Error importing list:\n' + errs.join('\n')); return }
            setImportData({ name: list.name, encoded, type: 'list' })
          })
          return
        }
        const ids = new Set(useCardsStore.getState().cards.map(c => c.id))
        const errs = validateList(list, ids)
        if (errs.length > 0) { alert('Error importing list:\n' + errs.join('\n')); return }
        setImportData({ name: list.name, encoded, type: 'list' })
      } else {
        const deck = decodeDeck(encoded)
        if (!storeLoaded) {
          loadCards().then(() => {
            const ids = new Set(useCardsStore.getState().cards.map(c => c.id))
            const errs = validateDeck(deck, ids)
            if (errs.length > 0) { alert('Error importing deck:\n' + errs.join('\n')); return }
            setImportData({ name: deck.name, encoded, type: 'deck' })
          })
          return
        }
        const ids = new Set(useCardsStore.getState().cards.map(c => c.id))
        const errs = validateDeck(deck, ids)
        if (errs.length > 0) { alert('Error importing deck:\n' + errs.join('\n')); return }
        setImportData({ name: deck.name, encoded, type: 'deck' })
      }
    } catch (e: any) {
      alert(`El enlace no es valid: ${e.message}`)
    }
  }, [])

  const handleImport = () => {
    if (!importData) return
    try {
      if (importData.type === 'list') {
        const list = decodeList(importData.encoded)
        const listId = createList(list.name)
        for (const [cardId, count] of list.cards) {
          for (let i = 0; i < count; i++) addCardToList(listId, cardId)
        }
        setImportData(null)
      } else {
        const deck = decodeDeck(importData.encoded)
        const deckId = createDeck(deck.name, deck.legend)
        for (const [cardId, count] of deck.cards) {
          for (let i = 0; i < count; i++) addCardToDeck(cardId)
        }
        setCurrentDeck(deckId)
        setImportData(null)
      }
    } catch (e: any) {
      alert('Error importing: ' + e.message)
    }
  }

  const desktopLinkStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', borderRadius: 8,
    textDecoration: 'none', color: 'var(--text-muted)',
    fontSize: 13, fontWeight: 500,
    transition: 'background .15s, color .15s',
  }

  return (
    <BrowserRouter>
      {/* Desktop header */}
      <nav className="desktop-header" style={{
        display: 'none',
        alignItems: 'center', gap: 4,
        height: 56, padding: '0 32px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <span style={{ fontSize: 16, fontWeight: 800, marginRight: 24, color: 'var(--gold)' }}>⚔ RuneBox</span>
        <NavLink to="/" end style={desktopLinkStyle}
          className={({ isActive }) => isActive ? 'desktop-active' : ''}>
          <NavIcon name="home" /> Home
        </NavLink>
        <NavLink to="/collection" style={desktopLinkStyle}
          className={({ isActive }) => isActive ? 'desktop-active' : ''}>
          <NavIcon name="collection" /> Collection
        </NavLink>
        <NavLink to="/deckbuilder" style={desktopLinkStyle}
          className={({ isActive }) => isActive ? 'desktop-active' : ''}>
          <NavIcon name="decks" /> Decks
        </NavLink>
        <NavLink to="/lists" style={desktopLinkStyle}
          className={({ isActive }) => isActive ? 'desktop-active' : ''}>
          <NavIcon name="lists" /> Lists
        </NavLink>
      </nav>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/deckbuilder" element={<DeckBuilder />} />
          <Route path="/lists" element={<Lists />} />
        </Routes>
      </div>

      {/* Import modal */}
      {importData && (
        <div className="modal-overlay" onClick={() => setImportData(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-md">
              <div style={{ fontSize: 40, marginBottom: 12 }}>{importData.type === 'list' ? '📋' : '🧱'}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                Import {importData.type === 'list' ? 'list' : 'deck'}
              </h3>
              <p className="text-sm text-muted">
                {importData.type === 'list' ? 'A list was shared with you' : 'A deck was shared with you'}
              </p>
            </div>
            <div className="tcg-card" style={{ padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{importData.name}</div>
              <div className="text-xs text-muted">
                {importData.type === 'list' ? 'Card list' : 'Riftbound deck'}
              </div>
            </div>
            <div className="flex gap-sm">
              <button className="btn btn-primary flex-1" onClick={handleImport}>
                Import {importData.type === 'list' ? 'list' : 'deck'}
              </button>
              <button className="btn btn-ghost" onClick={() => setImportData(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </BrowserRouter>
  )
}
