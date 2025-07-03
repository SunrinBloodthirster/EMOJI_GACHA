import React from 'react';

const EmojiDetailModal = ({ emoji, onClose }) => {
  if (!emoji) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button className="modal-close-button" onClick={onClose}>X</button>
        <div className="modal-emoji-display">
          {emoji.emoji}
        </div>
        <h2 className="modal-emoji-name">{emoji.name}</h2>
        <p className="modal-emoji-rarity">희귀도: {emoji.rarity}</p>
        
        <div className="modal-tmi-section">
          <h3>이모지 TMI</h3>
          <p>재미있는 이야기가 준비 중입니다.</p>
        </div>
      </div>
    </div>
  );
};

export default EmojiDetailModal;
