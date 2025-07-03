import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import './GachaModal.css';

const GachaModal = ({ pulledEmoji, onClose }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [rarityEffect, setRarityEffect] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // 임시 TMI 생성 함수
  const generateTmi = (emoji) => {
    if (!emoji) return "이모지 정보를 불러올 수 없습니다.";
    const tmiList = [
      `이 이모지는 ${emoji.name}의 상징입니다.`,
      `행운의 ${emoji.rarity} 등급! 멋져요!`,
      `오늘 당신의 운세는 최고입니다.`,
    ];
    return tmiList[Math.floor(Math.random() * tmiList.length)];
  };

  useEffect(() => {
    if (!pulledEmoji) return; // pulledEmoji가 없으면 아무것도 하지 않음

    // pulledEmoji에 TMI 추가
    pulledEmoji.tmi = generateTmi(pulledEmoji);

    // 0.5초 대기 후 카드 뒤집기 시작
    const flipTimer = setTimeout(() => {
      setIsFlipped(true);
      // new Audio('/sounds/card-flip.mp3').play(); // 사운드 파일 부재로 임시 주석 처리

      // 카드 뒤집기 애니메이션 중 불빛 효과 및 내용 표시
      const revealTimer = setTimeout(() => {
        setRarityEffect(`rarity-${pulledEmoji.rarity.toLowerCase()}`); // 희귀도 불빛 효과
        if (pulledEmoji.rarity === 'Legendary') {
          setShowConfetti(true);
        }
        // const raritySound = `/sounds/reveal-${pulledEmoji.rarity.toLowerCase()}.mp3`;
        // new Audio(raritySound).play(); // 사운드 파일 부재로 임시 주석 처리
        setShowContent(true); // 내용 표시
      }, 300); // 카드 뒤집기 시작 후 0.3초 뒤 (총 0.8초)

      return () => clearTimeout(revealTimer);
    }, 500); // 모달 등장 후 0.5초 뒤 카드 뒤집기 시작

    return () => {
      clearTimeout(flipTimer);
      // 모달이 닫힐 때 상태 초기화
      setIsFlipped(false);
      setRarityEffect('');
      setShowConfetti(false);
      setShowContent(false);
    };
  }, [pulledEmoji]); // pulledEmoji가 변경될 때마다 이펙트 재실행

  if (!pulledEmoji) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      {showConfetti && <Confetti />}
      <div className="modal-content gacha-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className={`gacha-card-container ${rarityEffect}`}>
          <div className={`gacha-card ${isFlipped ? 'is-flipped' : ''}`}>
            <div className="card-face card-face-front">
              <div className="question-mark">?</div>
            </div>
            <div className="card-face card-face-back">
              {showContent && ( // showContent가 true일 때만 내용 렌더링
                <>
                  <div className="gacha-result-emoji">{pulledEmoji.emoji}</div>
                  <div className="gacha-result-name">{pulledEmoji.name}</div>
                  <div className={`gacha-result-rarity rarity-${pulledEmoji.rarity.toLowerCase()}`}>
                    {pulledEmoji.rarity}
                  </div>
                  <p className="gacha-result-tmi">{pulledEmoji.tmi}</p>
                </>
              )}
            </div>
          </div>
        </div>
        <button className={`back-to-main-button ${isFlipped && showContent ? '' : 'hidden-button'}`} onClick={onClose}>
          확인
        </button>
      </div>
    </div>
  );
};

export default GachaModal;