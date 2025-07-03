import React from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from './context/UserContext'; // useUser 훅 임포트
import './ProfilePage.css'; // ProfilePage 전용 CSS 파일 임포트

const ProfilePage = () => {
  const { userId } = useParams();
  const { userProfile, isLoading, user, allEmojis } = useUser();

  if (isLoading || !allEmojis) {
    return <div>프로필 데이터를 불러오는 중입니다...</div>;
  }

  const featuredEmojis = userProfile?.featuredEmojis || [];

  // featuredEmojis의 id를 실제 이모지 객체로 변환
  const resolvedEmojis = featuredEmojis.map(emojiId => 
    allEmojis.find(emoji => emoji.id === emojiId)
  ).filter(Boolean); // null 또는 undefined 제거

  // 현재 로그인한 사용자의 프로필 페이지가 아닌 경우 (다른 유저의 프로필을 볼 때)
  // 또는 로그인하지 않은 상태에서 프로필 페이지에 접근했을 때
  if (!user || user.uid !== userId) {
    return <div className="error-message">접근 권한이 없거나 사용자 프로필을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="profile-page-container">
      <h2>{userProfile?.displayName || userId}님의 대표 이모지</h2>
      {resolvedEmojis.length > 0 ? (
        <div className="featured-emojis-grid">
          {resolvedEmojis.map((emoji) => (
            <div
              key={emoji.id}
              title={emoji.name}
              className="featured-emoji-display"
            >
              {emoji.emoji}
            </div>
          ))}
        </div>
      ) : (
        <p>설정된 대표 이모지가 없습니다.</p>
      )}
    </div>
  );
};

export default ProfilePage;