import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import LoginScreen from './pages/LoginScreen';
import GameScreen from './pages/GameScreen';
import GameOverScreen from './pages/GameOverScreen';
import Notification from './components/Notification';

function AppContent() {
  const { state } = useGame();

  return (
    <>
      {state.screen === 'login'    && <LoginScreen />}
      {state.screen === 'game'     && <GameScreen />}
      {state.screen === 'gameover' && <GameOverScreen />}
      <Notification />
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
