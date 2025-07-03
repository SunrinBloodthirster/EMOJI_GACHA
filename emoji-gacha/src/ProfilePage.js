import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import emojiData from './emojiData.json';
import './ProfilePage.css'; // ProfilePage 전용 CSS 파일 임포트

const ProfilePage = () => {
  const { userId } = useParams();
  const [featuredEmojis, setFeaturedEmojis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setError('User ID is missing.');
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const fetchedFeaturedEmojis = data.featuredEmojis || [];
        
        // featuredEmojis의 id를 실제 이모지 객체로 변환
        const resolvedEmojis = fetchedFeaturedEmojis.map(emojiId => 
          emojiData.find(emoji => emoji.id === emojiId)
        ).filter(Boolean); // null 또는 undefined 제거

        setFeaturedEmojis(resolvedEmojis);
        setLoading(false);
      } else {
        setError('User not found or no featured emojis.');
        setLoading(false);
        setFeaturedEmojis([]);
      }
    }, (err) => {
      console.error("Error fetching user data:", err);
      setError('Failed to load user data.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  if (error) {
    return <div className="error-message">오류: {error}</div>;
  }

  return (
    <div className="profile-page-container">
      <h2>{userId}님의 대표 이모지</h2>
      {featuredEmojis.length > 0 ? (
        <div className="featured-emojis-grid">
          {featuredEmojis.map((emoji) => (
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