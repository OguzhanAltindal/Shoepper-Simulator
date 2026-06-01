import React from 'react';
import { useGame } from '../context/GameContext';
import { ITEM_RELATIONS, BRANDED_ITEMS, SIGNED_ITEMS, SPECIAL_EDITION_ITEMS } from '../data/mockData';
import { calcItemPrice } from '../services/api';

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

  const item = customer.offeredItem;
  const itemName = item
    ? (item.item_name || ITEM_RELATIONS.find(r => r.item_id === item.item_id)?.item_name || '?')
    : '?';

  const branded = item ? BRANDED_ITEMS.find(b => b.item_id === item.item_id) : null;
  const signed  = item ? SIGNED_ITEMS.find(s => s.item_id === item.item_id) : null;
  const special = item ? SPECIAL_EDITION_ITEMS.find(s => s.item_id === item.item_id) : null;
  const estPrice = item ? calcItemPrice(item, item) : 0;

  return (
    <div style={styles.card}>
      {/* Avatar + name */}
      <div style={styles.top}>
        <div style={styles.avatar}>{MOOD_EMOJI[customer.mood] || '🙂'}</div>
        <div style={styles.nameBlock}>
          <div style={styles.name}>{customer.customer_name}</div>
          <div style={styles.intention}>
            {customer.wantsToBuy ? '🛒 Wants to buy from you' : '💼 Wants to sell to you'}
          </div>
        </div>
      </div>

      {/* Traits */}
      <div style={styles.traits}>
        <TraitBar label="Patience" value={customer.patience} max={10} color={patienceColor} />
        <TraitBar label="Greed"    value={customer.greed}    max={10} color={greedColor}    />
      </div>

      {/* Item info */}
      {item && (
        <div style={styles.itemCard}>
          <div style={styles.itemIcon}>👟</div>
          <div style={styles.itemBody}>
            <div style={styles.itemName}>
              {branded ? `${branded.brand_name} ` : ''}{itemName}
              {signed ? ` (${signed.celeb_name})` : ''}
              {(item.amount > 1) ? ` ×${item.amount}` : ''}
            </div>
            <div style={styles.itemMeta}>
              <span style={{ color: item.condition >= 70 ? '#52B788' : item.condition >= 40 ? '#F0C040' : '#F87171' }}>
                Condition {item.condition}/100
              </span>
              {item.is_replica && <span style={styles.replica}>REPLICA</span>}
              {special && <span style={{ color: '#A78BFA', fontSize: 11 }}>⭐ {special.s_edition_name}</span>}
            </div>
          </div>
          <div style={styles.priceHint}>
            <div style={styles.priceLabel}>~Value</div>
            <div style={styles.priceVal}>${(estPrice * (item.amount || 1)).toLocaleString()}</div>
          </div>
        </div>
      )}

      <button style={styles.tradeBtn} onClick={handleClick}>
        Trade with {customer.customer_name} →
      </button>
    </div>
  );
}

function TraitBar({ label, value, max, color }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#8890A4', letterSpacing: 0.5 }}>{label}</span>
        <span style={{ fontSize: 11, color, fontWeight: 700 }}>{value}/{max}</span>
      </div>
      <div style={{ background: '#252A3A', borderRadius: 6, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${(value / max) * 100}%`, background: color, height: '100%', borderRadius: 6, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: '#181C27', border: '1px solid #252A3A',
    borderRadius: 20, padding: 28,
    display: 'flex', flexDirection: 'column', gap: 20,
    width: '100%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  top: { display: 'flex', alignItems: 'center', gap: 18 },
  avatar: { fontSize: 52, lineHeight: 1 },
  nameBlock: { display: 'flex', flexDirection: 'column', gap: 4 },
  name: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 26, color: '#E8EAED',
  },
  intention: { fontSize: 13, color: '#8890A4' },
  traits: { display: 'flex', gap: 16 },
  itemCard: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: '#1E2235', border: '1px solid #252A3A',
    borderRadius: 14, padding: '14px 18px',
  },
  itemIcon: { fontSize: 32, flexShrink: 0 },
  itemBody: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: 600, color: '#E8EAED', marginBottom: 4 },
  itemMeta: { display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 },
  replica: { color: '#8890A4', border: '1px solid #3A4255', borderRadius: 4, padding: '1px 5px', fontSize: 10 },
  priceHint: { textAlign: 'right', flexShrink: 0 },
  priceLabel: { fontSize: 10, color: '#8890A4', letterSpacing: 1, textTransform: 'uppercase' },
  priceVal: { fontSize: 20, fontWeight: 700, color: '#F0C040' },
  tradeBtn: {
    background: '#6C8EF5', border: 'none',
    borderRadius: 12, padding: '14px 0',
    color: '#fff', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    transition: 'opacity 0.2s',
    width: '100%',
  },
};
