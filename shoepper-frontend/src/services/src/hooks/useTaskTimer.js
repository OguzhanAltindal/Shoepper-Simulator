import { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { completeGathering, completeCrafting } from '../services/api';

export function useTaskTimer() {
  const { state, dispatch, notify } = useGame();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!state.player) return;

    intervalRef.current = setInterval(async () => {
      const now = Date.now();
      const completedTasks = state.player.activeTasks.filter(t => t.ends_at <= now);

      if (completedTasks.length === 0) return;

      let updatedPlayer = state.player;

      for (const task of completedTasks) {
        if (task.type === 'gathering') {
          updatedPlayer = await completeGathering(updatedPlayer, task);
          notify(`✓ Gathered ${task.resource_name}!`, 'success');
        } else if (task.type === 'crafting') {
          updatedPlayer = await completeCrafting(updatedPlayer, task);
          notify(`✓ Crafted ${task.item_name}!`, 'success');
        }
      }

      dispatch({ type: 'SET_PLAYER', payload: updatedPlayer });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [state.player, dispatch, notify]);
}
