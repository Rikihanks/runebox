import { memo, useState } from 'react'
import type { Card } from '../types'

const typeMeta: Record<string, { icon: string; color: string }> = {
  champion: { icon: '⚔', color: '#c9a84c' },
  unit: { icon: '🛡', color: '#58a6ff' },
  spell: { icon: '✨', color: '#bc8cff' },
  gear: { icon: '⚙', color: '#d29922' },
}

const rarityColors: Record<string, string> = {
  common: '#9ca3af', uncommon: '#22c55e', rare: '#58a6ff', legendary: '#c9a84c',
}

interface Props {
  card: Card
  count?: number
  owned?: number
  onClick?: () => void
}

function CardViewInner({ card, count, owned, onClick }: Props) {
  const meta = typeMeta[card.type]
  const [imgErr, setImgErr] = useState(false)
  const missing = owned != null && owned === 0
  const showBadge = (count ?? 0) > 0

  return (
    <div
      className={`tcg-card rarity-${card.rarity}`}
      onClick={onClick}
      style={{ position: 'relative', opacity: missing ? 0.65 : 1 }}
    >
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {card.imageUrl && !imgErr ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            loading="lazy"
            onError={() => setImgErr(true)}
            style={{
              width: '100%', aspectRatio: '1 / 1.35', objectFit: 'cover', display: 'block',
              background: 'var(--bg)',
              filter: missing ? 'grayscale(0.6) brightness(0.5)' : 'none',
              transition: 'filter 0.2s',
            }}
          />
        ) : (
          <div style={{
            width: '100%', aspectRatio: '1 / 1.35', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, ${meta.color}22, var(--bg))`,
            fontSize: 36,
          }}>
            {meta.icon}
          </div>
        )}
        {missing && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{
              background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(2px)',
              borderRadius: 20, padding: '6px 14px', fontSize: 11, fontWeight: 700,
              color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,.1)',
            }}>✦ No tienes</span>
          </div>
        )}
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 5 }}>
          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {card.name}
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, marginLeft: 4, flexShrink: 0, color: rarityColors[card.rarity] }}>
            {card.rarity === 'legendary' ? 'L' : card.rarity === 'rare' ? 'R' : card.rarity === 'uncommon' ? 'U' : 'C'}
          </span>
        </div>
        <div className="flex items-center gap-xs" style={{ fontSize: 12, color: meta.color, fontWeight: 600, marginBottom: 5 }}>
          {meta.icon} {card.type.toUpperCase()}
          {card.isChampionLegend && <span style={{ color: 'var(--gold)', marginLeft: 2 }}>★</span>}
        </div>
        <div className="flex gap-xs flex-wrap" style={{ marginBottom: 5 }}>
          {card.domains.slice(0, 2).map(d => (
            <span key={d} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 3 }}>{d}</span>
          ))}
          {card.domains.length > 2 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{card.domains.length - 2}</span>}
        </div>
        <div className="flex items-center gap-md" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          <span>⚡{card.cost}</span>
          {card.might != null && <span>🗡{card.might}</span>}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: card.set === 'Spiritforged' ? 'var(--orange)' : card.set === 'Unleashed' ? 'var(--blue)' : 'var(--text-muted)' }}>
            {card.set?.toUpperCase().slice(0, 4)}
          </span>
        </div>
        {showBadge && (
          <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: 'var(--bg)' }}>
            <div style={{ height: '100%', borderRadius: 2, width: `${(count! / 3) * 100}%`, background: 'linear-gradient(90deg, var(--blue-dim), var(--blue))', transition: 'width 0.2s' }} />
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(CardViewInner)
