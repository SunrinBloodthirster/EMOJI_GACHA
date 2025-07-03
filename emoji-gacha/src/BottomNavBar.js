import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './BottomNavBar.css';

const BottomNavBar = () => {
  const location = useLocation();

  return (
    <div className="bottom-nav-bar">
      <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
        <span role="img" aria-label="gacha">🎰</span>
        <span>뽑기</span>
      </Link>
      <Link to="/dex" className={`nav-item ${location.pathname === '/dex' ? 'active' : ''}`}>
        <span role="img" aria-label="dex">📚</span>
        <span>도감</span>
      </Link>
    </div>
  );
};

export default BottomNavBar;