import React from 'react';
import { useGame } from '../context/GameContext';

export default function GameOverScreen() {
  const { state, dispatch } = useGame();
  const { player } = state;

  const handleRestart = () => {
    dispatch({ type: 'SET_PLAYER', payload: null });
    dispatch({ type: 'SET_CUSTOMERS', payload: [] });
    dispatch({ type: 'SET_SCREEN', payload: 'login' });
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.icon}>💸</div>
        <div style={styles.title}>GAME OVER</div>
        <div style={styles.subtitle}>You couldn't pay the rent.</div>

        {player && (
          <div style={styles.stats}>
            <Stat label="Player"   value={player.nickname} />
            <Stat label="Days"     value={player.day} />
            <Stat label="Budget"   value={`$${player.budget.toFixed(2)}`} danger />
            <Stat label="Shop"     value={player.shop.shop_name} />
          </div>
        )}

        <button style={styles.btn} onClick={handleRestart}>
          Try Again →
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, danger }) {
  return (
    <div style={styles.statRow}>
      <span style={styles.statLabel}>{label}</span>
      <span style={{ ...styles.statValue, color: danger ? '#F87171' : '#E8EAED' }}>{value}</span>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh', background: '#0F1117',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    background: '#181C27', border: '1px solid #252A3A',
    borderRadius: 20, padding: '48px 44px', width: 380,
    textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16,
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
  },
  icon: { fontSize: 56 },
  title: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 36, color: '#F87171', letterSpacing: 4,
  },
  subtitle: { color: '#8890A4', fontSize: 15, marginBottom: 8 },
  stats: {
    background: '#0F1117', borderRadius: 12, padding: '14px 18px',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  statRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13 },
  statLabel: { color: '#8890A4', fontWeight: 500 },
  statValue: { fontWeight: 700, color: '#E8EAED' },
  btn: {
    background: '#6C8EF5', border: 'none',
    borderRadius: 10, padding: '13px 0',
    color: '#fff', fontSize: 15, fontWeight: 600,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    marginTop: 8,
  },
};
