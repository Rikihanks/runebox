import { Link, NavLink } from 'react-router-dom'
import { NavIcon } from '../components/NavIcon'
import { useCollectionStore } from '../store/collectionStore'
import { useDeckStore } from '../store/deckStore'
import { useEffect, useMemo } from 'react'
import { useCardsStore } from '../store/cardsStore'

const SET_COLORS: Record<string, string> = {
  Origins: 'var(--blue)',
  Unleashed: 'var(--orange)',
  Spiritforged: 'var(--purple)',
}

export default function Home() {
  const { collection, getTotalCards, getCompletion, getTotalValue } = useCollectionStore()
  const { decks } = useDeckStore()
  const storeCards = useCardsStore(s => s.cards)
  const loadCards = useCardsStore(s => s.load)
  const loaded = useCardsStore(s => s.loaded)
  const c = getCompletion()

  useEffect(() => {
    if (!loaded) loadCards()
  }, [])

  const setProgress = useMemo(() => {
    const sets = ['Origins', 'Unleashed', 'Spiritforged']
    return sets.map(name => {
      const all = storeCards.filter(c => c.set === name)
      const owned = all.filter(c => collection[c.id]).length
      return { name, total: all.length, owned, pct: all.length ? Math.round((owned / all.length) * 100) : 0 }
    })
  }, [storeCards, collection])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="scroll">
        {/* Header */}
        <div style={{ padding: '8px 0 16px' }}>
          <div className="flex items-center justify-between">
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', letterSpacing: 1, marginBottom: 2 }}>
                RUNEBOX
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>Your Collection</h1>
            </div>
          </div>
        </div>

        {/* Main stats card */}
        <div className="tcg-card" style={{ padding: '16px', marginBottom: 12, background: 'linear-gradient(135deg, var(--blue-dim)11, transparent)' }}>
          <div className="flex items-center justify-between mb-md">
            <span className="text-sm font-semibold text-muted">Progress</span>
            <span className="text-sm font-bold" style={{ color: 'var(--blue)' }}>{c.percentage}%</span>
          </div>
          <div className="progress mb-md" style={{ height: 10 }}>
            <div className="progress-fill" style={{ width: `${c.percentage}%` }} />
          </div>
          <div className="flex items-center justify-around">
            <div className="stat">
              <span className="stat-value" style={{ fontSize: 22 }}>{getTotalCards()}</span>
              <span className="stat-label">Copies</span>
            </div>
            <div style={{ width: 1, height: 32, background: 'var(--border)' }} />
            <div className="stat">
              <span className="stat-value" style={{ fontSize: 22 }}>{c.owned}</span>
              <span className="stat-label">Unique</span>
            </div>
            <div style={{ width: 1, height: 32, background: 'var(--border)' }} />
            <div className="stat">
              <span className="stat-value" style={{ fontSize: 22 }}>{c.total}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
        </div>

        {/* Value + Decks row */}
        <div className="flex gap-sm mb-md">
          <div className="tcg-card flex-1" style={{ padding: '14px' }}>
            <div className="text-xs text-muted mb-xs" style={{ fontWeight: 600, letterSpacing: .5 }}>VALUE</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>
              ${getTotalValue().toFixed(0)}
            </div>
            <div className="text-xs text-muted mt-xs">estimated</div>
          </div>
          <div className="tcg-card flex-1" style={{ padding: '14px' }}>
            <div className="text-xs text-muted mb-xs" style={{ fontWeight: 600, letterSpacing: .5 }}>DECKS</div>
            <div className="flex items-center gap-sm">
              <span style={{ fontSize: 22, fontWeight: 800 }}>{decks.length}</span>
              <span className="text-xs text-muted">created</span>
            </div>
            {decks.length > 0 && (
              <div className="text-xs text-muted mt-xs">
                {decks.filter(d => d.cardIds.length >= 40).length} valid
              </div>
            )}
          </div>
        </div>

        {/* Set progress */}
        <div className="tcg-card" style={{ padding: '14px 16px', marginBottom: 12 }}>
          <div className="text-xs font-semibold text-muted mb-md" style={{ letterSpacing: .5 }}>PROGRESS BY SET</div>
          <div className="flex flex-col gap-sm">
            {setProgress.map(s => (
              <div key={s.name}>
                <div className="flex items-center justify-between mb-xs">
                  <div className="flex items-center gap-sm">
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: SET_COLORS[s.name] || 'var(--text-muted)' }} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {s.owned}/{s.total}
                  </span>
                </div>
                <div className="progress" style={{ height: 10 }}>
                  <div className="progress-fill" style={{
                    width: `${s.pct}%`,
                    background: `linear-gradient(90deg, ${SET_COLORS[s.name] || 'var(--blue-dim)'}, ${SET_COLORS[s.name] || 'var(--blue)'})`,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-col gap-sm">
          <Link to="/collection" style={{ textDecoration: 'none' }}>
            <div className="tcg-card flex items-center gap-md" style={{ padding: '14px 16px' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'linear-gradient(135deg, var(--blue-dim), var(--blue))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>🃏</div>
              <div className="flex-1">
                <div style={{ fontWeight: 700, fontSize: 14 }}>Collection</div>
                <div className="text-xs text-muted">{c.owned} unique cards · {c.percentage}% complete</div>
              </div>
              <span className="text-muted" style={{ fontSize: 18 }}>›</span>
            </div>
          </Link>
          <Link to="/deckbuilder" style={{ textDecoration: 'none' }}>
            <div className="tcg-card flex items-center gap-md" style={{ padding: '14px 16px' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>🧱</div>
              <div className="flex-1">
                <div style={{ fontWeight: 700, fontSize: 14 }}>Deck Builder</div>
                <div className="text-xs text-muted">
                  {decks.length > 0 ? `${decks.filter(d => d.cardIds.length >= 40).length} valid out of ${decks.length}` : 'Create your first deck'}
                </div>
              </div>
              <span className="text-muted" style={{ fontSize: 18 }}>›</span>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '24px 0 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', opacity: .5 }}>
            -
          </div>
        </div>
      </div>

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
    </div>
  )
}
