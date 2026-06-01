import React, { createContext, useContext, useReducer, useCallback } from 'react';

const GameContext = createContext(null);

const initialState = {
  screen: 'login',
  player: null,
  customers: [],
  activeModal: null,
  selectedCustomer: null,
  notification: null,
  activeTab: 'customers',     // 'customers' | 'inventory' | 'craft'
  customerEvent: null,        // { message, type } shown inline in customer area
  rentEvent: null,            // { week, amount, budgetAfter } shown as center modal
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
      // Remove by unique _id to avoid removing customers with identical names
      return {
        ...state,
        customers: state.customers.filter(c => c._id !== action.payload),
        selectedCustomer: null,
        activeModal: null,
      };
    case 'SET_MODAL':
      return { ...state, activeModal: action.payload };
    case 'SET_SELECTED_CUSTOMER':
      return { ...state, selectedCustomer: action.payload, activeModal: action.payload ? 'trade' : null };
    case 'SET_NOTIFICATION':
      return { ...state, notification: action.payload };
    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null };
    case 'SET_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_CUSTOMER_EVENT':
      return { ...state, customerEvent: action.payload };
    case 'CLEAR_CUSTOMER_EVENT':
      return { ...state, customerEvent: null };
    case 'SET_RENT_EVENT':
      return { ...state, rentEvent: action.payload };
    case 'CLEAR_RENT_EVENT':
      return { ...state, rentEvent: null };
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

  // Shows a message inline in the customer area (not the toast corner)
  const customerNotify = useCallback((message, type = 'info') => {
    dispatch({ type: 'SET_CUSTOMER_EVENT', payload: { message, type } });
    setTimeout(() => dispatch({ type: 'CLEAR_CUSTOMER_EVENT' }), 2500);
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch, notify, customerNotify }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
