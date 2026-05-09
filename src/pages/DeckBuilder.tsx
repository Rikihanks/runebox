import { useState, useMemo, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useCardsStore } from '../store/cardsStore'
import { useCollectionStore } from '../store/collectionStore'
import { useDeckStore } from '../store/deckStore'
import CardView from '../components/CardView'
import { NavIcon } from '../components/NavIcon'
import { encodeDeck, getShareUrl } from '../utils/deckShare'
import type { Card } from '../types'

export default function DeckBuilder() {
  const { decks, currentDeck, createDeck, deleteDeck, setCurrentDeck, addCardToDeck, removeCardFromDeck, validateDeck, getDeckCards, getChampionLegend } = useDeckStore()
  const { collection } = useCollectionStore()
  const storeCards = useCardsStore(s => s.cards)
  const storeLoaded = useCardsStore(s => s.loaded)
  const storeLoading = useCardsStore(s => s.loading)
  const storeError = useCardsStore(s => s.error)
  const loadCards = useCardsStore(s => s.load)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [setFilter, setSetFilter] = useState('')
  const [showNewDeck, setShowNewDeck] = useState(false)
  const [newName, setNewName] = useState('')
  const [newLegend, setNewLegend] = useState('')

  const championLegends = useMemo(() => storeCards.filter(c => c.isChampionLegend), [storeCards])
  const inDeck = currentDeck != null
  const deckCards = currentDeck ? getDeckCards(currentDeck.id) : []
  const championLegend = currentDeck ? getChampionLegend(currentDeck.id) : undefined
  const validation = currentDeck ? validateDeck(currentDeck.id) : null
  const countInDeck = (id: string) => deckCards.filter(c => c.id === id).length
  const [availVisible, setAvailVisible] = useState(40)
  const availSentinelRef = useRef<HTMLDivElement>(null)

  const availableCards = useMemo(() => {
    setAvailVisible(40)
    if (!currentDeck) return []
    return storeCards.filter(c => {
      if (c.isChampionLegend) return false
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      if (typeFilter && c.type !== typeFilter) return false
      if (setFilter && c.set !== setFilter) return false
      const ok = c.domains.some(d => championLegend?.domains.includes(d))
      return ok
    })
  }, [search, typeFilter, setFilter, currentDeck, championLegend, storeCards])

  const typeCounts = useMemo(() => {
    const r: Record<string, number> = { champion: 0, unit: 0, spell: 0, gear: 0 }
    deckCards.forEach(c => { r[c.type]++ })
    return r
  }, [deckCards])

  const domainCounts = useMemo(() => {
    const r: Record<string, number> = {}
    deckCards.forEach(c => c.domains.forEach(d => { r[d] = (r[d] ?? 0) + 1 }))
    return r
  }, [deckCards])

  const costCurve = useMemo(() => {
    const r: Record<number, number> = {}
    deckCards.forEach(c => { r[c.cost] = (r[c.cost] ?? 0) + 1 })
    return r
  }, [deckCards])

  const groupedDeckCards = useMemo(() => {
    const map = new Map<string, { card: Card; count: number }>()
    deckCards.forEach(c => {
      const e = map.get(c.id) ?? { card: c, count: 0 }
      e.count++
      map.set(c.id, e)
    })
    return Array.from(map.values()).sort((a, b) => a.card.cost - b.card.cost)
  }, [deckCards])


  const handleExport = async () => {
    if (!currentDeck) return
    const lines = [
      `# ${currentDeck.name}`,
      `# Legend: ${championLegend?.name ?? '?'}`,
      `# ${deckCards.length} cards`,
      '',
      ...groupedDeckCards.map(e => `${e.count}x ${e.card.name} (${e.card.set})`),
    ]
    await navigator.clipboard.writeText(lines.join('\n'))
  }

  const handleShare = async () => {
    if (!currentDeck) return
    const encoded = encodeDeck(currentDeck.name, currentDeck.championLegendId, currentDeck.cardIds)
    const url = getShareUrl(encoded)
    await navigator.clipboard.writeText(url)
    alert('Deck URL copied al portapapeles!')
  }

  const availHasMore = availVisible < availableCards.length
  useEffect(() => {
    const el = availSentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && availHasMore) {
        setAvailVisible(v => Math.min(v + 40, availableCards.length))
      }
    }, { rootMargin: '200px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [availHasMore, availableCards.length])

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

  // ─── DECK LIST VIEW ───────────────────────────────────────────
  if (!inDeck) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="scroll">
          <div className="flex items-center justify-between mb-md">
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>Decks</h2>
              <p className="text-xs text-muted">{decks.length} deck{decks.length !== 1 ? 's' : ''}</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowNewDeck(true)}>+ New</button>
          </div>

          {decks.length === 0 ? (
            <div className="text-center" style={{ padding: '48px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🧱</div>
              <p className="text-muted text-sm mb-md">You don't have any decks</p>
              <button className="btn btn-primary" onClick={() => setShowNewDeck(true)}>+ Create first deck</button>
            </div>
          ) : (
            <div className="flex flex-col gap-sm">
              {decks.map(d => {
                const legend = getChampionLegend(d.id)
                const count = d.cardIds.length
                return (
                  <div key={d.id} className="tcg-card"
                    style={{
                      padding: '16px', cursor: 'pointer', position: 'relative', minHeight: 110,
                      backgroundImage: legend?.imageUrl ? `url(${legend.imageUrl})` : undefined,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                    }}
                    onClick={() => setCurrentDeck(d.id)}
                  >
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(135deg, rgba(0,0,0,.82) 0%, rgba(0,0,0,.55) 100%)',
                      borderRadius: 'inherit',
                    }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div className="flex items-center justify-between mb-sm">
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{d.name}</div>
                        <button className="btn btn-ghost btn-xs" onClick={e => { e.stopPropagation(); if (confirm('Delete this deck?')) deleteDeck(d.id) }}
                          style={{ color: 'var(--red)', background: 'rgba(0,0,0,.4)', border: 'none' }}>✕</button>
                      </div>
                      {legend && (
                        <div className="flex items-center gap-xs mb-sm">
                          <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700 }}>★</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#ddd' }}>{legend.name}</span>
                          <span style={{ fontSize: 10, color: '#999' }}>({legend.domains.join(' · ')})</span>
                        </div>
                      )}
                      <div className="flex items-center gap-sm" style={{ fontSize: 11, color: '#aaa' }}>
                        <span>{count} card{count !== 1 ? 's' : ''}</span>
                        <span>·</span>
                        <span style={{ color: count >= 40 ? 'var(--green)' : '#aaa', fontWeight: 600 }}>
                          {count >= 40 ? 'Valid' : `${count}/40`}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
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

        {showNewDeck && (
          <div className="modal-overlay" onClick={() => setShowNewDeck(false)}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-md">
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>New Deck</h3>
                <button className="btn btn-ghost btn-xs" onClick={() => setShowNewDeck(false)}>✕</button>
              </div>
              <div className="flex flex-col gap-sm mb-md">
                <input className="input" placeholder="Deck name" value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Champion Legend</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 260, overflowY: 'auto' }}>
                  {championLegends.map(c => (
                    <div key={c.id} className={`chip w-full ${newLegend === c.id ? 'active' : ''}`}
                      style={{ justifyContent: 'flex-start', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}
                      onClick={() => setNewLegend(c.id)}>
                      <span style={{ flex: 1 }}>{c.name}</span>
                      <span className="text-xs text-muted">{c.domains.join(' · ')}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-sm">
                <button className="btn btn-primary flex-1" onClick={() => { if (newName.trim() && newLegend) { createDeck(newName.trim(), newLegend); setShowNewDeck(false); setNewName(''); setNewLegend('') } }}>Crear</button>
                <button className="btn btn-ghost" onClick={() => setShowNewDeck(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── DECK DETAIL VIEW ─────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="scroll">
        <div className="flex items-center gap-sm mb-md">
          <button className="btn btn-ghost btn-sm" onClick={() => setCurrentDeck(null)} style={{ fontSize: 16, padding: '6px 10px' }}>‹</button>
          <div className="flex-1">
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>{currentDeck!.name}</h2>
            <p className="text-xs text-muted">{deckCards.length} cards</p>
          </div>
          <div className="flex gap-xs">
            <button className="btn btn-ghost btn-xs" onClick={handleShare}>🔗</button>
            <button className="btn btn-ghost btn-xs" onClick={handleExport}>📋</button>
            <button className="btn btn-ghost btn-xs" onClick={() => { if (confirm('Delete this deck?')) { deleteDeck(currentDeck!.id); setCurrentDeck(null) } }}
              style={{ color: 'var(--red)' }}>🗑</button>
          </div>
        </div>

        {championLegend && (
          <div className="tcg-card" style={{ padding: '10px 14px', marginBottom: 12, borderLeft: '3px solid var(--gold)' }}>
            <div className="text-xs" style={{ fontWeight: 600, color: 'var(--gold)', marginBottom: 2 }}>★ Champion Legend</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{championLegend.name}</div>
            <div className="flex gap-xs mt-xs">
              {championLegend.domains.map(d => (
                <span key={d} style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 4 }}>{d}</span>
              ))}
            </div>
          </div>
        )}

        {validation && (
          <div className="tcg-card" style={{ padding: '10px 14px', marginBottom: 12 }}>
            <div className="flex items-center justify-between mb-sm">
              <span style={{ fontSize: 13, fontWeight: 700, color: validation.valid ? 'var(--green)' : 'var(--red)' }}>
                {validation.valid ? '✅ Valid deck' : '❌ Invalid deck'}
              </span>
              <span style={{ fontSize: 14, fontWeight: 800, color: deckCards.length >= 40 ? 'var(--green)' : 'var(--text-muted)' }}>
                {deckCards.length}/40
              </span>
            </div>
            {validation.errors.map((e, i) => (
              <div key={i} style={{ fontSize: 10, color: 'var(--red)', marginTop: 2 }}>{e}</div>
            ))}
            <div className="flex gap-md text-xs text-muted mt-sm flex-wrap">
              {Object.entries(typeCounts).map(([t, n]) => (
                <span key={t}>{t}: <strong style={{ color: 'var(--text)' }}>{n}</strong></span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-sm mb-md">
          <div className="tcg-card flex-1" style={{ padding: '10px' }}>
            <div className="text-xs font-semibold text-muted mb-sm">COST</div>
            <div className="flex items-end gap-xs" style={{ height: 36 }}>
              {Array.from({ length: 8 }, (_, i) => {
                const n = costCurve[i] ?? 0
                const max = Math.max(...Object.values(costCurve), 1)
                return (
                  <div key={i} className="flex-1 flex flex-col items-center" style={{ height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ width: '100%', borderRadius: '2px 2px 0 0', background: n > 0 ? 'var(--blue)' : 'var(--bg)', height: `${(n / max) * 100}%`, minHeight: n > 0 ? 2 : 0 }} />
                    <div style={{ fontSize: 7, color: 'var(--text-muted)', marginTop: 1 }}>{i}</div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="tcg-card flex-1" style={{ padding: '10px' }}>
            <div className="text-xs font-semibold text-muted mb-sm">DOMAINS</div>
            <div className="flex gap-xs flex-wrap">
              {Object.entries(domainCounts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([d, n]) => (
                <span key={d} style={{ fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'var(--bg)', color: 'var(--text)' }}>{d}: {n}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="tcg-card" style={{ padding: '10px 14px', marginBottom: 12 }}>
          <div className="text-xs font-semibold text-muted mb-sm">LIST ({deckCards.length} cards)</div>
          <div className="flex flex-col gap-xs">
            {groupedDeckCards.map(({ card, count }) => (
              <div key={card.id} className="flex items-center justify-between" style={{ padding: '4px 8px', background: 'var(--bg)', borderRadius: 6, fontSize: 11 }}>
                <div className="flex items-center gap-sm flex-1" style={{ minWidth: 0 }}>
                  <span style={{ color: 'var(--blue)', fontWeight: 700, minWidth: 20, fontSize: 11 }}>{count}x</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.name}</span>
                  <span className="text-xs text-muted">({card.cost})</span>
                </div>
                <button className="btn btn-ghost btn-xs" onClick={() => removeCardFromDeck(card.id)}
                  style={{ padding: '2px 6px', fontSize: 10, flexShrink: 0, color: 'var(--red)' }}>−</button>
              </div>
            ))}
            {deckCards.length === 0 && <p className="text-xs text-muted">Add cards from below</p>}
          </div>
        </div>

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
              cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 4, fontFamily: 'inherit',
            }}>✕</button>
          )}
        </div>
        <div className="flex gap-xs mb-md">
          <div className="select-wrapper flex-1">
            <select className="select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">All types</option>
              <option value="unit">Unit</option><option value="spell">Spell</option><option value="gear">Gear</option>
            </select>
          </div>
          <div className="select-wrapper" style={{ flex: .7 }}>
            <select className="select" value={setFilter} onChange={e => setSetFilter(e.target.value)}>
              <option value="">All sets</option>
              <option value="Origins">Origins</option><option value="Unleashed">Unleashed</option><option value="Spiritforged">Spiritforged</option>
            </select>
          </div>
        </div>

        <div className="grid-2">
          {availableCards.slice(0, availVisible).map(card => {
            const inDeck = countInDeck(card.id)
            const owned = collection[card.id]?.quantity ?? 0
            return (
              <div key={card.id} style={{ position: 'relative', minWidth: 0 }}>
                <CardView card={card} count={inDeck} owned={owned} onClick={() => inDeck < 3 && addCardToDeck(card.id)} />
                {inDeck >= 3 && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'var(--red)' }}>MAX 3</div>
                )}
              </div>
            )
          })}
        </div>
        {availHasMore && (
          <div ref={availSentinelRef} style={{ textAlign: 'center', padding: '12px 0' }}>
            <span className="text-xs text-muted">Loading more...</span>
          </div>
        )}
        {availableCards.length === 0 && (
          <div className="text-center" style={{ padding: 24 }}><p className="text-muted text-sm">No hay cards disponibles</p></div>
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
