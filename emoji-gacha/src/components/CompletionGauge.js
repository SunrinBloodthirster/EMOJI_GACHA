import React from 'react';
import './CompletionGauge.css';
import { useUser } from '../context/UserContext'; // Context 훅 임포트

const CompletionGauge = () => {
  // useUserStats 훅 대신 직접 Context에서 데이터를 가져옵니다.
  const { collectedEmojis, allEmojis } = useUser();

  // 계산 로직을 컴포넌트 안으로 가져옵니다.
  const collectedCount = collectedEmojis.length;
  const totalCount = allEmojis.length > 0 ? allEmojis.length : 1; // 0으로 나누는 것 방지
  const completionPercentage = (collectedCount / totalCount) * 100;

  return (
    <div className="completion-gauge-container">
      <div className="gauge-label">
        도감 완성도 ({collectedCount} / {totalCount})
      </div>
      <div className="gauge-bar">
        <div
          className="gauge-progress"
          style={{ width: `${completionPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default CompletionGauge;