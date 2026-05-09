import { useState, useMemo, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useCardsStore } from '../store/cardsStore'
import { useListStore } from '../store/listStore'
import CardView from '../components/CardView'
import { NavIcon } from '../components/NavIcon'
import { encodeList, getShareUrl } from '../utils/deckShare'
import type { Card } from '../types'

export default function Lists() {
  const { lists, createList, deleteList, renameList, addCard, removeCard, getCards } = useListStore()
  const storeCards = useCardsStore(s => s.cards)
  const storeLoaded = useCardsStore(s => s.loaded)
  const storeLoading = useCardsStore(s => s.loading)
  const storeError = useCardsStore(s => s.error)
  const loadCards = useCardsStore(s => s.load)

  const [currentListId, setCurrentListId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [setFilter, setSetFilter] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [editValue, setEditValue] = useState('')

  const inList = currentListId != null
  const currentList = lists.find(l => l.id === currentListId)
  const listCards = currentListId ? getCards(currentListId) : []
  const [availVisible, setAvailVisible] = useState(40)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const availableCards = useMemo(() => {
    return storeCards.filter(c => {
      if (c.isChampionLegend && c.type === 'champion') return true // allow all cards
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      if (typeFilter && c.type !== typeFilter) return false
      if (setFilter && c.set !== setFilter) return false
      return true
    })
  }, [search, typeFilter, setFilter, storeCards])

  const availHasMore = availVisible < availableCards.length
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && availHasMore) {
        setAvailVisible(v => Math.min(v + 40, availableCards.length))
      }
    }, { rootMargin: '200px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [availHasMore, availableCards.length])

  const groupedCards = useMemo(() => {
    const map = new Map<string, { card: Card; count: number }>()
    listCards.forEach(c => {
      const e = map.get(c.id) ?? { card: c, count: 0 }
      e.count++
      map.set(c.id, e)
    })
    return Array.from(map.values()).sort((a, b) => a.card.cost - b.card.cost)
  }, [listCards])

  const handleCreate = () => {
    if (!newName.trim()) return
    const id = createList(newName.trim())
    setCurrentListId(id)
    setShowNew(false)
    setNewName('')
  }

  const handleExport = async () => {
    if (!currentList) return
    const lines = [
      `# ${currentList.name}`,
      `# ${currentList.cardIds.length} cards`,
      '',
      ...groupedCards.map(e => `${e.count}x ${e.card.name} (${e.card.set})`),
    ]
    await navigator.clipboard.writeText(lines.join('\n'))
  }

  const handleShare = async () => {
    if (!currentList) return
    const encoded = encodeList(currentList.name, currentList.cardIds)
    const url = getShareUrl(encoded, 'list')
    await navigator.clipboard.writeText(url)
    alert('URL de la list copiada al portapapeles!')
  }

  if (!storeLoaded && !storeLoading) loadCards()
  if (storeLoading && !storeLoaded) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: '100%', padding: 60 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
        <p className="text-muted text-sm">Loading cards...</p>
      </div>
    )
  }
  if (storeError) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height: '100%', padding: 60 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <p className="text-muted text-sm">{storeError}</p>
        <button className="btn btn-primary btn-sm mt-sm" onClick={() => loadCards()}>Retry</button>
      </div>
    )
  }

  // ─── LIST VIEW ──────────────────────────────
  if (!inList) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="scroll">
          <div className="flex items-center justify-between mb-md">
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>Lists</h2>
              <p className="text-xs text-muted">{lists.length} list{lists.length !== 1 ? 's' : ''}</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>+ New</button>
          </div>

          {lists.length === 0 ? (
            <div className="text-center" style={{ padding: '48px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <p className="text-muted text-sm mb-md">You don't have any lists</p>
              <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ Create list</button>
            </div>
          ) : (
            <div className="flex flex-col gap-sm">
              {lists.map(l => (
                <div key={l.id} className="tcg-card"
                  style={{ padding: '14px 16px', cursor: 'pointer' }}
                  onClick={() => setCurrentListId(l.id)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{l.name}</div>
                      <div className="text-xs text-muted">{l.cardIds.length} card{l.cardIds.length !== 1 ? 's' : ''}</div>
                    </div>
                    <button className="btn btn-ghost btn-xs" onClick={e => { e.stopPropagation(); deleteList(l.id) }}
                      style={{ color: 'var(--red)' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ height: 12 }} />
        </div>

        <nav className="bottom-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon"><NavIcon name="home" /></span><span className="nav-label">Home</span>
          </NavLink>
          <NavLink to="/collection" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon"><NavIcon name="collection" /></span><span className="nav-label">Collection</span>
          </NavLink>
          <NavLink to="/deckbuilder" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon"><NavIcon name="decks" /></span><span className="nav-label">Decks</span>
          </NavLink>
          <NavLink to="/lists" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon"><NavIcon name="lists" /></span><span className="nav-label">Lists</span>
          </NavLink>
        </nav>

        {showNew && (
          <div className="modal-overlay" onClick={() => setShowNew(false)}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>New list</h3>
              <input className="input" placeholder="List name" value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
              <div className="flex gap-sm mt-md">
                <button className="btn btn-primary flex-1" onClick={handleCreate}>Crear</button>
                <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── LIST DETAIL VIEW ────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="scroll">
        <div className="flex items-center gap-sm mb-md">
          <button className="btn btn-ghost btn-sm" onClick={() => setCurrentListId(null)} style={{ fontSize: 16, padding: '6px 10px' }}>‹</button>
          <div className="flex-1">
            {editingName ? (
              <div className="flex items-center gap-xs">
                <input className="input" value={editValue} onChange={e => setEditValue(e.target.value)}
                  style={{ padding: '6px 10px', fontSize: 14 }} autoFocus />
                <button className="btn btn-primary btn-xs" onClick={() => { if (editValue.trim()) { renameList(currentListId!, editValue.trim()); setEditingName(false) } }}>OK</button>
                <button className="btn btn-ghost btn-xs" onClick={() => setEditingName(false)}>✕</button>
              </div>
            ) : (
              <h2 style={{ fontSize: 20, fontWeight: 800, cursor: 'pointer' }}
                onClick={() => { setEditValue(currentList!.name); setEditingName(true) }}>
                {currentList!.name} ✏
              </h2>
            )}
            <p className="text-xs text-muted">{currentList!.cardIds.length} cards</p>
          </div>
          <div className="flex gap-xs">
            <button className="btn btn-ghost btn-xs" onClick={handleShare}>🔗</button>
            <button className="btn btn-ghost btn-xs" onClick={handleExport}>📋</button>
          </div>
        </div>

        {/* Card list */}
        <div className="tcg-card" style={{ padding: '10px 14px', marginBottom: 12 }}>
          <div className="text-xs font-semibold text-muted mb-sm">LIST ({currentList!.cardIds.length} cards)</div>
          <div className="flex flex-col gap-xs">
            {groupedCards.map(({ card, count }) => (
              <div key={card.id} className="flex items-center justify-between"
                style={{ padding: '4px 8px', background: 'var(--bg)', borderRadius: 6, fontSize: 11 }}>
                <div className="flex items-center gap-sm flex-1" style={{ minWidth: 0 }}>
                  <span style={{ color: 'var(--blue)', fontWeight: 700, minWidth: 20, fontSize: 11 }}>{count > 1 ? `${count}x ` : ''}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.name}</span>
                  <span className="text-xs text-muted">({card.cost})</span>
                </div>
                <button className="btn btn-ghost btn-xs" onClick={() => removeCard(currentListId!, card.id)}
                  style={{ padding: '2px 6px', fontSize: 10, flexShrink: 0, color: 'var(--red)' }}>−</button>
              </div>
            ))}
            {listCards.length === 0 && <p className="text-xs text-muted">Add cards from below</p>}
          </div>
        </div>

        {/* Add cards */}
        <div className="flex items-center justify-between mb-sm">
          <span className="text-xs font-semibold text-muted">ADD CARDS</span>
        </div>
        <div className="mb-sm" style={{ position: 'relative' }}>
          <input className="input" placeholder="Search cards..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)' }}>🔍</span>
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'var(--bg-elevated)', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 4,
            }}>✕</button>
          )}
        </div>
        <div className="flex gap-xs mb-md">
          <div className="select-wrapper flex-1">
            <select className="select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">All types</option>
              <option value="champion">Champion</option>
              <option value="unit">Unit</option>
              <option value="spell">Spell</option>
              <option value="gear">Gear</option>
            </select>
          </div>
          <div className="select-wrapper" style={{ flex: .7 }}>
            <select className="select" value={setFilter} onChange={e => setSetFilter(e.target.value)}>
              <option value="">All sets</option>
              <option value="Origins">Origins</option>
              <option value="Unleashed">Unleashed</option>
              <option value="Spiritforged">Spiritforged</option>
            </select>
          </div>
        </div>

        <div className="grid-2">
          {availableCards.slice(0, availVisible).map(card => (
            <div key={card.id} style={{ position: 'relative', minWidth: 0 }}>
              <CardView card={card} onClick={() => addCard(currentListId!, card.id)} />
            </div>
          ))}
        </div>
        {availHasMore && (
          <div ref={sentinelRef} style={{ textAlign: 'center', padding: '12px 0' }}>
            <span className="text-xs text-muted">Loading more...</span>
          </div>
        )}
        {availableCards.length === 0 && (
          <div className="text-center" style={{ padding: 24 }}><p className="text-muted text-sm">No hay cards</p></div>
        )}

        <div style={{ height: 12 }} />
      </div>

      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="nav-icon"><NavIcon name="home" /></span><span className="nav-label">Home</span>
        </NavLink>
        <NavLink to="/collection" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="nav-icon"><NavIcon name="collection" /></span><span className="nav-label">Collection</span>
        </NavLink>
        <NavLink to="/deckbuilder" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="nav-icon"><NavIcon name="decks" /></span><span className="nav-label">Decks</span>
        </NavLink>
        <NavLink to="/lists" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon"><NavIcon name="lists" /></span><span className="nav-label">Lists</span>
          </NavLink>
        </nav>
      </div>
    )
  }
