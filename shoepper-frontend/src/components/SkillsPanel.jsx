import React from 'react';
import { useGame } from '../context/GameContext';
import { startGathering, startCrafting } from '../services/api';
import { RESOURCE_TYPES, ITEM_RELATIONS } from '../data/mockData';

export default function SkillsPanel() {
  const { state, dispatch, notify } = useGame();
  const { player } = state;
  if (!player) return null;

  const handleGather = async (resourceName) => {
    const alreadyGathering = player.activeTasks.some(t => t.type === 'gathering' && t.resource_name === resourceName);
    if (alreadyGathering) { notify('Already gathering that!', 'error'); return; }
    const updated = await startGathering(player, resourceName);
    dispatch({ type: 'SET_PLAYER', payload: updated });
    notify(`Started gathering ${resourceName}...`, 'info');
  };

  const handleCraft = async (itemId) => {
    const relation = ITEM_RELATIONS.find(r => r.item_id === itemId);
    const hasIngredient = player.playerInventory.resources.find(r => r.resource_name === relation?.craft_ingredient && r.amount > 0);
    if (!hasIngredient) { notify(`Need ${relation?.craft_ingredient}!`, 'error'); return; }
    const updated = await startCrafting(player, itemId);
    dispatch({ type: 'SET_PLAYER', payload: updated });
    notify(`Crafting ${relation.item_name}...`, 'info');
  };

  return (
    <div style={styles.panel}>
      {/* Stats */}
      <Section title="📊 Stats">
        {player.stats.map(stat => (
          <StatRow key={stat.stat_name} stat={stat} />
        ))}
      </Section>

      {/* Skills */}
      <Section title="⚒️ Skills">
        {player.skills.map(skill => (
          <SkillRow key={skill.skill_name} skill={skill} />
        ))}
      </Section>

      {/* Gather */}
      <Section title="🪨 Gather Resources">
        {RESOURCE_TYPES.map(rt => (
          <ActionRow
            key={rt.resource_name}
            label={rt.resource_name}
            sub={`${rt.gather_time}s · +${rt.gather_exp} exp`}
            onAction={() => handleGather(rt.resource_name)}
            actionLabel="Gather"
            disabled={player.activeTasks.some(t => t.resource_name === rt.resource_name)}
          />
        ))}
      </Section>

      {/* Craft */}
      <Section title="🔨 Craft Items">
        {ITEM_RELATIONS.map(ir => (
          <ActionRow
            key={ir.item_id}
            label={ir.item_name}
            sub={`Needs: ${ir.craft_ingredient}`}
            onAction={() => handleCraft(ir.item_id)}
            actionLabel="Craft"
          />
        ))}
      </Section>

      {/* Active Tasks */}
      {player.activeTasks.length > 0 && (
        <Section title="⏳ Active Tasks">
          {player.activeTasks.map(task => (
            <TaskRow key={task.id} task={task} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  const [open, setOpen] = React.useState(true);
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
  return (
    <div style={styles.row}>
      <div style={styles.rowMain}>
        <div style={styles.rowName}>{stat.stat_name}</div>
        <div style={styles.expBar}>
          <div style={{ width: `${stat.stat_level}%`, background: '#6C8EF5', height: '100%', borderRadius: 4 }} />
        </div>
      </div>
      <div style={styles.rowRight}>
        <div style={styles.level}>Lv.{stat.stat_level}</div>
        <div style={styles.effect}>+{effect}%</div>
      </div>
    </div>
  );
}

function SkillRow({ skill }) {
  const expPct = (skill.exp / skill.exp_needed) * 100;
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
        <div style={styles.rowSub}>{sub}</div>
      </div>
      <button
        style={{ ...styles.actionBtn, opacity: disabled ? 0.4 : 1 }}
        onClick={onAction}
        disabled={disabled}
      >
        {disabled ? '...' : actionLabel}
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
    overflowY: 'auto',
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
};
