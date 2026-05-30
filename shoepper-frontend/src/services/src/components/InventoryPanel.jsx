import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { calcItemPrice } from '../services/api';
import { BRANDED_ITEMS, SPECIAL_EDITION_ITEMS, SIGNED_ITEMS } from '../data/mockData';

export default function InventoryPanel({ type }) {
  const { state, dispatch, notify } = useGame();
  const { player } = state;
  if (!player) return null;

  const inv = type === 'player' ? player.playerInventory : player.shopInventory;
  const title = type === 'player' ? '🎒 Player Inventory' : '🏪 Shop Inventory';
  const slotCount = (inv.items?.length || 0) + (inv.resources?.length || 0);

  const moveToShop = (item) => {
    const playerInv = { ...player.playerInventory, items: player.playerInventory.items.filter(i => i.item_id !== item.item_id) };
    const shopInv   = { ...player.shopInventory, items: [...player.shopInventory.items, item] };
    dispatch({ type: 'SET_PLAYER', payload: { ...player, playerInventory: playerInv, shopInventory: shopInv } });
    notify(`${item.item_name} moved to shop.`, 'success');
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <div style={styles.title}>{title}</div>
        <div style={styles.slots}>{slotCount}/{inv.size} slots</div>
      </div>

      {/* Slot bar */}
      <div style={styles.slotBar}>
        <div style={{ width: `${(slotCount / inv.size) * 100}%`, background: slotCount > inv.size * 0.8 ? '#F87171' : '#6C8EF5', height: '100%', borderRadius: 4, transition: 'width 0.3s' }} />
      </div>

      {/* Resources */}
      {inv.resources && inv.resources.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Resources</div>
          {inv.resources.map((r, i) => (
            <ResourceRow key={i} resource={r} />
          ))}
        </div>
      )}

      {/* Items */}
      {inv.items && inv.items.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Items</div>
          {inv.items.map((item, i) => (
            <ItemRow
              key={i}
              item={item}
              showMoveBtn={type === 'player'}
              onMove={() => moveToShop(item)}
            />
          ))}
        </div>
      )}

      {slotCount === 0 && (
        <div style={styles.empty}>Empty</div>
      )}
    </div>
  );
}

function ResourceRow({ resource }) {
  const lvColor = ['', '#8890A4', '#52B788', '#6C8EF5', '#A78BFA'][resource.resource_level] || '#8890A4';
  return (
    <div style={styles.row}>
      <span style={styles.rowIcon}>🪨</span>
      <div style={styles.rowMain}>
        <div style={styles.rowName}>{resource.resource_name}</div>
        <div style={{ ...styles.rowBadge, color: lvColor, borderColor: `${lvColor}44`, background: `${lvColor}11` }}>
          Lv.{resource.resource_level}
        </div>
      </div>
      <div style={styles.rowAmount}>×{resource.amount}</div>
    </div>
  );
}

function ItemRow({ item, showMoveBtn, onMove }) {
  const condColor = item.condition >= 70 ? '#52B788' : item.condition >= 40 ? '#F0C040' : '#F87171';
  const branded = BRANDED_ITEMS.find(b => b.item_id === item.item_id);
  const special = SPECIAL_EDITION_ITEMS.find(s => s.item_id === item.item_id);
  const signed  = SIGNED_ITEMS.find(s => s.item_id === item.item_id);
  const price   = calcItemPrice(item, item);

  return (
    <div style={styles.row}>
      <span style={styles.rowIcon}>👟</span>
      <div style={styles.rowMain}>
        <div style={styles.rowName}>
          {branded ? `${branded.brand_name} ` : ''}{item.item_name}
          {signed ? ` (${signed.celeb_name})` : ''}
        </div>
        <div style={styles.rowMeta}>
          <span style={{ color: condColor }}>{item.condition}/100</span>
          {item.is_replica && <span style={styles.replica}>REPLICA</span>}
          {special && <span style={{ color: '#A78BFA', fontSize: 10 }}>⭐ {special.s_edition_name}</span>}
        </div>
      </div>
      <div style={styles.rowRight}>
        <div style={styles.priceTag}>${price.toLocaleString()}</div>
        {showMoveBtn && (
          <button style={styles.moveBtn} onClick={onMove}>→ Shop</button>
        )}
      </div>
    </div>
  );
}

const styles = {
  panel: {
    background: '#181C27', border: '1px solid #252A3A',
    borderRadius: 16, padding: 16,
    display: 'flex', flexDirection: 'column', gap: 10,
    minWidth: 220,
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: "'DM Serif Display', serif", fontSize: 15, color: '#E8EAED' },
  slots: { fontSize: 11, color: '#8890A4' },
  slotBar: { height: 4, background: '#252A3A', borderRadius: 4, overflow: 'hidden' },
  section: { display: 'flex', flexDirection: 'column', gap: 6 },
  sectionLabel: { fontSize: 10, color: '#8890A4', letterSpacing: 1.5, textTransform: 'uppercase', paddingBottom: 2, borderBottom: '1px solid #252A3A' },
  row: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#1E2235', borderRadius: 10, padding: '8px 10px',
  },
  rowIcon: { fontSize: 18, flexShrink: 0 },
  rowMain: { flex: 1, overflow: 'hidden' },
  rowName: { fontSize: 12, color: '#E8EAED', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  rowMeta: { display: 'flex', gap: 6, marginTop: 2, flexWrap: 'wrap' },
  rowBadge: { fontSize: 10, fontWeight: 700, border: '1px solid', borderRadius: 4, padding: '1px 5px' },
  rowAmount: { fontSize: 13, fontWeight: 700, color: '#6C8EF5', flexShrink: 0 },
  rowRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
  priceTag: { fontSize: 12, fontWeight: 700, color: '#F0C040' },
  moveBtn: {
    background: '#252A3A', border: '1px solid #3A4255',
    borderRadius: 5, padding: '2px 7px',
    color: '#6C8EF5', fontSize: 11, cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  replica: { fontSize: 10, color: '#8890A4', border: '1px solid #3A4255', borderRadius: 4, padding: '1px 5px' },
  empty: { textAlign: 'center', color: '#8890A4', fontSize: 13, padding: '16px 0', fontStyle: 'italic' },
};
