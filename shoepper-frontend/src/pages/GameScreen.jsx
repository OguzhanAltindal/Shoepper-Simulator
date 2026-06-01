import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import StatusBar from '../components/StatusBar';
import CustomerCard from '../components/CustomerCard';
import InventoryPanel from '../components/InventoryPanel';
import SkillsPanel from '../components/SkillsPanel';
import TradeModal from '../components/TradeModal';
import UpgradeModal from '../components/UpgradeModal';
import RentPaidModal from '../components/RentPaidModal';
import { useTaskTimer } from '../hooks/useTaskTimer';

const TABS = [
  { id: 'customers',  label: '👥 Customers'  },
  { id: 'inventory',  label: '📦 Inventory'  },
  { id: 'craft',      label: '⚒️ Craft & Skills' },
];

export default function GameScreen() {
  const { state, dispatch } = useGame();
  const { player, customers, activeModal, activeTab, customerEvent, rentEvent } = state;
  useTaskTimer();

  const seenCustomerRef = useRef(null);

  // When a buying customer becomes active, assign them an actual shop item
  useEffect(() => {
    const current = customers[0];
    if (!current || current._id === seenCustomerRef.current) return;
    seenCustomerRef.current = current._id;

    if (!current.wantsToBuy) return;
    const shopItems = player?.shopInventory?.items || [];
    if (shopItems.length === 0) return;

    const shopItem = shopItems[Math.floor(Math.random() * shopItems.length)];
    dispatch({
      type: 'SET_CUSTOMERS',
      payload: [{ ...current, offeredItem: shopItem }, ...customers.slice(1)],
    });
  }, [customers[0]?._id]);

  if (!player || !player.shop) return null;

  const currentCustomer = customers[0] || null;

  return (
    <div style={styles.root}>
      <StatusBar />

      {/* Tab bar */}
      <div style={styles.tabBar}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}
            onClick={() => dispatch({ type: 'SET_TAB', payload: tab.id })}
          >
            {tab.label}
            {tab.id === 'customers' && customers.length > 0 && (
              <span style={styles.tabBadge}>{customers.length}</span>
            )}
          </button>
        ))}

        <div style={styles.shopInfo}>
          <span style={styles.shopMeta}>🧲 {player.shop?.attraction_rate}/day</span>
          <span style={styles.shopMeta}>⭐ Recognition {player.shop?.recognition}</span>
          <button style={styles.upgradeBtn} onClick={() => dispatch({ type: 'SET_MODAL', payload: 'upgrade' })}>
            ⬆ Upgrade
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div style={styles.body}>

        {/* ── CUSTOMERS TAB ── */}
        {activeTab === 'customers' && (
          <div style={styles.customerTab}>
            {/* Inline customer event message */}
            {customerEvent && (
              <div style={{ ...styles.eventMsg, borderColor: customerEvent.type === 'error' ? '#F87171' : customerEvent.type === 'success' ? '#52B788' : '#6C8EF5' }}>
                <span style={{ color: customerEvent.type === 'error' ? '#F87171' : customerEvent.type === 'success' ? '#52B788' : '#6C8EF5', fontSize: 18 }}>
                  {customerEvent.type === 'error' ? '😠' : customerEvent.type === 'success' ? '🤝' : 'ℹ️'}
                </span>
                {customerEvent.message}
              </div>
            )}

            {customers.length === 0 && !customerEvent ? (
              <div style={styles.emptyFloor}>
                <div style={styles.emptyIcon}>🚪</div>
                <div style={styles.emptyText}>No customers today.</div>
                <div style={styles.emptyHint}>Click "Next Day" to bring in new customers.</div>
              </div>
            ) : currentCustomer ? (
              <div style={styles.reinksWrap}>
                <div style={styles.queueInfo}>
                  Customer <strong>{customers.length > 1 ? `1 of ${customers.length}` : '(last one)'}</strong> — deal with them to see the next.
                </div>
                <CustomerCard customer={currentCustomer} />
              </div>
            ) : null}
          </div>
        )}

        {/* ── INVENTORY TAB ── */}
        {activeTab === 'inventory' && (
          <div style={styles.inventoryTab}>
            <InventoryPanel type="player" />
            <div style={styles.invDivider} />
            <InventoryPanel type="shop" />
          </div>
        )}

        {/* ── CRAFT & SKILLS TAB ── */}
        {activeTab === 'craft' && (
          <div style={styles.craftTab}>
            <SkillsPanel />
          </div>
        )}
      </div>

      {activeModal === 'trade'   && <TradeModal />}
      {activeModal === 'upgrade' && <UpgradeModal />}
      {rentEvent && <RentPaidModal />}
    </div>
  );
}

const C = {
  bg:     '#0F1117',
  panel:  '#181C27',
  border: '#252A3A',
  accent: '#6C8EF5',
  text:   '#E8EAED',
  muted:  '#8890A4',
};

const styles = {
  root: {
    minHeight: '100vh', background: C.bg,
    fontFamily: "'DM Sans', sans-serif",
    display: 'flex', flexDirection: 'column',
  },
  tabBar: {
    display: 'flex', alignItems: 'center', gap: 4,
    background: C.panel, borderBottom: `1px solid ${C.border}`,
    padding: '0 16px', height: 48,
  },
  tab: {
    background: 'none', border: 'none',
    borderBottom: '2px solid transparent',
    padding: '0 16px', height: '100%',
    color: C.muted, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    display: 'flex', alignItems: 'center', gap: 6,
    transition: 'color 0.2s, border-color 0.2s',
  },
  tabActive: {
    color: C.accent, borderBottomColor: C.accent,
  },
  tabBadge: {
    background: C.accent, color: '#fff',
    borderRadius: 10, padding: '1px 7px',
    fontSize: 11, fontWeight: 700,
  },
  shopInfo: {
    marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12,
  },
  shopMeta: { fontSize: 12, color: C.muted },
  upgradeBtn: {
    background: C.border, border: `1px solid #3A4255`,
    borderRadius: 8, padding: '5px 12px',
    color: C.text, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  },
  body: {
    flex: 1, overflow: 'auto',
    display: 'flex', flexDirection: 'column',
  },

  // Customers tab
  customerTab: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'flex-start',
    padding: '32px 24px', gap: 20,
    maxWidth: 640, margin: '0 auto', width: '100%',
  },
  eventMsg: {
    width: '100%', background: C.panel,
    border: '1px solid', borderRadius: 14,
    padding: '18px 24px', fontSize: 15, fontWeight: 600,
    color: C.text, display: 'flex', alignItems: 'center', gap: 12,
    animation: 'fadeIn 0.2s ease',
  },
  reinksWrap: {
    width: '100%', display: 'flex', flexDirection: 'column', gap: 12,
  },
  queueInfo: {
    fontSize: 12, color: C.muted, textAlign: 'center',
  },
  emptyFloor: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 10, padding: 60, width: '100%',
    background: C.panel, borderRadius: 16,
    border: `1px dashed ${C.border}`,
  },
  emptyIcon: { fontSize: 52, opacity: 0.4 },
  emptyText: { fontSize: 17, color: C.muted, fontFamily: "'DM Serif Display', serif" },
  emptyHint: { fontSize: 13, color: '#3A4255' },

  // Inventory tab
  inventoryTab: {
    display: 'flex', flex: 1,
    padding: 20, gap: 20,
  },
  invDivider: {
    width: 1, background: C.border, flexShrink: 0,
  },

  // Craft tab
  craftTab: {
    flex: 1, padding: 20, maxWidth: 700, margin: '0 auto', width: '100%',
  },
};
