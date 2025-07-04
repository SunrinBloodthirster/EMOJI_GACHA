// src/App.js
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Header from './Header';
import GachaScreen from './GachaScreen';
import EmojiDex from './EmojiDex';
import ProfilePage from './ProfilePage';
import BottomNavBar from './BottomNavBar';
import './App.css';

function AppContent() {
  const [isGachaMode, setIsGachaMode] = useState(false);
  const location = useLocation();

  return (
    <div className="App-container">
      {/* Gacha 모드가 아닐 때만 헤더를 보여줍니다. */}
      {!isGachaMode && <Header />}
      <main className={`main-content ${location.pathname === '/dex' ? 'scrollable' : ''}`}>
        <Routes>
          {/* GachaScreen에는 더 이상 user prop을 넘겨주지 않습니다. */}
          <Route path="/" element={<GachaScreen setIsGachaMode={setIsGachaMode} />} />
          <Route path="/dex" element={<EmojiDex />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
        </Routes>
      </main>
      {/* Gacha 모드가 아닐 때만 하단 네비게이션을 보여줍니다. */}
      {!isGachaMode && <BottomNavBar />}
    </div>
  );
}

function App() {
  return (
    // UserProvider가 모든 것을 감싸고, 데이터 관리를 책임집니다.
    <UserProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;