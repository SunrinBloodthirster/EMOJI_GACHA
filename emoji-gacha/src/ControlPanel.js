import React from 'react';
import { Link } from 'react-router-dom';
import GachaButton from './GachaButton'; // GachaButton 컴포넌트 임포트

const ControlPanel = ({ user }) => {
  const handleAdGacha = () => {
    alert('광고 보고 뽑기 기능은 준비 중입니다!');
  };

  return (
    <div className="control-panel">
      <GachaButton user={user} />
      <button onClick={handleAdGacha}>광고 보고 뽑기</button>
      <Link to="/">내 도감 보기</Link>
      {user && (
        <Link to={`/profile/${user.uid}`}>프로필 공유</Link>
      )}
    </div>
  );
};

export default ControlPanel;
