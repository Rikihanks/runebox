import { useState, useMemo, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useCardsStore } from '../store/cardsStore'
import { getSets } from '../data/sets'
import { useCollectionStore } from '../store/collectionStore'
import CardView from '../components/CardView'
import { NavIcon } from '../components/NavIcon'
import type { Card } from '../types'

const PAGE_SIZE = 40

export default function Collection() {
  const { collection, addCard, removeCard, getCompletion, getTotalCards, getTotalValue } = useCollectionStore()
  const storeCards = useCardsStore(s => s.cards)
  const storeLoaded = useCardsStore(s => s.loaded)
  const storeLoading = useCardsStore(s => s.loading)
  const storeError = useCardsStore(s => s.error)
  const loadCards = useCardsStore(s => s.load)
  const c = getCompletion()

  const [tab, setTab] = useState<'all' | 'owned' | 'missing'>('all')
  const [search, setSearch] = useState('')
  const [domainFilter, setDomainFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [setFilter, setSetFilter] = useState('')
  const [selected, setSelected] = useState<Card | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const sets = useMemo(() => getSets(), [storeCards])

  const filtered = useMemo(() => {
    setVisibleCount(PAGE_SIZE)
    return storeCards.filter(c => {
      if (tab === 'owned' && !collection[c.id]) return false
      if (tab === 'missing' && collection[c.id]) return false
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      if (domainFilter && !c.domains.includes(domainFilter as any)) return false
      if (typeFilter && c.type !== typeFilter) return false
      if (setFilter && c.set !== setFilter) return false
      return true
    })
  }, [tab, search, domainFilter, typeFilter, setFilter, collection, storeCards])

  const visibleCards = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount])
  const hasMore = visibleCount < filtered.length

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setVisibleCount(v => Math.min(v + PAGE_SIZE, filtered.length))
      }
    }, { rootMargin: '200px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore, filtered.length])

  const handleCardClick = (card: Card) => setSelected(card)

  const handleModalAction = () => {
    if (!selected) return
    addCard(selected.id)
    setSelected(null)
  }

  const hasFilters = search || domainFilter || typeFilter || setFilter

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="scroll">
        {/* Header */}
        <div className="flex items-center justify-between mb-sm">
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>Collection</h2>
            <p className="text-xs text-muted">{c.owned}/{c.total} · {getTotalCards()} copies · ~${getTotalValue().toFixed(0)}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-md">
          <div className="progress"><div className="progress-fill" style={{ width: `${c.percentage}%` }} /></div>
        </div>

        {/* Set pills */}
        <div className="flex gap-xs mb-md" style={{ overflowX: 'auto', paddingBottom: 2 }}>
          {sets.map(s => {
            const owned = Object.values(collection).filter(e =>
              storeCards.find(c => c.id === e.cardId)?.set === s.name
            ).length
            return (
              <div key={s.name} style={{
                padding: '6px 12px', borderRadius: 20,
                background: 'var(--bg)', border: '1px solid var(--border)',
                fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                borderLeft: `3px solid ${s.name === 'Origins' ? 'var(--blue)' : s.name === 'Unleashed' ? 'var(--orange)' : 'var(--purple)'}`,
              }}>
                {s.name} <span className="text-muted">{owned}/{s.totalCards}</span>
              </div>
            )
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-xs mb-md">
          {(['all', 'owned', 'missing'] as const).map(t => (
            <button
              key={t}
              className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setTab(t)}
              style={{ flex: 1, fontSize: 11 }}
            >
              {t === 'all' ? 'All' : t === 'owned' ? 'Owned' : 'Missing'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-sm" style={{ position: 'relative' }}>
          <input
            className="input"
            placeholder="Search cards..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: 14, color: 'var(--text-muted)', pointerEvents: 'none',
          }}>🔍</span>
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'var(--bg-elevated)', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: 12, padding: '2px 6px', borderRadius: 4,
                fontFamily: 'inherit',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        <div className="flex gap-xs mb-md">
          <div className="select-wrapper flex-1">
            <select className="select" value={domainFilter} onChange={e => setDomainFilter(e.target.value)}>
              <option value="">All domains</option>
              {['Demacia','Noxus','Ionia','Shadow Isles','Piltover','Zaun','Freljord','Shurima','Targon','Bandle City','Bilgewater','Void','Ixtal','Icathia'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
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

        {hasFilters && (
          <button className="btn btn-ghost btn-sm mb-md" onClick={() => { setSearch(''); setDomainFilter(''); setTypeFilter(''); setSetFilter(''); }} style={{ width: '100%' }}>
            Clear filters
          </button>
        )}

        {/* Card count */}
        <div className="text-xs text-muted mb-sm">{filtered.length} cards · showing {Math.min(visibleCount, filtered.length)}</div>

        {/* Card grid */}
        <div className="grid-2">
          {visibleCards.map(card => (
            <CardView
              key={card.id}
              card={card}
              count={collection[card.id]?.quantity ?? 0}
              owned={collection[card.id]?.quantity ?? 0}
              onClick={() => handleCardClick(card)}
            />
          ))}
        </div>

        {/* Sentinel for infinite scroll */}
        {hasMore && (
          <div ref={sentinelRef} style={{ textAlign: 'center', padding: '16px 0' }}>
            <span className="text-xs text-muted">Loading more...</span>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center" style={{ padding: 40 }}>
            <p className="text-muted text-sm">No cards found</p>
          </div>
        )}

        <div style={{ height: 12 }} />
      </div>

      {/* Bottom nav */}
      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="nav-icon"><NavIcon name="home" /></span>
          <span className="nav-label">Home</span>
        </NavLink>
        <NavLink to="/collection" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="nav-icon"><NavIcon name="collection" /></span>
          <span className="nav-label">Collection</span>
        </NavLink>
        <NavLink to="/deckbuilder" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="nav-icon"><NavIcon name="decks" /></span>
          <span className="nav-label">Decks</span>
        </NavLink>
        <NavLink to="/lists" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="nav-icon"><NavIcon name="lists" /></span>
          <span className="nav-label">Lists</span>
        </NavLink>
      </nav>

      {/* Card detail modal (Manabox-style) */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ padding: 0 }}>
            {/* Close button */}
            <div style={{
              position: 'sticky', top: 0, zIndex: 10,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px',
              background: 'var(--bg-card)',
              borderBottom: '1px solid var(--border)',
            }}>
              <span className="text-xs text-muted">{selected.id}</span>
              <button className="btn btn-ghost btn-xs" onClick={() => setSelected(null)} style={{ borderRadius: 20 }}>✕ Close</button>
            </div>

            {/* Card image */}
            <div style={{ padding: '0 16px 16px', background: 'var(--bg)' }}>
              {selected.imageUrl ? (
                <img
                  src={selected.imageUrl}
                  alt={selected.name}
                  style={{
                    width: '100%', maxHeight: 340,
                    objectFit: 'contain', borderRadius: 8,
                    display: 'block', margin: '0 auto',
                  }}
                />
              ) : (
                <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
                  {selected.type === 'champion' ? '⚔' : selected.type === 'unit' ? '🛡' : selected.type === 'spell' ? '✨' : '⚙'}
                </div>
              )}
            </div>

            {/* Card info */}
            <div style={{ padding: '0 16px 16px' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{selected.name}</h3>
              <div className="flex items-center gap-xs flex-wrap mb-md">
                {selected.domains.map(d => (
                  <span key={d} className="chip" style={{ fontSize: 10, cursor: 'default' }}>{d}</span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-lg mb-md" style={{ justifyContent: 'space-around', background: 'var(--bg)', borderRadius: 10, padding: '12px 8px' }}>
                <div className="stat">
                  <span className="stat-value">{selected.cost}</span>
                  <span className="stat-label">Cost</span>
                </div>
                {selected.might != null && (
                  <div className="stat">
                    <span className="stat-value">{selected.might}</span>
                    <span className="stat-label">Power</span>
                  </div>
                )}
                <div className="stat">
                  <span className="stat-value" style={{ fontSize: 12, color: selected.rarity === 'legendary' ? 'var(--gold)' : selected.rarity === 'rare' ? 'var(--blue)' : selected.rarity === 'uncommon' ? 'var(--green)' : 'var(--text-muted)' }}>
                    {selected.rarity.toUpperCase()}
                  </span>
                  <span className="stat-label">Rarity</span>
                </div>
                <div className="stat">
                  <span className="stat-value" style={{ fontSize: 12 }}>{selected.set}</span>
                  <span className="stat-label">Set</span>
                </div>
              </div>

              {/* Text */}
              {selected.text && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 12, lineHeight: 1.4 }}>
                  {selected.text}
                </p>
              )}

              {/* Prices */}
              {(selected.price != null || selected.cmPrice != null) && (
                <div className="mb-md">
                  <div className="text-xs font-semibold text-muted mb-sm">MARKET PRICE</div>
                  <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                    {selected.price != null && (
                      <div style={{ flex: 1, minWidth: 80, background: 'var(--bg)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>${selected.price.toFixed(2)}</div>
                        <div className="text-xs text-muted">Normal</div>
                      </div>
                    )}
                    {selected.foilPrice != null && (
                      <div style={{ flex: 1, minWidth: 80, background: 'var(--bg)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)' }}>${selected.foilPrice.toFixed(2)}</div>
                        <div className="text-xs text-muted">Foil</div>
                      </div>
                    )}
                    {selected.cmPrice != null && (
                      <div style={{ flex: 1, minWidth: 80, background: 'var(--bg)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--blue)' }}>${selected.cmPrice.toFixed(2)}</div>
                        <div className="text-xs text-muted">Cardmarket</div>
                      </div>
                    )}
                  </div>
                  {selected.cmUrl && (
                    <a href={selected.cmUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm w-full mt-sm" style={{ textAlign: 'center', fontSize: 11 }}>
                      View on Cardmarket ↗
                    </a>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-sm">
              <button className="btn btn-primary flex-1" onClick={handleModalAction}>
                + Add ({collection[selected.id]?.quantity ?? 0})
              </button>
              {(collection[selected.id]?.quantity ?? 0) > 1 && (
                <button className="btn btn-ghost" onClick={() => removeCard(selected.id, collection[selected.id]?.quantity ?? 0)}>
                  ✕ Remove all
                </button>
              )}
              </div>
            </div>

            <div style={{ height: 12 }} />
          </div>
        </div>
      )}
    </div>
  )
}
