import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';
import GachaModal from './GachaModal';
import './GachaScreen.css'; // GachaScreen 전용 CSS 파일
import { drawEmoji } from './utils'; // drawEmoji 함수 임포트
import emojiData from './emojiData.json'; // emojiData 임포트
import useUserStats from './hooks/useUserStats'; // useUserStats 훅 임포트
// import StatsDashboard from './StatsDashboard'; // StatsDashboard 컴포넌트 임포트 (삭제됨)

const ProbabilityModal = ({ onClose }) => {
  return (
    <div className="probability-modal-overlay" onClick={onClose}>
      <div className="probability-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>뽑기 확률 정보</h3>
        <ul>
          {Object.entries(emojiData.rarityProbabilities).map(([rarity, prob]) => (
            <li key={rarity}>{rarity}: {(prob * 100).toFixed(2)}%</li>
          ))}
        </ul>
        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  );
};

const GachaScreen = ({ user, setIsGachaMode }) => {
  const [showGachaModal, setShowGachaModal] = useState(false);
  const [pulledEmoji, setPulledEmoji] = useState(null);
  const [isFreePullAvailable, setIsFreePullAvailable] = useState(false);
  const [lastPulledEmoji, setLastPulmedEmoji] = useState(null); // 최근 뽑은 이모지 상태
  const [showProbabilityModal, setShowProbabilityModal] = useState(false); // 확률 모달 상태

  const { stats, isLoading: statsLoading } = useUserStats(); // useUserStats 훅 호출

  useEffect(() => {
    console.log("GachaScreen - User:", user); // 디버깅 로그
    const checkFreePullAndLastEmoji = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const lastPull = userData.lastPullTimestamp?.toDate();
          const lastPulledEmojiId = userData.lastPulledEmojiId; // 마지막으로 뽑은 이모지 ID 가져오기

          if (lastPulledEmojiId) {
            const emoji = emojiData.emojis.find(e => e.id === lastPulledEmojiId);
            setLastPulmedEmoji(emoji);
          }

          const now = new Date();
          if (!lastPull || lastPull.getDate() !== now.getDate() || lastPull.getMonth() !== now.getMonth() || lastPull.getFullYear() !== now.getFullYear()) {
            setIsFreePullAvailable(true);
            console.log("GachaScreen - Free pull available: true"); // 디버깅 로그
          } else {
            setIsFreePullAvailable(false);
            console.log("GachaScreen - Free pull available: false"); // 디버깅 로그
          }
        } else {
          setIsFreePullAvailable(true); // New user, free pull available
          console.log("GachaScreen - New user, free pull available: true"); // 디버깅 로그
        }
      }
    };
    checkFreePullAndLastEmoji();
  }, [user]);

  const handleGachaPull = async (isAdPull = false) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!isAdPull && !isFreePullAvailable) {
      alert('오늘은 이미 무료 뽑기를 완료했습니다. 광고를 보고 한 번 더 뽑을 수 있습니다.');
      return;
    }

    setIsGachaMode(true); // 뽑기 모드 활성화

    const newEmoji = drawEmoji(); // drawEmoji 함수를 사용하여 이모지 뽑기 (객체 반환)
    setPulledEmoji(newEmoji); // GachaModal에 이모지 객체 전체 전달
    console.log("Pulled Emoji:", newEmoji); // 디버깅을 위한 로그 추가
    setShowGachaModal(true);

    // lastPullTimestamp 및 collectedEmojis 업데이트
    if (!isAdPull) {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        lastPullTimestamp: new Date(),
        collectedEmojis: arrayUnion(newEmoji.id), // 뽑힌 이모지의 ID 저장
        lastPulledEmojiId: newEmoji.id // 마지막으로 뽑은 이모지 ID 저장
      }, { merge: true }); // 문서가 없으면 생성, 있으면 병합
      setIsFreePullAvailable(false);
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
            const emoji = emojiData.emojis.find(e => e.id === lastPulledEmojiId);
            setLastPulmedEmoji(emoji);
          }
        }
      });
    }
  };

  return (
    <div className={`gacha-screen-container ${showGachaModal ? 'gacha-screen-fullscreen' : ''}`}>
      {!showGachaModal && (
        <div className="gacha-main-buttons">
          {user ? (
            isFreePullAvailable ? (
              <button className="gacha-button" onClick={() => handleGachaPull(false)}>
                <span>오늘의 이모지 뽑기</span>
              </button>
            ) : (
              <button className="gacha-button ad-button" onClick={() => handleGachaPull(true)}>
                <span>광고 보고 한 번 더 뽑기</span>
              </button>
            )
          ) : (
            <p className="gacha-login-message">로그인하여 이모지 뽑기를 시작하세요!</p>
          )}

          {/* 뽑기 확률 정보 버튼 */}
          <button className="probability-info-button" onClick={() => setShowProbabilityModal(true)}>
            뽑기 확률 정보
          </button>

          {/* 총 뽑기 횟수 표시 */}
          {statsLoading ? (
            <p className="total-pulls-display">총 뽑기: 로딩 중...</p>
          ) : (
            <div className="total-pulls-display">
              <span className="material-icons">casino</span>
              <span className="total-pulls-text">총 뽑기: {stats.totalPulls}회</span>
            </div>
          )}

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