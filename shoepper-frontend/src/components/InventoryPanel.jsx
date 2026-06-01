import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { calcItemPrice, moveItemInventory, startRepair } from '../services/api';
import { BRANDED_ITEMS, SPECIAL_EDITION_ITEMS, SIGNED_ITEMS, ITEM_RELATIONS } from '../data/mockData';

export default function InventoryPanel({ type }) {
  const { state, dispatch, notify } = useGame();
  const { player } = state;
  const [repairTarget, setRepairTarget] = useState(null); // { item }
  if (!player) return null;

  const inv = type === 'player' ? player.playerInventory : player.shopInventory;
  const title = type === 'player' ? '🎒 Player Inventory' : '🏪 Shop Inventory';
  const slotCount = (inv.items?.length || 0) + (inv.resources?.length || 0);

  const handleMove = async (item) => {
    const updated = await moveItemInventory(player, item, type);
    if (updated.error) { notify(updated.error, 'error'); return; }
    dispatch({ type: 'SET_PLAYER', payload: updated });
    const dest = type === 'player' ? 'shop' : 'player inventory';
    notify(`${item.item_name} moved to ${dest}.`, 'success');
  };

  const handleRepairConfirm = async () => {
    if (!repairTarget) return;
    const { item } = repairTarget;
    const updated = await startRepair(player, item, type);
    setRepairTarget(null);
    if (updated.error) { notify(updated.error, 'error'); return; }
    dispatch({ type: 'SET_PLAYER', payload: updated });
    notify(`${item.item_name} repaired!`, 'success');
  };

  return (
    <div style={styles.panel}>
      {/* Repair requirements popup */}
      {repairTarget && (
        <RepairPopup
          item={repairTarget.item}
          player={player}
          onConfirm={handleRepairConfirm}
          onCancel={() => setRepairTarget(null)}
        />
      )}

      <div style={styles.header}>
        <div style={styles.title}>{title}</div>
        <div style={styles.slots}>{slotCount}/{inv.size} slots</div>
      </div>

      <div style={styles.slotBar}>
        <div style={{
          width: `${(slotCount / inv.size) * 100}%`,
          background: slotCount > inv.size * 0.8 ? '#F87171' : '#6C8EF5',
          height: '100%', borderRadius: 4, transition: 'width 0.3s',
        }} />
      </div>

      {inv.resources && inv.resources.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Resources</div>
          {inv.resources.map((r, i) => (
            <ResourceRow key={i} resource={r} />
          ))}
        </div>
      )}

      {inv.items && inv.items.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Items</div>
          {inv.items.map((item, i) => (
            <ItemRow
              key={item.instance_id ?? i}
              item={item}
              type={type}
              onMove={() => handleMove(item)}
              onRepair={() => setRepairTarget({ item })}
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

function ItemRow({ item, type, onMove, onRepair }) {
  const condColor = item.condition >= 70 ? '#52B788' : item.condition >= 40 ? '#F0C040' : '#F87171';
  const branded = BRANDED_ITEMS.find(b => b.item_id === item.item_id);
  const special = SPECIAL_EDITION_ITEMS.find(s => s.item_id === item.item_id);
  const signed  = SIGNED_ITEMS.find(s => s.item_id === item.item_id);
  const price   = calcItemPrice(item, item);
  const needsRepair = item.condition < 100;

  const itemName = item.item_name
    || ITEM_RELATIONS.find(r => r.item_id === item.item_id)?.item_name
    || `Item #${item.item_id}`;

  return (
    <div style={styles.row}>
      <span style={styles.rowIcon}>👟</span>
      <div style={styles.rowMain}>
        <div style={styles.rowName}>
          {branded ? `${branded.brand_name} ` : ''}{itemName}
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
        <div style={{ display: 'flex', gap: 4 }}>
          {needsRepair && (
            <button style={styles.repairBtn} onClick={onRepair} title="Repair this item">🔧</button>
          )}
          <button style={styles.moveBtn} onClick={onMove}>
            {type === 'player' ? '→ Shop' : '← Bag'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RepairPopup({ item, player, onConfirm, onCancel }) {
  const relation = ITEM_RELATIONS.find(r => r.item_id === item.item_id);
  const needed = relation?.repair_ingredient || '?';
  const inStock = player.playerInventory.resources.find(r => r.resource_name === needed && r.amount > 0);
  const canRepair = !!inStock;

  return (
    <div style={popup.overlay} onClick={onCancel}>
      <div style={popup.box} onClick={e => e.stopPropagation()}>
        <div style={popup.title}>🔧 Repair Requirements</div>
        <div style={popup.itemName}>{item.item_name}</div>

        <div style={popup.row}>
          <span style={popup.label}>Current condition</span>
          <span style={{ color: item.condition >= 70 ? '#52B788' : item.condition >= 40 ? '#F0C040' : '#F87171', fontWeight: 700 }}>
            {item.condition}/100
          </span>
        </div>
        <div style={popup.row}>
          <span style={popup.label}>Required resource</span>
          <span style={{ color: '#E8EAED', fontWeight: 600 }}>{needed}</span>
        </div>
        <div style={popup.row}>
          <span style={popup.label}>In your bag</span>
          <span style={{ color: canRepair ? '#52B788' : '#F87171', fontWeight: 700 }}>
            {canRepair ? `×${inStock.amount}` : 'None'}
          </span>
        </div>

        <div style={popup.actions}>
          <button style={{ ...popup.btn, ...popup.cancel }} onClick={onCancel}>Cancel</button>
          <button
            style={{ ...popup.btn, ...popup.confirm, opacity: canRepair ? 1 : 0.4 }}
            onClick={onConfirm}
            disabled={!canRepair}
          >
            {canRepair ? 'Repair →' : 'Not enough resources'}
          </button>
        </div>
      </div>
    </div>
  );
}

const popup = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 250, backdropFilter: 'blur(4px)',
  },
  box: {
    background: '#181C27', border: '1px solid #252A3A',
    borderRadius: 18, padding: '28px 32px', width: 340, maxWidth: '92vw',
    display: 'flex', flexDirection: 'column', gap: 14,
    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
    fontFamily: "'DM Sans', sans-serif",
  },
  title: { fontSize: 13, fontWeight: 700, color: '#F0A040', letterSpacing: 1, textTransform: 'uppercase' },
  itemName: { fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#E8EAED' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1E2235', borderRadius: 8, padding: '10px 14px' },
  label: { fontSize: 12, color: '#8890A4' },
  actions: { display: 'flex', gap: 10, marginTop: 4 },
  btn: { flex: 1, border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  cancel: { background: '#252A3A', color: '#8890A4' },
  confirm: { background: '#F0A040', color: '#fff' },
};

const styles = {
  panel: {
    background: '#181C27', border: '1px solid #252A3A',
    borderRadius: 16, padding: 16,
    display: 'flex', flexDirection: 'column', gap: 10,
    flex: 1, minWidth: 240,
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
  repairBtn: {
    background: '#2A1F1A', border: '1px solid #5A3A2A',
    borderRadius: 5, padding: '2px 6px',
    color: '#F0A040', fontSize: 11, cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  replica: { fontSize: 10, color: '#8890A4', border: '1px solid #3A4255', borderRadius: 4, padding: '1px 5px' },
  empty: { textAlign: 'center', color: '#8890A4', fontSize: 13, padding: '16px 0', fontStyle: 'italic' },
};
