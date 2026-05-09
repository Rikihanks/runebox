import type { Card, Domain, CardType, SetName } from '../types'

interface Props {
  cards: Card[]
  filters: { search: string; domain: string; type: string; set: string; rarity: string }
  onFilterChange: (filters: any) => void
}

const domains: Domain[] = ['Demacia', 'Noxus', 'Ionia', 'Shadow Isles', 'Piltover', 'Zaun', 'Freljord', 'Shurima', 'Targon', 'Bandle City', 'Bilgewater', 'Void', 'Ixtal']
const cardTypes: CardType[] = ['champion', 'unit', 'spell', 'gear']
const sets: SetName[] = ['Origins', 'Unleashed']
const rarities = ['common', 'uncommon', 'rare', 'legendary']

export default function SearchFilters({ cards: _cards, filters, onFilterChange }: Props) {
  const update = (key: string, value: string) => {
    onFilterChange({ ...filters, [key]: value })
  }

  const selectStyle: React.CSSProperties = {
    background: '#1a2340',
    color: '#e2e8f0',
    border: '1px solid #334155',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    fontFamily: 'inherit',
    cursor: 'pointer',
    minWidth: 120,
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
      <input
        placeholder="Buscar carta..."
        value={filters.search}
        onChange={(e) => update('search', e.target.value)}
        style={{
          ...selectStyle,
          flex: 1,
          minWidth: 200,
          cursor: 'text',
        }}
      />

      <select value={filters.domain} onChange={(e) => update('domain', e.target.value)} style={selectStyle}>
        <option value="">Todos los dominios</option>
        {domains.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>

      <select value={filters.type} onChange={(e) => update('type', e.target.value)} style={selectStyle}>
        <option value="">Todos los tipos</option>
        {cardTypes.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>

      <select value={filters.set} onChange={(e) => update('set', e.target.value)} style={selectStyle}>
        <option value="">Todos los sets</option>
        {sets.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <select value={filters.rarity} onChange={(e) => update('rarity', e.target.value)} style={selectStyle}>
        <option value="">Todas las rarezas</option>
        {rarities.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
    </div>
  )
}
