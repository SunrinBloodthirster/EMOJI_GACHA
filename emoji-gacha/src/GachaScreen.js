import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import GachaModal from './GachaModal';
import './GachaScreen.css'; // GachaScreen 전용 CSS 파일

import { useUser } from './context/UserContext'; // useUser 훅 임포트

const ProbabilityModal = ({ onClose }) => {
  const { allEmojis } = useUser();

  return (
    <div className="probability-modal-overlay" onClick={onClose}>
      <div className="probability-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>뽑기 확률 정보</h3>
        <ul>
          {Object.entries(allEmojis.rarityProbabilities).map(([rarity, prob]) => (
            <li key={rarity}>{rarity}: {(prob * 100).toFixed(2)}%</li>
          ))}
        </ul>
        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  );
};

const GachaScreen = ({ setIsGachaMode }) => {
  const { user, userProfile, allEmojis, isLoading, authIsReady } = useUser(); // useUser 훅에서 user, userProfile, allEmojis, isLoading, authIsReady 가져오기
  const [showGachaModal, setShowGachaModal] = useState(false);
  const [pulledEmoji, setPulledEmoji] = useState(null);
  const [isFreePullAvailable, setIsFreePullAvailable] = useState(false);
  const [lastPulledEmoji, setLastPulmedEmoji] = useState(null); // 최근 뽑은 이모지 상태
  const [showProbabilityModal, setShowProbabilityModal] = useState(false); // 확률 모달 상태
  const [isDrawing, setIsDrawing] = useState(false); // 뽑기 로딩 상태

  const functions = getFunctions();
  const drawEmojiFunction = httpsCallable(functions, 'drawEmoji');

  useEffect(() => {
    const checkFreePullAndLastEmoji = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const lastPull = userData.lastPullTimestamp?.toDate();
          const lastPulledEmojiId = userData.lastPulledEmojiId; // 마지막으로 뽑은 이모지 ID 가져오기

          if (lastPulledEmojiId) {
            const emoji = allEmojis.find(e => e.id === lastPulledEmojiId);
            setLastPulmedEmoji(emoji);
          }

          const now = new Date();
          if (!lastPull || lastPull.getDate() !== now.getDate() || lastPull.getMonth() !== now.getMonth() || lastPull.getFullYear() !== now.getFullYear()) {
            setIsFreePullAvailable(true);
          } else {
            setIsFreePullAvailable(false);
          }
        } else {
          setIsFreePullAvailable(true); // New user, free pull available
        }
      }
    };
    checkFreePullAndLastEmoji();
  }, [user, allEmojis]);

  const handleGachaPull = async (isAdPull = false) => {
    if (!authIsReady || !user) {
      alert('사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    if (!isAdPull && !isFreePullAvailable) {
      alert('오늘은 이미 무료 뽑기를 완료했습니다. 광고를 보고 한 번 더 뽑을 수 있습니다.');
      return;
    }

    setIsGachaMode(true); // 뽑기 모드 활성화
    setIsDrawing(true); // 뽑기 시작 시 로딩 상태 활성화

    try {
      const result = await drawEmojiFunction();
      const newEmoji = result.data; // 서버가 반환한 이모지 객체
      setPulledEmoji(newEmoji); // GachaModal에 이모지 객체 전체 전달
      console.log("Pulled Emoji:", newEmoji); // 디버깅을 위한 로그 추가
      setShowGachaModal(true);

      // 무료 뽑기인 경우에만 클라이언트에서 lastPullTimestamp 업데이트
      if (!isAdPull) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          lastPullTimestamp: new Date(),
          lastPulledEmojiId: newEmoji.id // 마지막으로 뽑은 이모지 ID 저장
        }, { merge: true }); // 문서가 없으면 생성, 있으면 병합
        setIsFreePullAvailable(false);
      }

    } catch (error) {
      console.error("Error calling drawEmoji function:", error);
      alert(`뽑기 실패: ${error.message}`);
      setIsGachaMode(false); // 에러 발생 시 뽑기 모드 비활성화
    } finally {
      setIsDrawing(false); // 뽑기 완료 시 로딩 상태 비활성화
    }
  };

  const handleCloseModal = () => {
    setShowGachaModal(false);
    setPulledEmoji(null);
    setIsGachaMode(false); // 뽑기 모드 비활성화
    // 모달 닫을 때 최근 뽑은 이모지 업데이트 (Firebase에서 다시 불러오도록 트리거)
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then(userSnap => {
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const lastPulledEmojiId = userData.lastPulledEmojiId;
          if (lastPulledEmojiId) {
            const emoji = allEmojis.find(e => e.id === lastPulledEmojiId);
            setLastPulmedEmoji(emoji);
          }
        }
      });
    }
  };

  if (isLoading || !authIsReady) {
    return <div>사용자 정보 확인 중...</div>;
  }

  return (
    <div className={`gacha-screen-container ${showGachaModal ? 'gacha-screen-fullscreen' : ''}`}>
      {!showGachaModal && (
        <div className="gacha-main-buttons">
          {user ? (
            isFreePullAvailable ? (
              <button className="gacha-button" onClick={() => handleGachaPull(false)} disabled={isDrawing}>
                <span>{isDrawing ? '뽑는 중...' : '오늘의 이모지 뽑기'}</span>
              </button>
            ) : (
              <button className="gacha-button ad-button" onClick={() => handleGachaPull(true)} disabled={isDrawing}>
                <span>{isDrawing ? '뽑는 중...' : '광고 보고 한 번 더 뽑기'}</span>
              </button>
            )
          ) : (
            <p className="gacha-login-message">로그인하여 이모지 뽑기를 시작하세요!</p>
          )}

          {/* 뽑기 확률 정보 버튼 */}
          <button className="probability-info-button" onClick={() => setShowProbabilityModal(true)} disabled={isDrawing}>
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

      {showGachaModal && (
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