import React, { createContext, useContext, useReducer, useCallback } from 'react';

const GameContext = createContext(null);

const initialState = {
  screen: 'login',       // login | game | gameover
  player: null,
  customers: [],
  activeModal: null,     // null | 'trade' | 'craft' | 'gather' | 'upgrade' | 'repair'
  selectedCustomer: null,
  notification: null,
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.payload };
    case 'SET_PLAYER':
      return { ...state, player: action.payload };
    case 'UPDATE_PLAYER':
      return { ...state, player: { ...state.player, ...action.payload } };
    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload };
    case 'REMOVE_CUSTOMER':
      return { ...state, customers: state.customers.filter(c => c.customer_name !== action.payload), selectedCustomer: null, activeModal: null };
    case 'SET_MODAL':
      return { ...state, activeModal: action.payload };
    case 'SET_SELECTED_CUSTOMER':
      return { ...state, selectedCustomer: action.payload, activeModal: action.payload ? 'trade' : null };
    case 'SET_NOTIFICATION':
      return { ...state, notification: action.payload };
    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null };
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const notify = useCallback((message, type = 'success') => {
    dispatch({ type: 'SET_NOTIFICATION', payload: { message, type } });
    setTimeout(() => dispatch({ type: 'CLEAR_NOTIFICATION' }), 3000);
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch, notify }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
