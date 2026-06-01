import React from 'react';
import { useGame } from '../context/GameContext';

export default function RentPaidModal() {
  const { state, dispatch } = useGame();
  const { rentEvent, player } = state;
  if (!rentEvent) return null;

  const close = () => dispatch({ type: 'CLEAR_RENT_EVENT' });
  const broke = rentEvent.budgetAfter < 0;

  return (
    <div style={styles.overlay} onClick={close}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.icon}>{broke ? '😰' : '🏠'}</div>

        <div style={styles.week}>Week {rentEvent.week} begins</div>
        <div style={styles.headline}>
          {broke ? 'You can\'t pay the rent!' : 'Rent paid!'}
        </div>

        <div style={styles.row}>
          <span style={styles.label}>Rent paid</span>
          <span style={{ ...styles.value, color: '#F87171' }}>
            −${rentEvent.amount.toLocaleString()}
          </span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Budget remaining</span>
          <span style={{ ...styles.value, color: rentEvent.budgetAfter < 500 ? '#F87171' : '#52B788' }}>
            ${rentEvent.budgetAfter.toLocaleString()}
          </span>
        </div>

        {player?.shop && (
          <div style={styles.shopRow}>
            <span style={styles.shopIcon}>🏪</span>
            <span style={styles.shopName}>{player.shop.shop_name}</span>
            <span style={styles.shopRent}>Next rent in 7 days</span>
          </div>
        )}

        <button style={styles.btn} onClick={close}>
          {broke ? 'Game Over →' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 300, backdropFilter: 'blur(6px)',
  },
  modal: {
    background: '#181C27', border: '1px solid #252A3A',
    borderRadius: 24, padding: '40px 44px',
    width: 380, maxWidth: '92vw',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
    textAlign: 'center',
    fontFamily: "'DM Sans', sans-serif",
  },
  icon: { fontSize: 56, lineHeight: 1 },
  week: { fontSize: 12, fontWeight: 700, color: '#6C8EF5', letterSpacing: 2, textTransform: 'uppercase' },
  headline: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 28, color: '#E8EAED', marginBottom: 4,
  },
  row: {
    width: '100%', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', background: '#1E2235',
    borderRadius: 10, padding: '12px 18px',
  },
  label: { fontSize: 13, color: '#8890A4' },
  value: { fontSize: 18, fontWeight: 700 },
  shopRow: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    background: '#1E2235', borderRadius: 10, padding: '10px 18px',
  },
  shopIcon: { fontSize: 20 },
  shopName: { flex: 1, fontSize: 13, color: '#E8EAED', fontWeight: 600, textAlign: 'left' },
  shopRent: { fontSize: 11, color: '#8890A4' },
  btn: {
    marginTop: 8, width: '100%', background: '#6C8EF5',
    border: 'none', borderRadius: 12, padding: '14px 0',
    color: '#fff', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  },
};
