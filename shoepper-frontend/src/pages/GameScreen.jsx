import React from 'react';
import { useGame } from '../context/GameContext';
import StatusBar from '../components/StatusBar';
import CustomerCard from '../components/CustomerCard';
import InventoryPanel from '../components/InventoryPanel';
import SkillsPanel from '../components/SkillsPanel';
import TradeModal from '../components/TradeModal';
import UpgradeModal from '../components/UpgradeModal';
import { useTaskTimer } from '../hooks/useTaskTimer';

export default function GameScreen() {
  const { state, dispatch } = useGame();
  const { player, customers, activeModal } = state;
  useTaskTimer();

  if (!player) return null;

  return (
    <div style={styles.root}>
      <StatusBar />

      <div style={styles.body}>
        {/* Left: Player Inventory + Skills */}
        <div style={styles.leftCol}>
          <InventoryPanel type="player" />
          <SkillsPanel />
        </div>

        {/* Center: Shop floor */}
        <div style={styles.center}>
          <div style={styles.shopHeader}>
            <div style={styles.shopTitle}>{player.shop.shop_name}</div>
            <div style={styles.shopMeta}>
              <span>🧲 {player.shop.attraction_rate} customers/day</span>
              <span>⭐ Recognition {player.shop.recognition}</span>
            </div>
          </div>

          {/* Customer floor */}
          <div style={styles.customerSection}>
            <div style={styles.sectionLabel}>
              👥 Customers Today
              <span style={styles.count}>{customers.length}</span>
            </div>
            {customers.length === 0 ? (
              <div style={styles.emptyFloor}>
                <div style={styles.emptyIcon}>🚪</div>
                <div style={styles.emptyText}>No customers yet.</div>
                <div style={styles.emptyHint}>Click "Next Day" to start a new day.</div>
              </div>
            ) : (
              <div style={styles.customerGrid}>
                {customers.map((c, i) => (
                  <CustomerCard key={`${c.customer_name}-${i}`} customer={c} />
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div style={styles.actions}>
            <ActionBtn icon="⬆" label="Upgrade Shop" onClick={() => dispatch({ type: 'SET_MODAL', payload: 'upgrade' })} />
          </div>
        </div>

        {/* Right: Shop Inventory */}
        <div style={styles.rightCol}>
          <InventoryPanel type="shop" />
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'trade'   && <TradeModal />}
      {activeModal === 'upgrade' && <UpgradeModal />}
    </div>
  );
}

function ActionBtn({ icon, label, onClick }) {
  return (
    <button style={styles.actionBtn} onClick={onClick}>
      {icon} {label}
    </button>
  );
}

const styles = {
  root: {
    minHeight: '100vh', background: '#0F1117',
    fontFamily: "'DM Sans', sans-serif",
    display: 'flex', flexDirection: 'column',
  },
  body: {
    flex: 1, display: 'flex', gap: 0,
    padding: 0, overflow: 'hidden',
    height: 'calc(100vh - 64px)',
  },
  leftCol: {
    width: 260, minWidth: 220, borderRight: '1px solid #252A3A',
    padding: 12, display: 'flex', flexDirection: 'column', gap: 10,
    overflowY: 'auto', background: '#0F1117',
  },
  center: {
    flex: 1, display: 'flex', flexDirection: 'column',
    padding: 24, gap: 20, overflowY: 'auto',
  },
  rightCol: {
    width: 260, minWidth: 220, borderLeft: '1px solid #252A3A',
    padding: 12, overflowY: 'auto', background: '#0F1117',
  },
  shopHeader: {
    background: '#181C27', border: '1px solid #252A3A',
    borderRadius: 16, padding: '18px 24px',
  },
  shopTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 24, color: '#E8EAED', marginBottom: 6,
  },
  shopMeta: {
    display: 'flex', gap: 20, fontSize: 12, color: '#8890A4',
  },
  customerSection: {
    flex: 1, display: 'flex', flexDirection: 'column', gap: 14,
  },
  sectionLabel: {
    fontSize: 12, fontWeight: 600, color: '#8890A4',
    letterSpacing: 1.5, textTransform: 'uppercase',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  count: {
    background: '#252A3A', borderRadius: 12,
    padding: '1px 8px', fontSize: 11, color: '#6C8EF5',
  },
  customerGrid: {
    display: 'flex', flexWrap: 'wrap', gap: 12,
    alignContent: 'flex-start',
  },
  emptyFloor: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 60,
    background: '#181C27', borderRadius: 16,
    border: '1px dashed #252A3A',
  },
  emptyIcon: { fontSize: 48, opacity: 0.4 },
  emptyText: { fontSize: 16, color: '#8890A4', fontFamily: "'DM Serif Display', serif" },
  emptyHint: { fontSize: 13, color: '#3A4255' },
  actions: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  actionBtn: {
    background: '#181C27', border: '1px solid #252A3A',
    borderRadius: 10, padding: '10px 18px',
    color: '#E8EAED', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    transition: 'background 0.2s',
  },
};
