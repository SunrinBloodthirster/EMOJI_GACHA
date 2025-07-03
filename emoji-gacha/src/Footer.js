import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="app-footer">
      <nav>
        <Link to="/terms">이용약관</Link>
        <Link to="/privacy">개인정보처리방침</Link>
      </nav>
      <p>&copy; 2023 EMOJI GACHA. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
