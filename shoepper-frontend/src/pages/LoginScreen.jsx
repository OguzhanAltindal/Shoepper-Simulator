import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { createPlayer } from '../services/api';
import { generateCustomer } from '../data/mockData';

export default function LoginScreen() {
  const { dispatch, notify } = useGame();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!nickname.trim()) { notify('Enter a nickname first!', 'error'); return; }
    setLoading(true);
    try {
      const player = await createPlayer(nickname.trim());
      if (!player?.shop) {
        notify(player?.error || 'Server error — make sure the backend is running and the DB is seeded.', 'error');
        setLoading(false);
        return;
      }
      dispatch({ type: 'SET_PLAYER', payload: player });
      const shopItems = player.shopInventory?.items || [];
      dispatch({ type: 'SET_CUSTOMERS', payload: Array.from({ length: 4 }, () =>
        generateCustomer(player.shop.recognition, shopItems)
      )});
      dispatch({ type: 'SET_SCREEN', payload: 'game' });
    } catch (e) {
      notify('Could not connect to server.', 'error');
    }
    setLoading(false);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <span style={styles.logoIcon}>👟</span>
          <div>
            <div style={styles.logoTitle}>SHOEPPER</div>
            <div style={styles.logoSub}>SIMULATOR</div>
          </div>
        </div>
        <p style={styles.tagline}>Buy low. Sell high. Pay rent. Survive.</p>

        <div style={styles.inputGroup}>
          <label style={styles.label}>YOUR NICKNAME</label>
          <input
            style={styles.input}
            placeholder="e.g. Helush"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            maxLength={30}
            autoFocus
          />
        </div>

        <button
          style={{ ...styles.btn, opacity: loading ? 0.6 : 1 }}
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Open Your Shop →'}
        </button>

        <div style={styles.hints}>
          <div style={styles.hintItem}><span style={styles.hintIcon}>💰</span> Start with $5,000</div>
          <div style={styles.hintItem}><span style={styles.hintIcon}>🏪</span> Basic Shop</div>
          <div style={styles.hintItem}><span style={styles.hintIcon}>📅</span> Pay rent weekly</div>
        </div>
      </div>

      <div style={styles.bg} />
    </div>
  );
}

const C = {
  bg:     '#0F1117',
  card:   '#181C27',
  border: '#252A3A',
  accent: '#6C8EF5',
  gold:   '#F0C040',
  text:   '#E8EAED',
  muted:  '#8890A4',
};

const styles = {
  wrapper: {
    minHeight: '100vh',
    background: C.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'DM Sans', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  bg: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(108,142,245,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 20,
    padding: '48px 44px',
    width: 420,
    maxWidth: '90vw',
    position: 'relative',
    zIndex: 1,
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
  },
  logoRow: {
    display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6,
  },
  logoIcon: { fontSize: 40 },
  logoTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 28, color: C.text, letterSpacing: 3,
    lineHeight: 1,
  },
  logoSub: {
    fontSize: 11, color: C.accent, letterSpacing: 5, fontWeight: 600,
  },
  tagline: {
    color: C.muted, fontSize: 14, margin: '16px 0 32px', fontStyle: 'italic',
  },
  inputGroup: { marginBottom: 16 },
  label: {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: C.muted, letterSpacing: 2, marginBottom: 8,
  },
  input: {
    width: '100%', background: '#0F1117',
    border: `1.5px solid ${C.border}`,
    borderRadius: 10, padding: '12px 16px',
    color: C.text, fontSize: 16,
    outline: 'none', boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.2s',
  },
  btn: {
    width: '100%', background: C.accent,
    border: 'none', borderRadius: 10,
    padding: '14px 0', color: '#fff',
    fontSize: 15, fontWeight: 600,
    cursor: 'pointer', marginTop: 8,
    fontFamily: "'DM Sans', sans-serif",
    transition: 'opacity 0.2s, transform 0.1s',
  },
  hints: {
    display: 'flex', gap: 12, marginTop: 28,
    justifyContent: 'center', flexWrap: 'wrap',
  },
  hintItem: {
    background: '#0F1117', borderRadius: 8,
    padding: '6px 12px', fontSize: 12, color: C.muted,
    border: `1px solid ${C.border}`,
  },
  hintIcon: { marginRight: 4 },
};
