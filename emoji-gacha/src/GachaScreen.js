import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, getIdToken } from 'firebase/auth';
import GachaModal from './GachaModal';
import './GachaScreen.css';

import { useUser } from './context/UserContext';

// ProbabilityModal은 변경 사항이 거의 없습니다.
const ProbabilityModal = ({ onClose }) => {
    const { allEmojis } = useUser();
    // 데이터가 없을 경우를 대비한 안전장치
    const probabilities = allEmojis ? allEmojis.rarityProbabilities : {};
    return (
        <div className="probability-modal-overlay" onClick={onClose}>
            <div className="probability-modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>뽑기 확률 정보</h3>
                <ul>
                {Object.entries(probabilities).map(([rarity, prob]) => (
                    <li key={rarity}>{rarity}: {(prob * 100).toFixed(2)}%</li>
                ))}
                </ul>
                <button onClick={onClose}>닫기</button>
            </div>
        </div>
    );
};


const GachaScreen = ({ setIsGachaMode }) => {
    // 1. Context에서 필요한 모든 상태를 한 번에 가져옵니다.
    const { user, userProfile, allEmojis, isLoading, authIsReady } = useUser();
    const [isGachaModalOpen, setIsGachaModalOpen] = useState(false);
    const [pulledEmoji, setPulledEmoji] = useState(null);
    const [isFreePullAvailable, setIsFreePullAvailable] = useState(false);
    const [lastPulledEmoji, setLastPulledEmoji] = useState(null);
    const [showProbabilityModal, setShowProbabilityModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // 무료 뽑기 가능 여부 확인 (useEffect로 이동)
    useEffect(() => {
      if (user && userProfile) {
        const lastPullTimestamp = userProfile.lastPullTimestamp?.toDate();
        if (lastPullTimestamp) {
          const now = new Date();
          const oneDay = 24 * 60 * 60 * 1000; // 24시간
          if (now.getTime() - lastPullTimestamp.getTime() >= oneDay) {
            setIsFreePullAvailable(true);
          } else {
            setIsFreePullAvailable(false);
          }
        } else {
          setIsFreePullAvailable(true); // 첫 뽑기
        }
  
        // 마지막으로 뽑은 이모지 불러오기
        if (userProfile.lastPulledEmojiId && allEmojis) {
          const emoji = allEmojis.emojis.find(e => e.id === userProfile.lastPulledEmojiId); // allEmojis.emojis로 수정
          setLastPulledEmoji(emoji);
        }
      }
    }, [user, userProfile, allEmojis]);

    
        

    const handleGachaPull = async (isAdPull = false) => {
  // 2. '철벽 가드' 로직: 인증 안됐거나, 유저 없거나, 처리 중이면 절대 실행 안 함
  if (!authIsReady || !user) {
    alert('사용자 정보가 확인되지 않았습니다. 잠시 후 다시 시도해 주세요.');
    return;
  }
  if (isProcessing) return;

  setIsProcessing(true);

  try {
    const functions = getFunctions();
    const drawEmojiFunction = httpsCallable(functions, 'drawEmoji');

    // httpsCallable는 자동으로 인증 토큰을 처리하고,
    // { data: { ... } } 형식으로 데이터를 보냅니다.
    // 백엔드에서 isAdPull을 data.isAdPull로 접근할 수 있습니다.
    const result = await drawEmojiFunction({ isAdPull });

    // Set the pulled emoji and open the modal
    setPulledEmoji(result.data); // result.data에 실제 뽑기 결과가 있을 것으로 예상
    setIsGachaModalOpen(true);

    // If the pull was not ad-based, update free pull availability
    if (!isAdPull) {
      setIsFreePullAvailable(false);
    }

  } catch (error) {
    console.error("뽑기 오류:", error);
    alert(`뽑기 실패: ${error.message}`);
  } finally {
    setIsProcessing(false);
  }
};

    const handleCloseModal = () => {
        setIsGachaModalOpen(false);
        setPulledEmoji(null);
        setIsGachaMode(false);
    };
    
    // 3. 로딩 UI: authIsReady가 false면, 인증 절차가 끝나지 않았다는 의미.
    if (!authIsReady) {
        return <div className="loading-spinner"></div>; // 또는 '사용자 정보 확인 중...'
    }

    return (
        <div className={`gacha-screen-container ${isGachaModalOpen ? 'gacha-screen-fullscreen' : ''}`}>
          {!isGachaModalOpen && (
            <div className="gacha-main-buttons">
              {user ? (
                isFreePullAvailable ? (
                  <button className="gacha-button" onClick={() => handleGachaPull(false)} disabled={isProcessing}>
                    <span>{isProcessing ? '뽑는 중...' : '오늘의 이모지 뽑기'}</span>
                  </button>
                ) : (
                  <button className="gacha-button ad-button" onClick={() => handleGachaPull(true)} disabled={isProcessing}>
                    <span>{isProcessing ? '뽑는 중...' : '광고 보고 한 번 더 뽑기'}</span>
                  </button>
                )
              ) : (
                <p className="gacha-login-message">로그인하여 이모지 뽑기를 시작하세요!</p>
              )}
    
              {/* 뽑기 확률 정보 버튼 */}
              <button className="probability-info-button" onClick={() => setShowProbabilityModal(true)} disabled={isProcessing}>
                뽑기 확률 정보
              </button>
    
              {/* 총 뽑기 횟수 표시 */}
              <div className="total-pulls-display">
                  <span className="material-icons">casino</span>
                  <span className="total-pulls-text">총 뽑기: {userProfile?.totalPulls || 0}회</span>
                </div>
    
              {lastPulledEmoji && (
                <div className="last-gacha-section">
                  <p className="last-gacha-title">Last Gacha:</p>
                  <div className="last-gacha-emoji-display">
                    {lastPulledEmoji.emoji}
                  </div>
                </div>
              )}
            </div>
          )}
    
          {isGachaModalOpen && (
            <GachaModal
              pulledEmoji={pulledEmoji}
              onClose={handleCloseModal}
            />
          )}
    
          {showProbabilityModal && (
            <ProbabilityModal onClose={() => setShowProbabilityModal(false)} />
          )}
        </div>
      );
};

export default GachaScreen;