import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import emojiData from './emojiData.json';
import './StatsAndGauge.css';

const StatsAndGauge = () => {
  const [stats, setStats] = useState({
    legendaryCount: 0,
    epicCount: 0,
    rareCount: 0,
    uncommonCount: 0,
    commonCount: 0,
    completionRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false); // 사용자 인증 상태 로드 완료
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      if (user) {
        setIsLoading(true);
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const collectedEmojis = userData.collectedEmojis || [];

          let legendaryCount = 0;
          let epicCount = 0;
          let rareCount = 0;
          let uncommonCount = 0;
          let commonCount = 0;
          const uniqueCollectedEmojiIds = new Set(collectedEmojis);

          collectedEmojis.forEach(emojiId => {
            const emoji = emojiData.emojis.find(e => e.id === emojiId);
            if (emoji) {
              switch (emoji.rarity) {
                case 'Legendary':
                  legendaryCount++;
                  break;
                case 'Epic':
                  epicCount++;
                  break;
                case 'Rare':
                  rareCount++;
                  break;
                case 'Uncommon':
                  uncommonCount++;
                  break;
                case 'Common':
                  commonCount++;
                  break;
                default:
                  break;
              }
            }
          });

          const totalUniqueEmojis = emojiData.emojis.length;
          const completionRate = totalUniqueEmojis > 0 
            ? (uniqueCollectedEmojiIds.size / totalUniqueEmojis) * 100 
            : 0;

          setStats({
            legendaryCount,
            epicCount,
            rareCount,
            uncommonCount,
            commonCount,
            completionRate: completionRate.toFixed(2), // 소수점 둘째 자리까지
          });
        }
        setIsLoading(false);
      } else {
        // 로그아웃 상태일 때 통계 초기화
        setStats({
          legendaryCount: 0,
          epicCount: 0,
          rareCount: 0,
          uncommonCount: 0,
          commonCount: 0,
          completionRate: 0,
        });
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]); // user 객체가 변경될 때마다 통계 다시 계산

  if (isLoading) {
    return <div className="stats-loading-skeleton">
      <div className="skeleton-item"></div>
      <div className="skeleton-item"></div>
      <div className="skeleton-item"></div>
      <div className="skeleton-item"></div>
      <div className="skeleton-item"></div>
      <div className="skeleton-item large"></div>
    </div>; // 스켈레톤 로딩 UI
  }

  return (
    <div className="stats-and-gauge-container">
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-icon">👑</span>
          <span className="stat-value">{stats.legendaryCount}</span>
          <span className="stat-label">Legendary</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">✨</span>
          <span className="stat-value">{stats.epicCount}</span>
          <span className="stat-label">Epic</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🌟</span>
          <span className="stat-value">{stats.rareCount}</span>
          <span className="stat-label">Rare</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🌱</span>
          <span className="stat-value">{stats.uncommonCount}</span>
          <span className="stat-label">Uncommon</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">😊</span>
          <span className="stat-value">{stats.commonCount}</span>
          <span className="stat-label">Common</span>
        </div>
      </div>

      <div className="completion-gauge-section">
        <div className="gauge-text">
          <span>완성도: </span>
          <span className="gauge-value">{stats.completionRate}%</span>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill"
            style={{ width: `${stats.completionRate}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default StatsAndGauge;