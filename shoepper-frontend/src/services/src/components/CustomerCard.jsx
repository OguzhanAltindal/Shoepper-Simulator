import React from 'react';
import { useGame } from '../context/GameContext';

const MOOD_EMOJI = { neutral: '🙂', happy: '😄', angry: '😠', thinking: '🤔' };

export default function CustomerCard({ customer }) {
  const { dispatch } = useGame();

  const handleClick = () => {
    dispatch({ type: 'SET_SELECTED_CUSTOMER', payload: customer });
  };

  const patienceColor = customer.patience >= 6 ? '#52B788'
    : customer.patience >= 3 ? '#F0C040' : '#F87171';

  const greedColor = customer.greed >= 7 ? '#F87171'
    : customer.greed >= 4 ? '#F0C040' : '#52B788';

  return (
    <div style={styles.card} onClick={handleClick}>
      <div style={styles.avatar}>
        {MOOD_EMOJI[customer.mood] || '🙂'}
      </div>
      <div style={styles.name}>{customer.customer_name}</div>
      <div style={styles.intention}>
        {customer.wantsToBuy ? '🛒 Wants to buy' : '💼 Wants to sell'}
      </div>

      <div style={styles.traitRow}>
        <TraitBar label="Patience" value={customer.patience} max={10} color={patienceColor} />
        <TraitBar label="Greed"    value={customer.greed}    max={10} color={greedColor}    />
      </div>

      <div style={styles.itemPreview}>
        <span style={styles.itemDot} />
        {customer.offeredItem.item_name}
        <span style={styles.condition}> · {customer.offeredItem.condition}/100</span>
      </div>

      <div style={styles.cta}>Trade →</div>
    </div>
  );
}

function TraitBar({ label, value, max, color }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: '#8890A4', letterSpacing: 0.5 }}>{label}</span>
        <span style={{ fontSize: 10, color, fontWeight: 700 }}>{value}/{max}</span>
      </div>
      <div style={{ background: '#252A3A', borderRadius: 4, height: 4, overflow: 'hidden' }}>
        <div style={{ width: `${(value / max) * 100}%`, background: color, height: '100%', borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: '#1E2235', border: '1px solid #252A3A',
    borderRadius: 14, padding: 16, cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex', flexDirection: 'column', gap: 8,
    minWidth: 140,
  },
  avatar: { fontSize: 28, textAlign: 'center' },
  name: {
    textAlign: 'center', fontWeight: 700,
    fontSize: 14, color: '#E8EAED',
    fontFamily: "'DM Serif Display', serif",
  },
  intention: { fontSize: 11, color: '#8890A4', textAlign: 'center' },
  traitRow: { display: 'flex', gap: 8 },
  itemPreview: {
    fontSize: 11, color: '#8890A4',
    background: '#0F1117', borderRadius: 6,
    padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4,
  },
  itemDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#6C8EF5', flexShrink: 0,
  },
  condition: { color: '#8890A4' },
  cta: {
    textAlign: 'center', fontSize: 12, fontWeight: 600,
    color: '#6C8EF5', marginTop: 4,
  },
};
