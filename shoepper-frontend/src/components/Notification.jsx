import React from 'react';
import { useGame } from '../context/GameContext';

const TYPE_COLORS = {
  success: { bg: '#52B788', border: '#52B78844' },
  error:   { bg: '#F87171', border: '#F8717144' },
  info:    { bg: '#6C8EF5', border: '#6C8EF544' },
};

export default function Notification() {
  const { state } = useGame();
  const { notification } = state;

  if (!notification) return null;

  const colors = TYPE_COLORS[notification.type] || TYPE_COLORS.info;

  return (
    <div style={{ ...styles.toast, background: '#181C27', borderLeft: `3px solid ${colors.bg}` }}>
      <span style={{ color: colors.bg }}>●</span>
      <span style={styles.msg}>{notification.message}</span>
    </div>
  );
}

const styles = {
  toast: {
    position: 'fixed', bottom: 24, right: 24,
    border: '1px solid #252A3A',
    borderRadius: 12, padding: '12px 18px',
    display: 'flex', alignItems: 'center', gap: 10,
    zIndex: 300, maxWidth: 360,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    animation: 'fadeIn 0.2s ease',
    fontFamily: "'DM Sans', sans-serif",
  },
  msg: { fontSize: 13, color: '#E8EAED', fontWeight: 500 },
};
