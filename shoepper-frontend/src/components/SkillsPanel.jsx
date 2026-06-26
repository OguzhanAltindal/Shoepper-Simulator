import React from 'react';
import { useGame } from '../context/GameContext';
import { startGathering, startCrafting, startRepair } from '../services/api';
import { RESOURCE_TYPES, ITEM_RELATIONS } from '../data/mockData';

export default function SkillsPanel() {
  const { state, dispatch, notify } = useGame();
  const { player } = state;
  if (!player) return null;

  const handleGather = async (resourceName) => {
    const alreadyGathering = player.activeTasks.some(t => t.type === 'gathering' && t.resource_name === resourceName);
    if (alreadyGathering) { notify('Already gathering that!', 'error'); return; }
    const updated = await startGathering(player, resourceName);
    if (updated.error) { notify(updated.error, 'error'); return; }
    dispatch({ type: 'SET_PLAYER', payload: updated });
    notify(`Started gathering ${resourceName}...`, 'info');
  };

  const handleCraft = async (itemId) => {
    const relation = ITEM_RELATIONS.find(r => r.item_id === itemId);
    const hasIngredient = player.playerInventory.resources.find(
      r => r.resource_name === relation?.craft_ingredient && r.amount > 0
    );
    if (!hasIngredient) { notify(`Need ${relation?.craft_ingredient}!`, 'error'); return; }
    const updated = await startCrafting(player, itemId);
    if (updated.error) { notify(updated.error, 'error'); return; }
    dispatch({ type: 'SET_PLAYER', payload: updated });
    notify(`Crafted ${relation.item_name}!`, 'success');
  };

  const handleRepairFromSkills = async (item, fromInventory) => {
    const relation = ITEM_RELATIONS.find(r => r.item_id === item.item_id);
    const needed = relation?.repair_ingredient;
    const hasResource = player.playerInventory.resources.find(r => r.resource_name === needed && r.amount > 0);
    if (!hasResource) { notify(`Need ${needed || 'repair resource'}!`, 'error'); return; }
    const updated = await startRepair(player, item, fromInventory);
    if (updated.error) { notify(updated.error, 'error'); return; }
    dispatch({ type: 'SET_PLAYER', payload: updated });
    notify(`${item.item_name} repaired!`, 'success');
  };

  const damagedPlayerItems = (player.playerInventory.items || []).filter(i => i.condition < 100);
  const damagedShopItems   = (player.shopInventory.items || []).filter(i => i.condition < 100);

  return (
    <div style={styles.panel}>

      <Section title="📊 Stats" defaultOpen>
        {player.stats.map(stat => (
          <StatRow key={stat.stat_name} stat={stat} />
        ))}
      </Section>

      <Section title="⚒️ Skills" defaultOpen>
        {player.skills.map(skill => (
          <SkillRow key={skill.skill_name} skill={skill} />
        ))}
      </Section>

      <Section title="🪨 Gather Resources" defaultOpen>
        {RESOURCE_TYPES.map(rt => {
          const busy = player.activeTasks.some(t => t.resource_name === rt.resource_name);
          return (
            <ActionRow
              key={rt.resource_name}
              label={rt.resource_name}
              sub={`⏱ ${rt.gather_time}s · +${rt.gather_exp} exp`}
              onAction={() => handleGather(rt.resource_name)}
              actionLabel="Gather"
              disabled={busy}
            />
          );
        })}
      </Section>

      <Section title="🔨 Craft Items">
        {ITEM_RELATIONS.map(ir => {
          const hasIngredient = player.playerInventory.resources.find(
            r => r.resource_name === ir.craft_ingredient && r.amount > 0
          );
          return (
            <ActionRow
              key={ir.item_id}
              label={ir.item_name}
              sub={`Needs: ${ir.craft_ingredient} · ⏱ ${ir.craft_time}s`}
              onAction={() => handleCraft(ir.item_id)}
              actionLabel="Craft"
              disabled={!hasIngredient}
            />
          );
        })}
      </Section>

      <Section title="🔧 Repair Items">
        {damagedPlayerItems.length === 0 && damagedShopItems.length === 0 ? (
          <div style={styles.noRepair}>No damaged items.</div>
        ) : (
          <>
            {damagedPlayerItems.map((item, i) => (
              <ActionRow
                key={`p-${i}`}
                label={`${item.item_name} (Bag)`}
                sub={`Condition: ${item.condition}/100 · Needs: ${ITEM_RELATIONS.find(r => r.item_id === item.item_id)?.repair_ingredient || '?'}`}
                onAction={() => handleRepairFromSkills(item, 'player')}
                actionLabel="🔧"
              />
            ))}
            {damagedShopItems.map((item, i) => (
              <ActionRow
                key={`s-${i}`}
                label={`${item.item_name} (Shop)`}
                sub={`Condition: ${item.condition}/100 · Needs: ${ITEM_RELATIONS.find(r => r.item_id === item.item_id)?.repair_ingredient || '?'}`}
                onAction={() => handleRepairFromSkills(item, 'shop')}
                actionLabel="🔧"
              />
            ))}
          </>
        )}
      </Section>

      {player.activeTasks.length > 0 && (
        <Section title="⏳ Active Tasks" defaultOpen>
          {player.activeTasks.map(task => (
            <TaskRow key={task.id} task={task} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader} onClick={() => setOpen(o => !o)}>
        <span style={styles.sectionTitle}>{title}</span>
        <span style={{ color: '#8890A4', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && <div style={styles.sectionBody}>{children}</div>}
    </div>
  );
}

function StatRow({ stat }) {
  const effect = ((5.0 / 100) * stat.stat_level * 100).toFixed(1);
  const expNeeded = stat.exp_needed || 1;
  const expPct = Math.min(100, (stat.exp / expNeeded) * 100);
  return (
    <div style={styles.row}>
      <div style={styles.rowMain}>
        <div style={styles.rowName}>{stat.stat_name}</div>
        <div style={styles.expBar}>
          <div style={{ width: `${expPct}%`, background: '#6C8EF5', height: '100%', borderRadius: 4, transition: 'width 0.4s' }} />
        </div>
        <div style={styles.expText}>{stat.exp}/{expNeeded} exp</div>
      </div>
      <div style={styles.rowRight}>
        <div style={styles.level}>Lv.{stat.stat_level}</div>
        <div style={styles.effect}>+{effect}%</div>
      </div>
    </div>
  );
}

function SkillRow({ skill }) {
  const expPct = Math.min(100, (skill.exp / skill.exp_needed) * 100);
  return (
    <div style={styles.row}>
      <div style={styles.rowMain}>
        <div style={styles.rowName}>{skill.skill_name}</div>
        <div style={styles.expBar}>
          <div style={{ width: `${expPct}%`, background: '#52B788', height: '100%', borderRadius: 4, transition: 'width 0.4s' }} />
        </div>
        <div style={styles.expText}>{skill.exp}/{skill.exp_needed} exp</div>
      </div>
      <div style={styles.rowRight}>
        <div style={styles.level}>Lv.{skill.skill_level}</div>
      </div>
    </div>
  );
}

function ActionRow({ label, sub, onAction, actionLabel, disabled }) {
  return (
    <div style={styles.row}>
      <div style={styles.rowMain}>
        <div style={styles.rowName}>{label}</div>
        {sub && <div style={styles.rowSub}>{sub}</div>}
      </div>
      <button
        style={{ ...styles.actionBtn, opacity: disabled ? 0.4 : 1 }}
        onClick={onAction}
        disabled={disabled}
      >
        {disabled ? '…' : actionLabel}
      </button>
    </div>
  );
}

function TaskRow({ task }) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const remaining = Math.max(0, Math.ceil((task.ends_at - now) / 1000));
  const progress = Math.min(100, ((task.duration - remaining) / task.duration) * 100);

  return (
    <div style={styles.row}>
      <div style={styles.rowMain}>
        <div style={styles.rowName}>{task.label}</div>
        <div style={styles.expBar}>
          <div style={{ width: `${progress}%`, background: '#F0C040', height: '100%', borderRadius: 4, transition: 'width 1s linear' }} />
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#F0C040', fontWeight: 700, flexShrink: 0 }}>
        {remaining}s
      </div>
    </div>
  );
}

const styles = {
  panel: {
    background: '#181C27', border: '1px solid #252A3A',
    borderRadius: 16, padding: 12,
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  section: { display: 'flex', flexDirection: 'column', gap: 6 },
  sectionHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', cursor: 'pointer',
    padding: '4px 0', borderBottom: '1px solid #252A3A',
  },
  sectionTitle: { fontFamily: "'DM Serif Display', serif", fontSize: 13, color: '#E8EAED' },
  sectionBody: { display: 'flex', flexDirection: 'column', gap: 5, paddingTop: 4 },
  row: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#1E2235', borderRadius: 9, padding: '7px 10px',
  },
  rowMain: { flex: 1, overflow: 'hidden' },
  rowName: { fontSize: 12, color: '#E8EAED', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  rowSub: { fontSize: 10, color: '#8890A4', marginTop: 1 },
  rowRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 },
  level: { fontSize: 12, fontWeight: 700, color: '#6C8EF5' },
  effect: { fontSize: 10, color: '#52B788' },
  expBar: { height: 4, background: '#252A3A', borderRadius: 4, overflow: 'hidden', marginTop: 4 },
  expText: { fontSize: 10, color: '#8890A4', marginTop: 2 },
  actionBtn: {
    background: '#252A3A', border: '1px solid #3A4255',
    borderRadius: 6, padding: '4px 10px',
    color: '#6C8EF5', fontSize: 11, fontWeight: 600,
    cursor: 'pointer', flexShrink: 0,
    fontFamily: "'DM Sans', sans-serif",
  },
  noRepair: { fontSize: 12, color: '#8890A4', fontStyle: 'italic', padding: '6px 0' },
};
