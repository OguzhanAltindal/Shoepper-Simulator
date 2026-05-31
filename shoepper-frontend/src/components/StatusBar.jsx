import React from 'react';
import { useGame } from '../context/GameContext';
import { advanceDay } from '../services/api';

export default function StatusBar() {
  const { state, dispatch, notify } = useGame();
  const { player } = state;
  if (!player) return null;

  const rentDanger = player.daysUntilRent <= 2;

  const handleNextDay = async () => {
    const updated = await advanceDay(player);
    dispatch({ type: 'SET_PLAYER', payload: updated });
    dispatch({ type: 'SET_CUSTOMERS', payload: updated.customers || [] });
    if (updated.gameOver) {
      dispatch({ type: 'SET_SCREEN', payload: 'gameover' });
    } else if (updated.daysUntilRent === 7 && updated.week > player.week) {
      notify(`Week ${updated.week} — Rent of $${player.shop.rent.toLocaleString()} paid!`, 'info');
    } else {
      notify(`Day ${updated.day} begins. ${updated.customers?.length || 0} customers incoming.`, 'info');
    }
  };

  return (
    <div style={styles.bar}>
      <div style={styles.left}>
        <div style={styles.shopName}>{player.shop.shop_name}</div>
        <div style={styles.playerName}>👤 {player.nickname}</div>
      </div>

      <div style={styles.center}>
        <Stat icon="💰" label="Budget" value={`$${player.budget.toLocaleString()}`} />
        <Divider />
        <Stat icon="📅" label="Day" value={player.day} />
        <Divider />
        <Stat icon="📆" label="Week" value={player.week} />
        <Divider />
        <Stat
          icon="🏠"
          label="Rent due"
          value={`${player.daysUntilRent}d`}
          danger={rentDanger}
          sub={`$${player.shop.rent.toLocaleString()}`}
        />
      </div>

      <div style={styles.right}>
        <button style={styles.nextBtn} onClick={handleNextDay}>
          Next Day ›
        </button>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, danger, sub }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statLabel}>{icon} {label}</div>
      <div style={{ ...styles.statValue, color: danger ? '#F87171' : '#E8EAED' }}>
        {value}
        {sub && <span style={styles.statSub}> / {sub}</span>}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={styles.divider} />;
}

const styles = {
  bar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#181C27', borderBottom: '1px solid #252A3A',
    padding: '0 24px', height: 64, position: 'sticky', top: 0, zIndex: 100,
    gap: 16,
  },
  left: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 160 },
  shopName: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 15, color: '#6C8EF5', letterSpacing: 0.5,
  },
  playerName: { fontSize: 12, color: '#8890A4' },
  center: { display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' },
  stat: { textAlign: 'center', padding: '0 12px' },
  statLabel: { fontSize: 10, color: '#8890A4', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' },
  statValue: { fontSize: 15, fontWeight: 700, color: '#E8EAED', lineHeight: 1.3 },
  statSub: { fontSize: 11, color: '#8890A4', fontWeight: 400 },
  divider: { width: 1, height: 32, background: '#252A3A' },
  right: {},
  nextBtn: {
    background: '#252A3A', border: '1px solid #3A4255',
    borderRadius: 8, padding: '8px 18px',
    color: '#E8EAED', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    transition: 'background 0.2s',
  },
};
