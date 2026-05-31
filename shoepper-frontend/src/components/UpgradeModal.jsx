import React from 'react';
import { useGame } from '../context/GameContext';
import { upgradeShop } from '../services/api';
import { SHOPS } from '../data/mockData';

export default function UpgradeModal() {
  const { state, dispatch, notify } = useGame();
  const { player } = state;
  if (!player) return null;

  const close = () => dispatch({ type: 'SET_MODAL', payload: null });

  const handleUpgrade = async (shop) => {
    if (shop.shop_name === player.shop.shop_name) return;
    if (player.budget < shop.rent * 2) {
      notify(`Need at least $${(shop.rent * 2).toLocaleString()} to upgrade!`, 'error');
      return;
    }
    const updated = await upgradeShop(player, shop.shop_name);
    dispatch({ type: 'SET_PLAYER', payload: updated });
    notify(`Upgraded to ${shop.shop_name}! 🎉`, 'success');
    close();
  };

  return (
    <div style={styles.overlay} onClick={close}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.title}>⬆ Upgrade Your Shop</div>
          <button style={styles.closeBtn} onClick={close}>✕</button>
        </div>

        <div style={styles.cards}>
          {SHOPS.map(shop => {
            const isCurrent = shop.shop_name === player.shop.shop_name;
            const canAfford = player.budget >= shop.rent * 2;
            return (
              <div
                key={shop.shop_name}
                style={{ ...styles.shopCard, ...(isCurrent ? styles.currentCard : {}), ...(!canAfford && !isCurrent ? styles.lockedCard : {}) }}
                onClick={() => handleUpgrade(shop)}
              >
                {isCurrent && <div style={styles.currentBadge}>CURRENT</div>}
                <div style={styles.shopIcon}>🏪</div>
                <div style={styles.shopName}>{shop.shop_name}</div>
                <div style={styles.shopStats}>
                  <Stat icon="🧲" label="Attraction" value={`${shop.attraction_rate}/day`} />
                  <Stat icon="⭐" label="Recognition" value={shop.recognition} />
                  <Stat icon="🏠" label="Rent/week"   value={`$${shop.rent.toLocaleString()}`} />
                </div>
                {!isCurrent && (
                  <div style={{ ...styles.upgradeBtn, opacity: canAfford ? 1 : 0.4 }}>
                    {canAfford ? 'Select →' : `Need $${(shop.rent * 2).toLocaleString()}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0', borderBottom: '1px solid #252A3A' }}>
      <span style={{ color: '#8890A4' }}>{icon} {label}</span>
      <span style={{ color: '#E8EAED', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, backdropFilter: 'blur(4px)',
  },
  modal: {
    background: '#181C27', border: '1px solid #252A3A',
    borderRadius: 20, padding: 28, width: 640,
    maxWidth: '95vw',
    boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#E8EAED' },
  closeBtn: { background: 'none', border: 'none', color: '#8890A4', fontSize: 18, cursor: 'pointer' },
  cards: { display: 'flex', gap: 16 },
  shopCard: {
    flex: 1, background: '#1E2235', border: '1px solid #252A3A',
    borderRadius: 14, padding: 18, cursor: 'pointer',
    display: 'flex', flexDirection: 'column', gap: 10,
    transition: 'border-color 0.2s',
  },
  currentCard: { borderColor: '#6C8EF5', background: '#1E2235' },
  lockedCard: { opacity: 0.6, cursor: 'default' },
  currentBadge: {
    fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
    color: '#6C8EF5', background: '#6C8EF511',
    border: '1px solid #6C8EF544', borderRadius: 5,
    padding: '2px 8px', alignSelf: 'flex-start',
  },
  shopIcon: { fontSize: 32, textAlign: 'center' },
  shopName: { fontFamily: "'DM Serif Display', serif", fontSize: 16, color: '#E8EAED', textAlign: 'center' },
  shopStats: { display: 'flex', flexDirection: 'column', gap: 0 },
  upgradeBtn: {
    textAlign: 'center', fontSize: 13, fontWeight: 600,
    color: '#6C8EF5', paddingTop: 8, borderTop: '1px solid #252A3A',
  },
};
