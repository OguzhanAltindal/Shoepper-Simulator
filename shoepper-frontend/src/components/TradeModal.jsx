import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { calcItemPrice, processTransaction } from '../services/api';
import { BRANDED_ITEMS, SPECIAL_EDITION_ITEMS, SIGNED_ITEMS } from '../data/mockData';

export default function TradeModal() {
  const { state, dispatch, notify } = useGame();
  const { selectedCustomer: customer, player } = state;

  // ============ HOOKS (must be unconditional, before early returns) ============

  // For SELL: player picks a shop item; for BUY: customer's offered item is the trade item
  const [selectedShopItemIdx, setSelectedShopItemIdx] = useState(0);

  // Keep idx in bounds when shop inventory changes
  useEffect(() => {
    const len = player?.shopInventory.items.length || 0;
    if (selectedShopItemIdx >= len && len > 0) {
      setSelectedShopItemIdx(0);
    }
  }, [player?.shopInventory.items.length, selectedShopItemIdx]);

  // The item being traded
  const tradedItem = customer
    ? customer.wantsToBuy
      ? player?.shopInventory.items[selectedShopItemIdx] || null
      : customer.offeredItem
    : null;

  const truePrice = useMemo(
    () => (tradedItem ? calcItemPrice(tradedItem, tradedItem) : 0),
    [tradedItem?.item_id, tradedItem?.condition, tradedItem?.is_replica]
  );

  const intelligenceLv = player?.stats.find(s => s.stat_name === 'intelligence')?.stat_level || 1;

  // Estimated price - error decreases with intelligence (memoized so it doesn't re-randomize)
  const estimatedPrice = useMemo(() => {
    if (!truePrice) return 0;
    const error = Math.max(0, (10 - intelligenceLv) * 0.08);
    const offset = (Math.random() - 0.5) * error;
    return Math.round(truePrice * (1 + offset));
  }, [truePrice, intelligenceLv]);

  const minOffer = Math.round(truePrice * 0.4) || 1;
  const maxOffer = Math.round(truePrice * 2.5) || 10;

  const [yourOffer, setYourOffer] = useState(0);
  const [patienceLeft, setPatienceLeft] = useState(0);
  const [round, setRound] = useState(0);
  const [customerOffer, setCustomerOffer] = useState(0);

  // Initialize trade when customer/item changes
  useEffect(() => {
    if (!customer || !tradedItem) return;
    setPatienceLeft(customer.patience);
    setRound(0);

    if (customer.wantsToBuy) {
      // Customer offers low (their initial bid)
      const initial = Math.round(truePrice * (0.6 - customer.greed * 0.03));
      setCustomerOffer(Math.max(minOffer, initial));
      setYourOffer(Math.round(truePrice * 1.1));
    } else {
      // Customer wants to sell — they ask high
      const initial = Math.round(truePrice * (1.4 + customer.greed * 0.04));
      setCustomerOffer(Math.min(maxOffer, initial));
      setYourOffer(Math.round(truePrice * 0.9));
    }
  }, [customer, selectedShopItemIdx]);

  // ============ EARLY RETURN AFTER HOOKS ============
  if (!customer) return null;

  // No item to trade: customer wants to buy but shop is empty
  if (!tradedItem) {
    return (
      <div style={styles.overlay} onClick={() => dispatch({ type: 'SET_SELECTED_CUSTOMER', payload: null })}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <span style={styles.avatarBig}>🙂</span>
              <div>
                <div style={styles.customerName}>{customer.customer_name}</div>
                <div style={styles.intent}>🛒 Wants to buy from you</div>
              </div>
            </div>
            <button style={styles.closeBtn} onClick={() => dispatch({ type: 'SET_SELECTED_CUSTOMER', payload: null })}>✕</button>
          </div>
          <div style={styles.emptyState}>
            <div style={{ fontSize: 36, opacity: 0.5 }}>📭</div>
            <div style={{ color: '#8890A4', fontSize: 14, marginTop: 12 }}>
              No items in your shop inventory.
            </div>
            <div style={{ color: '#8890A4', fontSize: 12, marginTop: 6 }}>
              Move items from your player inventory to the shop first.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const branded = BRANDED_ITEMS.find(b => b.item_id === tradedItem.item_id);
  const special = SPECIAL_EDITION_ITEMS.find(s => s.item_id === tradedItem.item_id);
  const signed  = SIGNED_ITEMS.find(s => s.item_id === tradedItem.item_id);

  const conditionLabel = tradedItem.condition >= 80 ? 'Excellent'
    : tradedItem.condition >= 60 ? 'Good'
    : tradedItem.condition >= 40 ? 'Fair' : 'Poor';
  const conditionColor = tradedItem.condition >= 80 ? '#52B788'
    : tradedItem.condition >= 60 ? '#F0C040'
    : tradedItem.condition >= 40 ? '#FB923C' : '#F87171';
  const getRarityColor = r => r === 'legendary' ? '#F0C040' : r === 'rare' ? '#A78BFA' : '#8890A4';

  const close = () => dispatch({ type: 'SET_SELECTED_CUSTOMER', payload: null });

  const handleCounter = () => {
    const newPatience = patienceLeft - 1;
    setPatienceLeft(newPatience);
    setRound(r => r + 1);

    if (newPatience <= 0) {
      notify(`${customer.customer_name} lost patience and left!`, 'error');
      dispatch({ type: 'REMOVE_CUSTOMER', payload: customer.customer_name });
      return;
    }

    // Customer adjusts offer toward player (limited by greed/charisma)
    const charismaEffect = (player?.stats.find(s => s.stat_name === 'charisma')?.stat_level || 1) * 0.005;
    const greedFactor = Math.max(0.1, 1 - (customer.greed * 0.04) + charismaEffect);
    const movement = (yourOffer - customerOffer) * greedFactor * 0.4;
    const newOffer = Math.round(customerOffer + movement);
    setCustomerOffer(Math.min(maxOffer, Math.max(minOffer, newOffer)));
  };

  const handleAccept = async () => {
    // Final price = customer's current offer (player accepts what customer is offering)
    const price = customerOffer;
    const direction = customer.wantsToBuy ? 'sell' : 'buy';

    const updated = await processTransaction(player, tradedItem, price, direction);

    if (updated.error) {
      notify(updated.error, 'error');
      return;
    }

    dispatch({ type: 'SET_PLAYER', payload: updated });
    notify(
      `Deal! ${direction === 'sell' ? '+' : '-'}$${price.toLocaleString()} 🤝`,
      'success'
    );
    dispatch({ type: 'REMOVE_CUSTOMER', payload: customer.customer_name });
  };

  const handleReject = () => {
    notify(`${customer.customer_name} walked away.`, 'info');
    dispatch({ type: 'REMOVE_CUSTOMER', payload: customer.customer_name });
  };

  const showShopPicker = customer.wantsToBuy && (player?.shopInventory.items.length || 0) > 1;

  return (
    <div style={styles.overlay} onClick={close}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.avatarBig}>🙂</span>
            <div>
              <div style={styles.customerName}>{customer.customer_name}</div>
              <div style={styles.intent}>
                {customer.wantsToBuy ? '🛒 Wants to buy from you' : '💼 Wants to sell to you'}
              </div>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={close}>✕</button>
        </div>

        {/* Patience bar */}
        <div style={styles.patienceRow}>
          <span style={styles.traitLabel}>Patience</span>
          <div style={styles.patienceBarTrack}>
            {Array.from({ length: customer.patience }).map((_, i) => (
              <div key={i} style={{ ...styles.patiencePip, background: i < patienceLeft ? '#52B788' : '#252A3A' }} />
            ))}
          </div>
          <span style={{ ...styles.traitLabel, color: '#F87171' }}>Greed {customer.greed}/10</span>
        </div>

        {/* Shop item picker if customer wants to buy and player has multiple items */}
        {showShopPicker && (
          <div style={styles.pickerRow}>
            <span style={styles.traitLabel}>Sell which item?</span>
            <div style={styles.itemTabs}>
              {player.shopInventory.items.map((it, idx) => (
                <button
                  key={idx}
                  style={{
                    ...styles.itemTab,
                    ...(idx === selectedShopItemIdx ? styles.itemTabActive : {}),
                  }}
                  onClick={() => setSelectedShopItemIdx(idx)}
                >
                  {it.item_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Item card */}
        <div style={styles.itemCard}>
          <div style={styles.itemIconBig}>👟</div>
          <div style={styles.itemDetails}>
            <div style={styles.itemTitle}>{tradedItem.item_name}</div>
            <div style={styles.badges}>
              {branded && <Badge text={`🏷️ ${branded.brand_name} ×${branded.brand_multiplier}`}     color="#6C8EF5" />}
              {special && <Badge text={`⭐ ${special.s_edition_name} ×${special.s_edition_multiplier}`} color="#A78BFA" />}
              {signed  && <Badge text={`✍️ ${signed.celeb_name} ×${signed.celeb_multiplier}`}         color="#F0C040" />}
              {tradedItem.is_replica && <Badge text="REPLICA" color="#8890A4" />}
            </div>
            <div style={styles.itemMeta}>
              <span style={{ color: conditionColor }}>◆ {conditionLabel} ({tradedItem.condition}/100)</span>
              <span style={{ color: getRarityColor(tradedItem.rarity) }}>◆ {tradedItem.rarity}</span>
            </div>
          </div>
          <div style={styles.priceCol}>
            <div style={styles.priceLabel}>Est. Value</div>
            <div style={styles.priceVal}>${estimatedPrice.toLocaleString()}</div>
            {intelligenceLv >= 5 && (
              <div style={styles.truePrice}>True: ${truePrice.toLocaleString()}</div>
            )}
          </div>
        </div>

        {/* Offers */}
        <div style={styles.offersRow}>
          <div style={styles.offerBox}>
            <div style={styles.offerLabel}>
              {customer.wantsToBuy ? `${customer.customer_name} pays` : `${customer.customer_name} asks`}
            </div>
            <div style={styles.offerValue}>${customerOffer.toLocaleString()}</div>
          </div>

          <div style={styles.vsText}>VS</div>

          <div style={styles.offerBox}>
            <div style={styles.offerLabel}>
              {customer.wantsToBuy ? 'Your asking price' : 'Your offer'}
            </div>
            <div style={styles.offerValue}>${yourOffer.toLocaleString()}</div>
          </div>
        </div>

        {/* Slider */}
        <div style={styles.sliderWrapper}>
          <span style={styles.sliderMin}>${minOffer.toLocaleString()}</span>
          <input
            type="range"
            min={minOffer}
            max={maxOffer}
            value={yourOffer}
            onChange={e => setYourOffer(Number(e.target.value))}
            style={styles.slider}
          />
          <span style={styles.sliderMax}>${maxOffer.toLocaleString()}</span>
        </div>

        {/* Buttons */}
        <div style={styles.actions}>
          <button style={{ ...styles.actionBtn, ...styles.acceptBtn }} onClick={handleAccept}>
            ✓ Accept ${customerOffer.toLocaleString()}
          </button>
          <button style={{ ...styles.actionBtn, ...styles.counterBtn }} onClick={handleCounter}>
            ↩ Counter ${yourOffer.toLocaleString()}
          </button>
          <button style={{ ...styles.actionBtn, ...styles.rejectBtn }} onClick={handleReject}>
            ✗ Reject
          </button>
        </div>

        {round > 0 && <div style={styles.roundInfo}>Round {round} · {patienceLeft} patience left</div>}
      </div>
    </div>
  );
}

function Badge({ text, color }) {
  return (
    <div style={{ background: `${color}22`, border: `1px solid ${color}55`, borderRadius: 6, padding: '2px 8px', fontSize: 11, color }}>
      {text}
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
    borderRadius: 20, padding: 28, width: 540,
    maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: 20,
    boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
  },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  avatarBig: { fontSize: 44, lineHeight: 1 },
  customerName: { fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#E8EAED' },
  intent: { fontSize: 13, color: '#8890A4', marginTop: 2 },
  closeBtn: { background: 'none', border: 'none', color: '#8890A4', fontSize: 18, cursor: 'pointer', padding: 4 },
  patienceRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: '#0F1117', borderRadius: 10, padding: '10px 16px',
  },
  traitLabel: { fontSize: 11, color: '#8890A4', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' },
  patienceBarTrack: { display: 'flex', gap: 4, flex: 1 },
  patiencePip: { flex: 1, height: 8, borderRadius: 4, transition: 'background 0.3s' },
  pickerRow: {
    display: 'flex', flexDirection: 'column', gap: 8,
    background: '#0F1117', borderRadius: 10, padding: '10px 16px',
  },
  itemTabs: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  itemTab: {
    background: '#1E2235', border: '1px solid #252A3A',
    borderRadius: 6, padding: '5px 10px',
    color: '#8890A4', fontSize: 11, cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  itemTabActive: { borderColor: '#6C8EF5', color: '#6C8EF5', background: '#6C8EF511' },
  itemCard: {
    display: 'flex', gap: 16, alignItems: 'flex-start',
    background: '#1E2235', border: '1px solid #252A3A',
    borderRadius: 14, padding: 16,
  },
  itemIconBig: { fontSize: 40, flexShrink: 0 },
  itemDetails: { flex: 1, display: 'flex', flexDirection: 'column', gap: 8 },
  itemTitle: { fontFamily: "'DM Serif Display', serif", fontSize: 18, color: '#E8EAED' },
  badges: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  itemMeta: { display: 'flex', gap: 12, fontSize: 12 },
  priceCol: { textAlign: 'right', flexShrink: 0 },
  priceLabel: { fontSize: 10, color: '#8890A4', letterSpacing: 1, textTransform: 'uppercase' },
  priceVal: { fontSize: 22, fontWeight: 700, color: '#F0C040' },
  truePrice: { fontSize: 11, color: '#52B788', marginTop: 4 },
  offersRow: { display: 'flex', alignItems: 'center', gap: 16 },
  offerBox: {
    flex: 1, background: '#1E2235', borderRadius: 12,
    padding: '14px 16px', textAlign: 'center',
    border: '1px solid #252A3A',
  },
  offerLabel: { fontSize: 11, color: '#8890A4', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  offerValue: { fontSize: 24, fontWeight: 700, color: '#E8EAED' },
  vsText: { fontFamily: "'DM Serif Display', serif", color: '#8890A4', fontSize: 18 },
  sliderWrapper: { display: 'flex', alignItems: 'center', gap: 10 },
  sliderMin: { fontSize: 11, color: '#8890A4', flexShrink: 0 },
  sliderMax: { fontSize: 11, color: '#8890A4', flexShrink: 0 },
  slider: { flex: 1, accentColor: '#6C8EF5' },
  actions: { display: 'flex', gap: 10 },
  actionBtn: {
    flex: 1, border: 'none', borderRadius: 10,
    padding: '12px 8px', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
    transition: 'opacity 0.2s',
  },
  acceptBtn: { background: '#52B788', color: '#fff' },
  counterBtn: { background: '#6C8EF5', color: '#fff' },
  rejectBtn: { background: '#252A3A', color: '#8890A4' },
  roundInfo: { textAlign: 'center', fontSize: 12, color: '#8890A4' },
  emptyState: { textAlign: 'center', padding: '32px 16px' },
};
